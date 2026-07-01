# product-service

Spring Boot 3.4.1 microservice (Java 21, Maven) that owns the **3D-print product
catalog** for Fabrica. It exposes public read endpoints for the storefront and
owner-only write endpoints for catalog administration.

Part of a database-per-service architecture: this service owns **only** its own
`product` schema. It never reaches into another service's tables, and no other
service reaches into this one — integration happens over HTTP through the gateway.

## Stack

- Spring Boot 3.4.1 (Web, Data JPA, Validation, Actuator)
- Java 21, Maven
- PostgreSQL, schema `product`
- Flyway for schema migrations (Hibernate is `validate`-only — it never writes DDL)
- Lombok, Micrometer + Prometheus

## Data model

Two tables, both in the `product` schema:

| Table            | Purpose                                                                 |
|------------------|-------------------------------------------------------------------------|
| `product`        | Catalog item keyed by a human slug (`phone-stand`, `planter`, `bracket`) |
| `material_price` | Per-gram price for a `(product, material, size)` combination             |

A product's **available materials are derived** from the distinct `material`
values in `material_price` — there is no array column. `material_price.product_id`
is a foreign key with `ON DELETE CASCADE` and is indexed.

Schema and seed data live in `src/main/resources/db/migration/`:

- `V1__init.sql` — tables, constraints, index
- `V2__seed.sql` — three sample products matching `frontend/lib/api.ts`

## API

Base path `/api/products`.

| Method | Path                 | Access      | Description                              |
|--------|----------------------|-------------|------------------------------------------|
| GET    | `/api/products`      | public      | List active products (+ derived materials) |
| GET    | `/api/products/{id}` | public      | One active product with its price lines  |
| POST   | `/api/products`      | owner-only  | Create a product                         |
| PUT    | `/api/products/{id}` | owner-only  | Update a product (and replace its prices) |
| DELETE | `/api/products/{id}` | owner-only  | Delete a product (cascades prices)       |

Responses are DTOs (`dto/`) — entities never cross the controller boundary.

### Authorization

The gateway authenticates the caller and forwards their role in the
`X-User-Role` header. Write endpoints require `X-User-Role: OWNER`; anything else
gets `403 Forbidden`.

## Configuration

Runs on port **8081**. `application.yml` reads from the environment:

| Variable       | Meaning                          |
|----------------|----------------------------------|
| `DATABASE_URL` | JDBC URL of the Postgres database |
| `DB_USER`      | Database username                |
| `DB_PASSWORD`  | Database password                |

`open-in-view` is disabled. Actuator exposes `health`, `info`, and `prometheus`.

## Run locally

```bash
cp .env.example .env          # then edit as needed
export $(grep -v '^#' .env | xargs)
mvn spring-boot:run
```

Health check: <http://localhost:8081/actuator/health>
Metrics: <http://localhost:8081/actuator/prometheus>

## Build

```bash
mvn clean package
```

## Docker

```bash
docker build -t fabrica/product-service .
docker run --rm -p 8081:8081 \
  -e DATABASE_URL=jdbc:postgresql://host.docker.internal:5432/product \
  -e DB_USER=product -e DB_PASSWORD=product \
  fabrica/product-service
```
