# sonrisa-alerts

Take-home task for Sonrisa: an event alert feature — users set up rules, matching events are delivered by email and Slack through an extensible channel layer, and an admin view shows what was sent. Built from a one-paragraph PM brief with Claude Code.

**The process is the submission; the code is evidence.** If you read only three files, read `docs/00-plan.md`, `docs/03-decision-log.md` and `docs/04-ai-review-log.md`.

## Quick start

Requirements: Node `^22.22.3` (or 24.15+ / 26), npm 10, Docker.

```bash
docker compose up -d            # Postgres 16 on localhost:5432
npm install
npm run dev:api                 # NestJS on http://localhost:3000/api — seeds 2 users and 3 rules on first start
npm run dev:admin               # Angular admin on http://localhost:4200 (proxies /api to :3000)
```

No `.env` is needed: every setting has a default, and email and Slack run in **dry-run** mode — the message is built and written to the API log instead of being sent, and the delivery row gets status `dry-run`. To change anything, copy `.env.example` to `.env`. If port 5432 is taken, set `POSTGRES_PORT` there.

Checks: `npm run lint -w apps/api`, `npm test -w apps/api`, `npm test -w apps/admin -- --watch=false`, `npm run build -w apps/admin`.

## Demo

The seed creates these rules. A rule matches when all its conditions hold; an empty condition means "no filter".

| Rule | User | Types | Min severity | Keywords | Channels |
|---|---|---|---|---|---|
| R1 | Anna Kovács | disaster | 3 | árvíz, flood | email |
| R2 | Anna Kovács | any | 4 | — | email |
| R3 | Bence Tóth | market | 2 | interest rate | email, slack |

Inject these from the admin page and watch the delivery log:

| Type | Sev | Title | Tags | Result | Shows |
|---|---|---|---|---|---|
| market | 3 | Interest rate hike | — | Bence: email + slack | one rule, two channels |
| disaster | 4 | Árvíz a Dunán | — | Anna: **one** email | R1 and R2 both match; one delivery per user and channel (D19) |
| disaster | 3 | Heavy rain in the north | `FLOOD, hungary` | Anna: email | keyword matched as a tag, case-insensitive |
| market | 3 | Corporate earnings beat forecasts | — | nothing | whole-word matching: "rate" does not hit "corporate" (D20) |

**Failure isolation (D22):** stop the API, put `SMTP_HOST=localhost` and `SMTP_PORT=2525` (a closed port) into `.env`, start it again and inject the first case. The email row is `failed` with `ECONNREFUSED`, the Slack row is still `dry-run`, and the request succeeds. Remove the two lines afterwards.

From a shell instead of the UI (Git Bash; `\u` escapes keep non-ASCII text intact on Windows):

```bash
curl -s -X POST localhost:3000/api/events -H 'Content-Type: application/json' \
  -d '{"type":"disaster","severity":4,"title":"Árvíz a Dunán","summary":"Rekordközeli vízszint."}'
curl -s localhost:3000/api/deliveries
```

## How it works

`POST /api/events` validates and stores the event, loads all rules, plans deliveries with two pure functions (`matchesRule`, `planDeliveries`), sends each one through the channel registry and stores one delivery row per user and channel — all inside the request. A failing channel produces a `failed` row, never a failed request. `GET /api/deliveries` returns the latest 100 rows with event and user details. Details and "at larger scale" notes: `docs/02-design.md`.

**Adding a channel** is one class implementing `NotificationChannel` (`id` + `send(alert)`) and one entry in the factory in `apps/api/src/channels/channels.module.ts`. The pipeline, matcher and entities do not change — Slack was added this way in M3.

```
apps/api     NestJS 12, TypeORM 0.3, Postgres — events, rules, matching, channels, delivery log
apps/admin   Angular 22, Material — inject-event form + delivery log table
docs/        plan, assumptions, design, decisions, AI review log, review reports
prompts/     every prompt sent to Claude Code: raw.md (verbatim, by hook), log.md (summary + outcome)
.claude/     project settings, the prompt-logging hook, the /review command
```

## How to read the process

1. `docs/00-plan.md` — how I read the brief, milestones, the re-plan after M2
2. `docs/scoping-notes.md` — the pre-build scoping session: what the AI proposed, what I overrode
3. `docs/01-assumptions.md` — what the brief left open, and the non-goals with "how it would be added"
4. `docs/03-decision-log.md` — D01–D30, each with the rejected alternative
5. `docs/04-ai-review-log.md` — every meaningful AI output, how I checked it, the verdict; recurring failure patterns at the end
6. `docs/reviews/` — AI pre-review reports (M2 retroactive, M3, M4)
7. `prompts/` and `CLAUDE.md` — what Claude Code was told, and the rules it worked under. Documentation drafted by the second assistant (a desktop chat that reviewed Claude Code's output) was written straight into the repo and has no prompt-log entry — see "How I use the AI" in `docs/00-plan.md`.

**Working loop per milestone:** I decide scope and design (in a separate chat, recorded in the decision log) → a pre-approved prompt to Claude Code → it reports real command output → `feat:` commit → `/review main` in a fresh session (`.claude/commands/review.md`, D27) → I triage every finding → manual run of the app → `fix:` commit → `docs:` commit → PR, merged by me. The AI never pushes or merges; `main` is branch-protected.

## Time spent

| | Planned | Actual (local time, from commits and the prompt log) |
|---|---|---|
| M0 plan, assumptions, decisions | 1.5h | 10:15–12:05, ~2h (scoping chat, then docs) |
| M1 skeleton | 1h | 12:42–14:42, ~2h — mostly an npm 10 install crash (D10) |
| M2 vertical slice | 3h | 14:59–17:46 with a 2h break, ~1h hands-on |
| AI pre-review loop (D27) | — | 17:46–18:01 |
| M3 Slack + review fixes | 45 min | 18:01–18:41, ~40 min incl. manual run |
| M4 admin view + review fixes | 1.5h | 18:41–19:38, ~1h incl. manual UI test |
| M6 README, patterns, retro | 1h | from 19:40 |

Hands-on total up to M4: about 7.5h (10:15–19:38 minus the 15:30–17:30 break).

The original plan totalled ~15h for a brief that describes a short feature. That ratio was a planning error; after M2 the scope was cut and time-boxed (D26). The largest single cost was M1's dependency crash; the largest avoidable cost was polishing documentation in several passes instead of once per milestone.

## Known limitations

- No auth on the API or the admin view (D06); the delivery log exposes user emails.
- Events are injected or seeded; no live news/market source (D02). RSS was cut (D26).
- No retries, queue, dedup of similar events or rate limiting (non-goals, `docs/01-assumptions.md`).
- Event and delivery rows are not written in one transaction (D22).
- Slack uses one shared webhook, so the message names the recipient (D28).
- TypeORM `synchronize` instead of migrations; it triggers a `pg` deprecation warning at startup (D23, D24).
- Unit tests only (api 42, admin 19); no end-to-end tests (D26). The admin bundle is ~554 kB against a 500 kB warning budget (D29).
