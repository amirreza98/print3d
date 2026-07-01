# order-service

Spring Boot 3.4.1 microservice (Java 21, Maven) that owns **orders, payment, and
fulfilment** for Fabrica. It creates orders, drives Stripe Checkout, ingests Stripe
webhooks, and emits domain events for downstream services.

Part of a database-per-service architecture: this service owns **only** its own
`orders` schema. Flyway owns the schema; Hibernate runs `ddl-auto: validate` and
never writes DDL. No other service reads these tables — integration is over HTTP
(through the gateway) and over Kafka domain events.

## Stack

- Spring Boot 3.4.1 (Web, Data JPA, Validation, Actuator)
- Java 21, Maven, Lombok
- PostgreSQL, schema `orders`, Flyway migrations
- Spring Kafka (domain event publication)
- Stripe Java SDK (Checkout + webhooks)
- Micrometer + Prometheus

## Data model

All tables live in the `orders` schema (`src/main/resources/db/migration/V1__init.sql`):

| Table                    | Purpose                                                             |
|--------------------------|---------------------------------------------------------------------|
| `orders`                 | One order with a **frozen configuration snapshot** + payment/fulfilment state |
| `processed_stripe_event` | Idempotency ledger of handled Stripe event ids                      |
| `outbox`                 | Domain events awaiting publication to Kafka                         |

The configuration snapshot (`product_id, material, color, size_label, weight_g,
unit_price, total_price`) is **copied onto the order at checkout time**. The service
never re-prices against the catalog, so a later price change cannot alter a placed order.

## API

Base path `/api/orders`.

| Method | Path                        | Access     | Description                                      |
|--------|-----------------------------|------------|--------------------------------------------------|
| POST   | `/api/orders/checkout`      | user       | Create a `PENDING_PAYMENT` order + Stripe Checkout Session; returns its URL |
| POST   | `/api/orders/webhook`       | Stripe     | Stripe webhook; signature-verified and idempotent |
| GET    | `/api/orders/{id}`          | user/owner | One order (a user sees only their own)           |
| GET    | `/api/orders`               | user/owner | Owner sees all; a user sees only their own       |
| PATCH  | `/api/orders/{id}/status`   | owner-only | Update fulfilment status (PRINTING/SHIPPED/DELIVERED) |

Responses are DTOs (`dto/`) — entities never cross the controller boundary.

### Authorization (header trust)

Like `product-service`, this service trusts identity headers forwarded by the gateway:

- `X-User-Id` — the authenticated user id (required on all routes except the webhook).
- `X-User-Role` — `OWNER` unlocks owner-only routes; anything else gets `403`.

**This assumes the gateway is the sole public entry point** and strips any
client-supplied copies of these headers before forwarding. The service does no token
validation of its own. The Stripe webhook is the one unauthenticated route — it is
instead authenticated by verifying the Stripe signature against the raw request body.

## Distributed-systems patterns

### 1. Idempotency (Stripe webhooks)

Stripe may deliver the same event more than once. Before acting on an event,
`StripeEventProcessor.process` checks `processed_stripe_event` for the event id and
**inserts that id in the same transaction as the order update**. So the order mutation
and the "I handled this" record commit together, atomically:

- Redelivery after a commit → the existence check short-circuits; no-op.
- Two concurrent deliveries → both may pass the check, but the primary-key insert on
  `processed_stripe_event` lets exactly one commit; the loser hits a
  `DataIntegrityViolationException`, rolls back its order update too, and is swallowed
  as already-processed.

Either way an event is applied **exactly once**.

### 2. Transactional outbox

Request handling **never publishes to Kafka directly**. When an order changes state, the
order row and an `outbox` row are written in **one transaction** (`OutboxService.write`).
Publication is decoupled:

- `OutboxPoller` (`@Scheduled`) reads `PENDING` outbox rows oldest-first, publishes each
  to the `order-events` topic (keyed by aggregate id), and flips it to `PUBLISHED` only
  after the broker acknowledges.
- If Kafka is down, rows simply stay `PENDING` and are retried next cycle — no event is
  lost and none is published without first being committed to the database
  (at-least-once delivery, no dual-write inconsistency).

### 3. Saga foundation (choreography)

There is **no orchestrator**. Services coordinate by reacting to domain events on
`order-events`:

- `order.paid` — emitted when a Checkout Session completes. A print/fulfilment service
  subscribes and begins production.
- `order.status_changed` — emitted on every fulfilment transition (`PRINTING`,
  `SHIPPED`, `DELIVERED`), carrying `from`/`to`.

**Compensating action (future work):** if a downstream print fails, that service emits
its own `print.failed` event. order-service subscribes, moves the order to `FAILED`, and
issues a **Stripe refund** for the captured `payment_intent` — the compensating
transaction that unwinds the payment step of the saga. That refund would itself be
written through the same outbox/idempotency machinery, keeping every step atomic and
replay-safe. No central coordinator is required; each service owns its own reaction.

## Configuration

Runs on port **8082**. `application.yml` reads from the environment:

| Variable                  | Meaning                                         |
|---------------------------|-------------------------------------------------|
| `DATABASE_URL`            | JDBC URL of the Postgres database               |
| `DB_USER` / `DB_PASSWORD` | Database credentials                            |
| `STRIPE_SECRET_KEY`       | Stripe API secret key                           |
| `STRIPE_WEBHOOK_SECRET`   | Stripe webhook signing secret                   |
| `KAFKA_BOOTSTRAP_SERVERS` | Kafka bootstrap servers for the outbox poller   |

`open-in-view` is disabled. Actuator exposes `health`, `info`, and `prometheus`.

## Run locally

```bash
cp .env.example .env          # then edit as needed
export $(grep -v '^#' .env | xargs)
mvn spring-boot:run
```

Health: <http://localhost:8082/actuator/health>
Metrics: <http://localhost:8082/actuator/prometheus>

Forward Stripe webhooks in development with the Stripe CLI:

```bash
stripe listen --forward-to localhost:8082/api/orders/webhook
```

## Build

```bash
mvn clean package
```

## Docker

```bash
docker build -t fabrica/order-service .
docker run --rm -p 8082:8082 \
  -e DATABASE_URL=jdbc:postgresql://host.docker.internal:5432/orders \
  -e DB_USER=orders -e DB_PASSWORD=orders \
  -e STRIPE_SECRET_KEY=sk_test_xxx -e STRIPE_WEBHOOK_SECRET=whsec_xxx \
  -e KAFKA_BOOTSTRAP_SERVERS=host.docker.internal:9092 \
  fabrica/order-service
```
