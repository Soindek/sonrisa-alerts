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

### D19 — Delivery unit: one per (event, user, channel)
**Alternatives:** one delivery per matching rule.
**Why:** A user with two overlapping rules wants one email about one event, not two. `planDeliveries` collapses matches per `(userId, channel)`; the row keeps the first matching rule's id, where "first" means rules ordered by `createdAt`, then `id`. `createdAt` was added to `AlertRule` for this — ordering by uuid alone would have been arbitrary. At larger scale a unique constraint on `(eventId, userId, channel)` backs the planner.

### D20 — Keyword matching: case-insensitive whole-token sequences
**Alternatives:** substring match (`includes`).
**Why:** Substring matching lets "rate" hit "corporate". Title and summary are lowercased and tokenized with `/[\p{L}\p{N}]+/gu` (Unicode-aware, so "árvíz" works; `\b` is not); a keyword matches if its token sequence appears contiguously ("interest rate" matches "Interest Rate hike"). Tags match only on exact, case-insensitive equality. Known gap: no Unicode normalization yet, so a decomposed "á" does not match — fixed in M3 with NFC.

### D21 — An empty condition means "no filter"
**Alternatives:** empty `eventTypes` matches nothing.
**Why:** Follows A3 ("all *specified* conditions"). A rule with no keywords is a pure type/severity rule; a rule with no types listens to every type.

### D22 — Synchronous pipeline inside the request, failures isolated per delivery
**Alternatives:** queue + workers; outbox.
**Why:** One process, one request, easy to follow and to demo: persist event → load rules → plan → send → persist one row per delivery → `201 { event, deliveries }`. An unknown channel, a missing user or a throwing `send()` becomes a `failed` row and never fails the request or the other deliveries. Known limitation: event and delivery rows are not one transaction, so a send whose row write fails goes unrecorded. At larger scale: `202` + queue/outbox, per-channel workers with retries (already a non-goal in `01-assumptions.md`).

### D23 — Persistence shortcuts for the slice
**Decisions:** TypeORM `synchronize` only when `NODE_ENV !== 'production'`, no migrations; ids stored as plain uuid columns without relations or FKs; users loaded in a separate query; seed on bootstrap only when `users` is empty, with `@example.com` addresses so a configured SMTP cannot mail a real person; rules seeded one by one so their `createdAt` order is deterministic.
**Why:** Each shortcut removes setup time without changing the behaviour under test. At larger scale: migrations, FK constraints, a seed script outside the app.

### D24 — Dependencies: typeorm 0.3.31, no `@types/nodemailer`, no config library
**Alternatives:** typeorm 1.1.1 (`latest`); `@nestjs/config`.
**Why:** Claude Code said it was unsure of the 1.x API. I pinned the maintained 0.3 line (0.3.31, July 2026) so its output could be checked against an API it knows; `@nestjs/typeorm` 12 supports both. Moving to 1.x is a separate step. `nodemailer` 10 ships its own types, so `@types/nodemailer` (8.x) would describe the wrong API. The root `.env` is loaded with Node's built-in `process.loadEnvFile()`, resolved from the compiled `dist/main.js`, not from the working directory.
**Known consequence (found in a manual run after M3):** on startup `pg` 8.23 prints `DeprecationWarning: Calling client.query() when the client is already executing a query is deprecated and will be removed in pg@9.0`. Traced with `NODE_OPTIONS=--trace-deprecation`: TypeORM 0.3's `RdbmsSchemaBuilder.build` → `PostgresQueryRunner.getTables` runs `getUserDefinedTypeName` queries in `Promise.all` on one connection. It only runs because `synchronize` is on (D23), so it is a dev-only startup path, not our code. Harmless today; it becomes an error with `pg@9`, so keep `pg@^8` until TypeORM is upgraded or migrations replace `synchronize`.

### D25 — Channel contract differs from D05: recipient travels in the alert
`NotificationChannel.send(alert: MatchedAlert)` with `MatchedAlert = { event, user }` — no separate `target` argument.
**Why:** Every channel needs the recipient, and the user is the only target type in scope. Channels are instantiated directly in the `useFactory` that feeds `ChannelRegistry`, so a new channel is one class plus one array entry; the registry throws on duplicate ids at startup. Email: nodemailer, `dry-run` when `SMTP_HOST` is empty, SMTP port 587 by default (`secure` only on 465).

### D26 — Scope cut after M2
**Alternatives:** keep the original 15h plan (M0–M7).
**Why:** In the screening call the task was described as one candidates usually finish in 2–3 hours (the brief itself gives no estimate); after about 5 hours only M2 was done, and the plan totalled ~15h. That ratio is itself a planning error, so the remaining work is cut and time-boxed (see the table in `00-plan.md`): the separate test milestone (M5) is dropped because the matcher and planner tests shipped with M2; e2e tests and the RSS stretch (M7) become non-goals; the admin view is limited to the delivery log and event injection. Planned vs actual time is reported in the README.

**Budget note:** M2 was planned at 3h and took about 1h of build time (12:59Z–13:23Z implementation, plus design review), after ~0.5h of prompt preparation.

### D27 — AI pre-review in a fresh session, human triage
A versioned slash command, `.claude/commands/review.md`, reviews the branch diff against `CLAUDE.md`, `docs/02-design.md` and this log. It runs in a new Claude Code session, not the one that wrote the code, and it may not edit files. I triage every finding (accept / reject / fix) and record the verdicts in `04-ai-review-log.md`; the saved report goes to `docs/reviews/`.
**Alternatives:** GitHub Copilot PR review; the Claude Code GitHub Action; my own full manual read of every diff.
**Why:** The authoring session does not question its own decisions, so the reviewer gets only the diff and the stated intent. Keeping the review rules in the repo makes them versioned, repeatable and visible to a reader — the same context-engineering idea as `CLAUDE.md`. The GitHub-side tools need CI or a subscription, which D26 and the scoping notes cut. Manual review stays, but focused on the flagged lines instead of the whole diff. The scoping notes promised a second-pass AI review; M1–M2 did it only through a separate chat, so M2 is reviewed retroactively with the command as its first run.

### D28 — Slack: one workspace webhook, escaped text
**Alternatives:** a Slack app with `chat.postMessage` and a Slack user id per user; the official Slack SDK.
**Why:** Assumption A7 already fixes Slack to an incoming webhook from env. One webhook means one shared channel, so the message names the recipient. Built-in `fetch` with a 5 s timeout needs no dependency; a non-2xx response becomes a `failed` delivery with the status and body. Because `POST /events` is unauthenticated (D06), `&`, `<` and `>` in event and user text are escaped so a title like `<!channel>` cannot ping the channel or disguise a link (found by the M3 pre-review, D27). Per-user delivery through a Slack app is listed under "At larger scale" in `02-design.md`.
**Process note:** M3 has a separate `fix:` commit after `feat:` — the pre-review findings, kept apart so the history shows what the review changed.

### D29 — Admin view: one page, Material, dev proxy, no shared types package
**Decisions:** a single standalone page with signals and reactive forms (no NgRx, no routes); Angular Material 22.1.7 with a prebuilt theme; an Angular dev proxy for `/api` instead of CORS; the API moved under the `/api` prefix; `GET /api/deliveries` enriched with event title/type/severity and user name/email via two `findBy(In(...))` queries.
**Alternatives:** NgRx; plain CSS; CORS in Nest; a `shared/` package for DTOs.
**Why:** One page with two requests and local state does not need a store — NgRx here would be the overengineering this task warns about. Material gives a readable table and form quickly; the cost is a ~554 kB initial bundle (624 kB before the unused router was removed) against the 500 kB warning budget, accepted for an internal admin tool. The proxy keeps one origin in dev, so the backend needs no CORS setting. The response type is written twice (api and admin), which the M4 pre-review flagged: with one consumer and one endpoint, a shared package costs more than it saves; it becomes worth it with a second consumer or a generated OpenAPI client.

### D30 — Retrospective: what I would do differently
- **Plan to the size of the brief.** A task pitched as 2–3 hours got a 15-hour plan. Next time: one page of assumptions, a vertical slice and a time box first; widen only with time left.
- **Put the review loop in from M1.** The versioned `/review` command (D27) found a real M2 bug after merge. Set up on day one, it would have caught it before.
- **Close every prompt with process hygiene.** Whole process tree killed, ports and process list checked, timestamps copied from the hook log — all learned the hard way (review log rows 11, 18, 23).
- **Write docs once per milestone.** Several correction passes over the M1 logs cost more than the milestone itself.
- **At larger scale** the design notes in `02-design.md` apply: queue-based intake, SQL pre-filtering, FK constraints, retries per channel, a Slack app per user, migrations instead of `synchronize`, auth on the admin surface, and e2e tests against a throwaway database.

### D31 — Re-check against the brief: rule management added, EventSource claim corrected
After M6 I compared the finished work with the task text line by line.
- **Rule management was missing.** The brief's first sentence is "users … set up alerts", but rules existed only as seed data, although A4, A5 and D06 describe rules managed via API and listed in the admin view. M7 adds `GET /api/users` (with rules), `POST /api/rules`, `DELETE /api/rules/:id`, `GET /api/channels` and a rules panel in the admin page. End-user auth and a separate end-user UI stay out of scope (A4): the admin panel stands in for "users set up alerts".
- **`EventSource` was never built.** D02 and A6 describe an interface with a seed/inject implementation; the code has only `POST /api/events`. With RSS dropped (D26) a single implementation would have been decorative, so it is not added now. D02 stays as written (this log is append-only); A6 carries a correction note.
**Alternatives:** document rule management as a non-goal; add an `EventSource` interface with one manual implementation.
**Why:** Rules are the core of the brief, so leaving them seed-only would miss the one thing the PM asked for first. An interface with one caller proves nothing, so the honest fix there is the documentation.

### D32 — Correction to D26 and D30 on the time estimate
The "2–3 hours" in D26 and D30 was a remark in the screening call, not part of the brief, which says to plan for 24 hours — and it may well have referred to the coding alone. The ~15h plan fit that window. The cut in D26 still stands as a scope decision, but it corrected the number of milestones, not an overrun: the code took about 2–3 hours, and the rest of the ~11 hours went into documentation, reviews and verification. The full retrospective, including what I would add with more time, is in `docs/05-retrospective.md`.
