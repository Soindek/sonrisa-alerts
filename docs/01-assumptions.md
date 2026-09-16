# 01 — Assumptions

Things the brief does not say. Each one is a decision I made so that work could start; the reasoning for the bigger ones is in `03-decision-log.md`.

## Product

- **A1.** "Something important" = an event with a **type** (`news | market | disaster`), a **severity** (1–5) and free-text **tags**. Importance is defined by the user's rule, not by the system.
- **A2.** A user configures an **alert rule**: which event types, minimum severity, optional keywords (matched against title/summary/tags), and which channels to deliver to. A user can have several rules.
- **A3.** A rule matches when **all** its specified conditions hold. There is no boolean expression language.
- **A4.** Users already exist and are already authenticated. Auth, signup and the end-user UI for managing rules are **out of scope**; rules are managed via API (and visible in the admin view).
- **A5.** "Admin view" = an internal screen for operators: list users and their rules, see the delivery log (event, channel, status, error), and manually inject an event for testing.

## Data / integration

- **A6.** Events are produced by an `EventSource` abstraction. In this submission the source is **simulated** (seed data + manual injection). No live news/market/disaster API is integrated.
- **A7.** Email delivery runs in **dry-run** mode unless SMTP env vars are set. Slack uses an incoming webhook URL from env; without it, dry-run.
- **A8.** Dry-run deliveries are still written to the delivery log with status `dry-run`, so the pipeline is observable without external credentials.

## Non-goals (consciously excluded, with a note on how they would be added)

| Excluded | How it would be added |
|----------|----------------------|
| Retry / backoff on failed delivery | Persist attempts, add a queue (BullMQ) in front of `send()` |
| Deduplication of near-identical events | Content hash + time window on ingest |
| Rate limiting / digest mode | Per-user delivery counter, batch into digest job |
| End-user alert management UI | Angular feature module over the existing rules API |
| Auth / roles for admin | Guard on the admin routes; out of scope for 24h |
| Real external event providers | Additional `EventSource` implementations |
| End-to-end / HTTP tests | Nest testing module + supertest against a throwaway Postgres (dropped in D26; logic is unit-tested) |
