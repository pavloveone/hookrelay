# Hookrelay

A mini Svix/Hookdeck - a webhook delivery service built to practice reliable async delivery end to end, instead of another CRUD app.

Tenants send events through the API. Each event fans out to every endpoint subscribed to it, gets queued, and delivered with retries, exponential backoff, and a per-endpoint circuit breaker so a dead subscriber doesn't get hammered forever. Duplicate events (same idempotency key) are deduplicated instead of re-delivered.

## Stack

NestJS, PostgreSQL (TypeORM), Redis + BullMQ

## How it's structured

The data model is `Tenant` → `Endpoint`/`Event` → `Delivery` → `DeliveryAttempt`. An `Event` is just "something happened" - it doesn't know who receives it. Fan-out creates one `Delivery` per subscribed `Endpoint`, and every HTTP try against it is logged as a separate `DeliveryAttempt`, success or failure.

Idempotency isn't a "check first, then insert" - that has a race window under concurrent requests. Instead, inserts rely on a real unique constraint on `(tenant, idempotencyKey)`; a conflict means the event already exists, and the existing row is returned instead. Retries are handled by BullMQ's own `attempts`/`backoff` options rather than a hand-rolled retry loop. The circuit breaker (`closed` / `open` / `half_open`) lives on the `Endpoint` itself, so a run of failures stops the queue from wasting HTTP timeouts on an endpoint that's clearly down, and a single probe request after a cooldown decides whether to close it again. Every delivered payload is signed with HMAC-SHA256 using the endpoint's own `secret`, sent as `x-hookrelay-signature`, so a subscriber can verify a webhook actually came from Hookrelay and wasn't tampered with in transit.

## API

**Tenants** (`/tenants`)
- `POST /tenants` - register a tenant, returns an `apiKey` (shown once)

**Endpoints** (`/endpoints`)
- `POST /endpoints` - register a subscriber URL for the authenticated tenant, returns a `secret` (shown once, used to sign delivered payloads). Requires `x-api-key`.

**Events** (`/events`)
- `POST /events` - ingest an event (`eventType`, `payload`, `idempotencyKey`) for the authenticated tenant; a repeated `idempotencyKey` returns the original event instead of creating a duplicate. Requires `x-api-key`.

`x-api-key` is the `apiKey` returned from `POST /tenants` - it resolves which tenant the request belongs to, so the tenant is never taken from the request body itself.

## Running locally

```bash
docker compose up -d
```

`.env`:
```env
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=hookrelay
DB_HOST=localhost
DB_PORT=5432

REDIS_HOST=localhost
REDIS_PORT=6379
```

```bash
npm install
npm run migration:run
npm run start:dev
```

## Roadmap

- [x] Domain model (`Tenant`/`Endpoint`/`Event`/`Delivery`/`DeliveryAttempt`) + migrations
- [x] Idempotent event ingestion, race-safe via a DB unique constraint
- [x] Fan-out to subscribed endpoints through BullMQ
- [x] Retry with exponential backoff
- [x] Circuit breaker per endpoint (`closed` / `open` / `half_open`)
- [x] API-key auth (tenant resolved from `x-api-key`, never trusted from the request body)
- [x] HMAC-SHA256 signature on delivered payloads (`x-hookrelay-signature`, signed with the endpoint's `secret`)
- [ ] Rate limiting per tenant
- [ ] Structured logging
- [ ] Dead-letter replay endpoint for exhausted deliveries
- [ ] Read endpoints (list/get tenants, endpoints, deliveries)
- [ ] Unit/e2e tests

## Author

Aleksandr Pavlov
[LinkedIn](https://linkedin.com/in/pavloveone)
