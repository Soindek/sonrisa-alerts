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
### D10 — Root `overrides.vitest = 4.1.11`
**Alternatives:** `.npmrc` with `legacy-peer-deps=true`; a newer npm; removing vitest from both apps.
**Why:** `npm install` crashed in npm 10's arborist (`Cannot read properties of null (reading 'edgesOut')`) whenever an app depended on vitest 4. Several variants were dry-run in scratch copies; only removing vitest entirely or pinning it via root overrides passed. 4.1.11 is what both apps' `^4.1.2` ranges resolve to anyway. `legacy-peer-deps` was rejected because it disables peer checks repo-wide; a newer npm because the M1 prompt fixed the toolchain at npm 10. Which package requests `vitest@*` was not identified — time-boxed and closed. Remove the override once npm 10 is fixed.

### D11 — `engines.node = ^22.22.3 || ^24.15.0 || ^26.0.0`
**Alternatives:** `>=22`; my local patch version as minimum.
**Why:** Based on Angular CLI 22's range (`^22.22.3 || ^24.15.0 || >=26.0.0`), with the last term narrowed to `^26.0.0` so an untested future major is not declared supported. Nest 12 declares `>= 20`; the stricter wins. Not enforced (`engine-strict` off): it documents, it does not block.

### D12 — Compose defaults for all `POSTGRES_*` vars
**Alternatives:** required vars only.
**Why:** The plan's "done" is clone → `docker compose up` → two npm commands. Defaults (`change-me` password) make that work with no `.env`; required vars fail on a clean clone.

### D13 — `.env` deny rules narrowed to an explicit list
**Alternatives:** keep the `.env*` glob; no deny at all.
**Why:** The glob also blocked `.env.example`. Project settings now deny Read/Write/Edit on `.env` and Write on `.env.local` / `.env.production`. A user-level rule still blocks `.env.example`, so I wrote that file myself. Known limit: the Read deny covers the Read tool only, not `cat` via Bash.

### D14 — `npm audit` findings left as-is
**Alternatives:** `npm audit fix`; `npm audit fix --force`.
**Why:** 5 findings (2 high), all in dev dependencies — `npm audit --omit=dev` is clean. Out of scope for a 24h take-home; `--force` would bump majors blindly.

### D15 — CLI-generated READMEs deleted in both apps
**Why:** Boilerplate noise for a reviewer. The root README (M6) is the single entry point.

### D16 — Commit message format follows CLAUDE.md, not my ad-hoc instruction
**Why:** My instruction (`M1: ...`) contradicted the `<type>: <summary>` rule in CLAUDE.md. Claude Code committed with my message as instructed, then flagged the mismatch; I amended to `feat: ...`.

### D17 — Deferred: remove `vite-tsconfig-paths` from `apps/api`
**Why:** No api tsconfig declares `paths`, so the plugin does nothing; its comment refers to `nest g library`, which this project does not use. Vite 8's native `resolve.tsconfigPaths` exists but is marked experimental and is not needed without aliases. Scheduled for the start of M2, not worth reopening M1.

**Budget note:** M1 was planned at 1h and took 1.5h, almost entirely the npm crash. Recorded rather than hidden.

### D18 — Two commits per milestone: code, then docs
**Why:** Separating `feat:` from `docs:` lets a reviewer diff the code alone. The one-commit rule was written before anything existed to commit; relaxed after M1.
