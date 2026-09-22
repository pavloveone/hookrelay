# Hookrelay

A mini Svix/Hookdeck - a webhook delivery service, built to practice reliable async delivery end to end.

Tenants send events through the API, and each one fans out to every subscriber, gets queued, and delivered with retries and a circuit breaker so a dead endpoint doesn't get hammered forever.

## Stack

NestJS, PostgreSQL (TypeORM), Redis + BullMQ

## How it's structured

`Tenant` → `Endpoint`/`Event` → `Delivery` → `DeliveryAttempt`. An event doesn't know who receives it - fan-out creates one delivery per subscribed endpoint, and every HTTP try gets logged separately, success or fail.

Idempotency relies on a DB unique constraint rather than a check-then-insert, avoiding a race under concurrent requests. Retries use BullMQ's own backoff. Each endpoint tracks its own circuit breaker state, so a dead subscriber can't burn through timeouts for everyone else. Delivered payloads are HMAC-signed so subscribers can verify they actually came from Hookrelay.

## API

**Tenants**
- `POST /tenants` - register, get back an `apiKey`

**Endpoints** (needs `x-api-key`)
- `POST /endpoints` - register a URL to receive events, get back a `secret` for verifying signatures

**Events** (needs `x-api-key`)
- `POST /events` - send an event; repeat the same `idempotencyKey` and you get the original back instead of a duplicate

The tenant is always resolved from `x-api-key`, never taken from the request body.

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
- [ ] Rate limiting per tenant
- [ ] Structured logging
- [ ] Dead-letter replay endpoint
- [ ] Read endpoints (list/get)
- [ ] Tests

## Author

Aleksandr Pavlov
[LinkedIn](https://linkedin.com/in/pavloveone)
