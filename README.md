# Hookrelay

A mini Svix/Hookdeck - a webhook delivery service built to practice reliable async delivery end to end, instead of another CRUD app.

Tenants send events through the API. Each event fans out to every endpoint subscribed to it, gets queued, and delivered with retries, exponential backoff, and a per-endpoint circuit breaker so a dead subscriber doesn't get hammered forever. Duplicate events (same idempotency key) are deduplicated instead of re-delivered.

## Stack

NestJS, PostgreSQL (TypeORM), Redis + BullMQ

## How it's structured

The data model is `Tenant` → `Endpoint`/`Event` → `Delivery` → `DeliveryAttempt`. An `Event` is just "something happened" - it doesn't know who receives it. Fan-out creates one `Delivery` per subscribed `Endpoint`, and every HTTP try against it is logged as a separate `DeliveryAttempt`, success or failure.

Idempotency isn't a "check first, then insert" - that has a race window under concurrent requests. Instead, inserts rely on a real unique constraint on `(tenant, idempotencyKey)`; a conflict means the event already exists, and the existing row is returned instead. Retries are handled by BullMQ's own `attempts`/`backoff` options rather than a hand-rolled retry loop. The circuit breaker (`closed` / `open` / `half_open`) lives on the `Endpoint` itself, so a run of failures stops the queue from wasting HTTP timeouts on an endpoint that's clearly down, and a single probe request after a cooldown decides whether to close it again.

## API

**Tenants** (`/tenants`)
- `POST /tenants` - register a tenant, returns an `apiKey` (shown once)

**Endpoints** (`/endpoints`)
- `POST /endpoints` - register a subscriber URL for a tenant, returns a `secret` (shown once, used for payload signing later)

**Events** (`/events`)
- `POST /events` - ingest an event (`tenantId`, `eventType`, `payload`, `idempotencyKey`); a repeated `idempotencyKey` returns the original event instead of creating a duplicate

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
- [ ] Rate limiting per tenant
- [ ] HMAC signature on delivered payloads
- [ ] Structured logging
- [ ] API-key auth (endpoints currently take `tenantId` directly, no guard yet)
- [ ] Dead-letter replay endpoint for exhausted deliveries
- [ ] Read endpoints (list/get tenants, endpoints, deliveries)
- [ ] Unit/e2e tests

## Author

Aleksandr Pavlov
[LinkedIn](https://linkedin.com/in/pavloveone)
