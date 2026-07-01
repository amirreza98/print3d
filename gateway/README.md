# gateway

The single front door. Every browser request enters here. It does three things:

1. **Routes** requests to the right service by URL path.
2. **Verifies JWTs locally** against auth-service's JWKS — no call to auth-service per request.
3. **Rate-limits** per user (or IP) using Redis token buckets.

Spring Cloud Gateway (reactive). Matches the pattern from the Classroom SaaS.

## Request flow

```
Browser
   │
   ▼
Gateway :8080
   ├── /api/auth/**      → auth-service   (public)
   ├── GET /api/products → product-service (public)
   ├── /api/products/**  → product-service (JWT required)
   └── /api/agent/**     → agent-orchestrator (JWT required)
```

For protected routes the gateway checks the JWT signature using the **public**
key set fetched once from `JWKS_URI` (auth-service's `/api/auth/jwks`). ES256 is
detected automatically. The token is never sent back to auth-service to be
checked — that's the whole point of JWKS: fast, stateless verification.

Role checks (owner-only actions) happen at the individual services, which read
the `role` claim the gateway forwards.

## Rate limiting

Every route runs through a Redis-backed token bucket:

- `replenishRate: 10` — 10 requests/sec sustained
- `burstCapacity: 20` — short bursts up to 20

The **key** is the user's token subject when signed in, else their IP
(`RateLimitConfig.userKeyResolver`). So limits follow a user across devices, and
anonymous abuse is capped per IP.

## Run

Needs Redis and auth-service running.

```bash
cp .env.example .env      # defaults assume everything on localhost
./mvnw spring-boot:run    # or: mvn spring-boot:run
# gateway on http://localhost:8080
```

Point the frontend's `NEXT_PUBLIC_API_BASE_URL` at `http://localhost:8080`.

## Endpoints

- `/actuator/health` — liveness/readiness probes
- `/actuator/prometheus` — metrics scrape target (observability, later)

## Note

This service is Java/Maven and was **not** compiled in the environment it was
generated in (no Maven Central access there). The config is written carefully
against Spring Boot 3.4.1 / Spring Cloud 2024.0.0, but run `mvn clean package`
locally as the first real verification.

## Why the gateway exists (interview answer)

Without it, the frontend would talk to 6+ services directly, each needing its
own CORS, auth-checking, and rate-limiting code. The gateway centralizes all
three in one place. Services behind it can assume: "if a request reached me, its
token is already verified." That separation is the point of an API gateway.
