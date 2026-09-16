# 02 — Design (M2 vertical slice)

Scope: one injected event → rule matching → email channel (dry-run capable) → delivery log row. Based on D03–D05 and the M2 decisions.

## Domain model

| Entity | Fields | Notes |
|---|---|---|
| `User` | `id uuid, name, email` | Recipient. Seeded only, no CRUD. |
| `AlertRule` | `id uuid, userId, eventTypes: EventType[], minSeverity 1..5, keywords: string[], channels: string[], createdAt` | Channels live on the rule (D04). Empty `eventTypes` / `keywords` = no filter on that field. |
| `Event` | `id uuid, type: news\|market\|disaster, severity 1..5, title, summary, tags: string[], payload jsonb, occurredAt` | Common shape (D03); type-specific detail goes in `payload`. |
| `Delivery` | `id uuid, eventId, userId, ruleId, channel, status: sent\|dry-run\|failed, error: string\|null, createdAt` | One row per `(eventId, userId, channel)`. The delivery log. |

`userId`, `eventId` and `ruleId` are plain uuid columns: no TypeORM relations and no FK constraints in M2.

## Matching (pure, no Nest/DB imports)

`matchesRule(event, rule)`: every condition must hold (AND, D04).
- **Type:** `eventTypes` empty, or it contains `event.type`.
- **Severity:** `event.severity >= rule.minSeverity`.
- **Keywords:** `keywords` empty, or ANY keyword matches. Text is lowercased and tokenized with `/[\p{L}\p{N}]+/gu`. A keyword matches the title or summary if its token sequence appears contiguously in the text's tokens ("interest rate" matches "Interest Rate hike"; "rate" does not match "corporate"). It matches a tag only if it equals the tag, case-insensitively.

`planDeliveries(event, rules) → { userId, ruleId, channel }[]`: for each matching rule and each of its channels, emit one entry per `(userId, channel)`; the first matching rule wins the `ruleId`. Rules are passed in `createdAt, id` order, and "first" means first in that order. The output keeps that order, so it is deterministic.

## Request-to-delivery sequence (synchronous, inside the request)

```
POST /events
  → ValidationPipe (DTO: whitelist, forbidNonWhitelisted, transform)
  → persist Event
  → load all AlertRules, ordered by createdAt, id
  → planDeliveries(event, rules)
  → load the Users whose ids appear in the plan (separate query)
  → for each planned delivery:
       channel = registry.get(channel)
         missing  → status failed, error "unknown channel"
       channel.send({ event, user })   (MatchedAlert = event + user only)
         returns  → status from DeliveryResult (sent | dry-run)
         throws   → status failed, error = message
       persist Delivery row
  ← 201 { event, deliveries }
```
A failed delivery never fails the request or the other deliveries. `GET /deliveries` returns the latest 100 rows, newest first.

**Known limitation:** the event and the delivery rows are not in one transaction. If a row write fails after a successful send, that send goes unrecorded. Accepted for M2.

**DTO:** `type` enum; `severity` an integer 1–5; `title` a required non-empty string; `summary` a required string; `tags` an optional string array (default `[]`); `payload` an optional object (default `{}`); `occurredAt` an optional ISO date (default: now).

## Channel abstraction (D05)

```ts
interface MatchedAlert { event: Event; user: User }
interface NotificationChannel { readonly id: string; send(alert: MatchedAlert): Promise<DeliveryResult> }
```
- The channels are provided as an array under one injection token, built with `useFactory`. `ChannelRegistry` receives that array, indexes it by `id`, throws at startup on a duplicate id, and exposes `get(id)`.
- Adding a channel = one class + one entry in the factory. The pipeline, matcher and entities stay unchanged.
- Differs from D05: `send` has no separate `target` argument; the recipient travels inside `MatchedAlert` as the `User`.
- **Email (`id = 'email'`, nodemailer):** subject `[<type> · severity <n>] <title>`, plain-text body with summary, tags and occurredAt. If `SMTP_HOST` is unset, nothing is sent: the rendered message is logged with Nest's `Logger` and the channel returns `dry-run`. Otherwise it sends via SMTP (`SMTP_HOST/PORT/USER/PASS/FROM`) and returns `sent`.

## Configuration and bootstrap

- `POSTGRES_*` and `SMTP_*` come from `process.env`, with the same defaults as `docker-compose.yml`. The root `.env` is loaded with `process.loadEnvFile()` if the file exists; there is no config library.
- TypeORM registers entities explicitly or via `autoLoadEntities`, never by glob (the API is ESM). `synchronize` is on only when `NODE_ENV !== 'production'`. No migrations.
- Seed on bootstrap, only when `users` is empty: 2 users and 3 rules, including one same-user/same-channel overlap to demonstrate the dedup. Seed users use `@example.com` addresses.

## At larger scale

- **Event intake:** `POST /events` enqueues the event (outbox or queue) and returns 202; matching runs in workers.
- **Matching:** loading all rules per event stops scaling. Pre-filter in SQL (type, severity) or index the rules by type and keyword.
- **Dedup:** a unique constraint on `(eventId, userId, channel)` instead of relying only on the planner.
- **Integrity:** FK constraints from `AlertRule.userId` and `Delivery.eventId/userId/ruleId` to their tables.
- **Channels:** per-channel queues with retries, backoff and rate limits; send and log row are written idempotently.
- **Delivery log:** paginated, filterable reads; partitioning or retention by `createdAt`.
- **Config:** a validated config schema, with secrets from a secret manager instead of `.env`.

