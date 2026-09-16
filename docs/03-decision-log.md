# 03 — Decision Log

Format: decision, alternatives considered, why. Newest at the bottom. Entries are added as decisions are made, not rewritten afterwards.

---

### D01 — Stack: Angular + NestJS (TypeScript end to end) + Postgres
**Alternatives:** Angular + Spring Boot (Java); a single Next.js app.
**Why:** I am strongest in Angular, so the admin view is cheap. On the backend I know Java better than Node, but NestJS mirrors Angular's DI/module structure closely enough that the learning cost is small, and one language means one toolchain, one test runner and AI-generated code I can read on both sides. Spring Boot would have cost setup time I'd rather spend on process artifacts. Next.js was rejected because I have no React experience and this is not the place to learn it.

### D02 — Events come from a simulated source, not a live API
**Alternatives:** integrate a real news/market API (e.g. NewsAPI, a market data feed).
**Why:** A live integration adds auth, rate limits and an unstable demo for no evaluation gain — the brief says nothing about data sources. An `EventSource` interface plus a seed/inject implementation shows the architecture; a real provider is a separate deliverable. Stretch: an RSS source to prove the abstraction is not decorative.

### D03 — Event model
`Event { id, type: news|market|disaster, severity: 1..5, title, summary, tags: string[], payload: json, occurredAt }`.
**Alternatives:** free-form JSON events; per-type tables.
**Why:** A small common shape is enough for matching. `payload` keeps type-specific detail (e.g. ticker + % change) without forcing a schema on it now. Per-type tables would be premature.

### D04 — Alert rule model and matching semantics
`AlertRule { id, userId, eventTypes: [], minSeverity, keywords: [], channels: [] }`. Match = all specified conditions true; keywords match case-insensitively against title, summary and tags.
**Alternatives:** boolean expression language; per-channel rules.
**Why:** AND-only is explainable and testable in an hour; an expression language is a project of its own. Channels live on the rule (not per rule-channel pair) because that is how a user thinks about it: "tell me about this, here and here".

### D05 — Channel abstraction: registry of adapters
`NotificationChannel { readonly id: string; send(alert: MatchedAlert, target: ChannelTarget): Promise<DeliveryResult> }`, registered in a `ChannelRegistry` at module init. Delivery orchestration looks channels up by id from the rule.
**Alternatives:** strategy switch statement; separate service per channel injected everywhere.
**Why:** "Add more channels later" is the one explicit architectural requirement in the brief. With the registry, a new channel is one class and one registration; nothing else in the pipeline changes. This is the claim I want to be able to demonstrate.

### D06 — Admin view scope
Users + rules list, delivery log table, manual event injection. No auth.
**Alternatives:** full CRUD for rules; auth-guarded admin.
**Why:** The admin view is the demo surface and the observability surface. Injection + log is what proves the pipeline works. Rule CRUD from the UI is nice-to-have and is excluded to protect time; auth is listed as a non-goal.

### D07 — Postgres over SQLite
**Alternatives:** SQLite (zero infra), in-memory.
**Why:** I know Postgres and pgAdmin; debugging speed in a 24h window beats marginally simpler setup. In-memory rejected because the delivery log must survive a restart to be useful. Docker Compose makes the reviewer's setup one command.

### D08 — Non-goals are documented, not silently dropped
Retry, dedup, rate limiting, end-user UI, auth, real providers — all excluded and listed in `01-assumptions.md` with a one-line "how it would be added".
**Why:** The brief rewards visible scoping. An unlisted omission looks like an oversight; a listed one looks like a decision.

### D09 — Process rules for the AI
- Prompts are rewritten (by me, in a separate chat) *before* being sent, so the logged prompt is the real prompt. No post-hoc editing of the history.
- The AI commits only on explicit instruction, once per milestone, short messages.
- No generated code is accepted without running it, reading it, or a test; the check and its outcome are logged in `04-ai-review-log.md`.
**Why:** The submission is the process. If the record is not trustworthy, nothing else matters.

---
*(entries continue during the build)*
