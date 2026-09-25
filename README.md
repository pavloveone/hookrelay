# Hookrelay

A mini Svix/Hookdeck - a webhook delivery service, built to practice reliable async delivery end to end.

Tenants send events through the API, and each one fans out to every subscriber, gets queued, and delivered with retries and a circuit breaker so a dead endpoint doesn't get hammered forever.

## Stack

NestJS, PostgreSQL (TypeORM), Redis + BullMQ

## How it's structured

`Tenant` → `Endpoint`/`Event` → `Delivery` → `DeliveryAttempt`. An event doesn't know who receives it - fan-out creates one delivery per subscribed endpoint, and every HTTP try gets logged separately, success or fail.

Idempotency relies on a DB unique constraint rather than a check-then-insert, avoiding a race under concurrent requests. Retries use BullMQ's own backoff. Each endpoint tracks its own circuit breaker state, so a dead subscriber can't burn through timeouts for everyone else. Delivered payloads are HMAC-SHA256 signed with the endpoint's `secret` and sent as the `x-hookrelay-signature` header, so subscribers can verify a webhook actually came from Hookrelay. Rate limiting is per tenant rather than per IP, so one noisy tenant can't eat another's quota. Logging is structured JSON (Pino) - every HTTP request, and each pipeline event worth knowing about (an event's fan-out, each delivery attempt, circuit breaker transitions) carries the relevant IDs instead of a plain string.

## API

**Tenants**
- `POST /tenants` - register, get back an `apiKey`
- `GET /tenants/me` - the authenticated tenant's own info (needs `x-api-key`)

**Endpoints** (needs `x-api-key`)
- `POST /endpoints` - register a URL to receive events, get back a `secret` for verifying signatures
- `GET /endpoints` / `GET /endpoints/:id` - list or fetch your own endpoints

**Events** (needs `x-api-key`)
- `POST /events` - send an event; repeat the same `idempotencyKey` and you get the original back instead of a duplicate

**Deliveries** (needs `x-api-key`)
- `GET /deliveries` / `GET /deliveries/:id` - list or fetch deliveries for your own endpoints, including attempt history
- `POST /deliveries/:id/replay` - manually retry a delivery that's `exhausted` its automatic retries

Every read is scoped to the authenticated tenant - fetching a resource that belongs to someone else returns a 404, not their data.

Send the `apiKey` as an `x-api-key` header on every request to `/endpoints` and `/events`. The tenant is resolved from that header, never taken from the request body.

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

- [x] Domain model + migrations
- [x] Idempotent event ingestion
- [x] Fan-out through BullMQ
- [x] Retry with exponential backoff
- [x] Per-endpoint circuit breaker
- [x] API-key auth
- [x] HMAC-signed payloads
- [x] Rate limiting per tenant
- [x] Read endpoints (list/get), scoped to the authenticated tenant
- [x] Dead-letter replay endpoint for exhausted deliveries
- [x] Structured logging (Pino), with request logs and key pipeline events (fan-out, delivery attempts, circuit breaker transitions)
- [ ] Tests

## Author

Aleksandr Pavlov
[LinkedIn](https://linkedin.com/in/pavloveone)
