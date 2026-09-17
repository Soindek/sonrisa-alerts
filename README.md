# sonrisa-alerts

Take-home task for Sonrisa: an event alert feature — users set up rules, matching events are delivered by email and Slack through an extensible channel layer, and an admin view shows what was sent. Built from a one-paragraph PM brief with Claude Code.

**The process is the submission; the code is evidence.** If you read only three files, read `docs/00-plan.md`, `docs/03-decision-log.md` and `docs/04-ai-review-log.md`.

## Quick start

Requirements: Node `^22.22.3` (or 24.15+ / 26), npm 10, Docker.

```bash
docker compose up -d            # Postgres 16 on localhost:5432
npm install                     # npm audit reports 5 dev-dependency findings; see D14
```

Then, **each in its own terminal** (both stay in the foreground; stop them with Ctrl+C):

```bash
npm run dev:api                 # NestJS on http://localhost:3000/api — seeds 2 users and 3 rules on first start
npm run dev:admin               # Angular admin on http://localhost:4200 (proxies /api to :3000)
```

No `.env` is needed: every setting has a default, and email and Slack run in **dry-run** mode — the message is built and written to the API log instead of being sent, and the delivery row gets status `dry-run`. To change settings, copy `.env.example` to `.env`. If port 5432 is taken, set `POSTGRES_PORT` there.

Checks: `npm run lint -w apps/api`, `npm test -w apps/api`, `npm test -w apps/admin -- --watch=false`, `npm run build -w apps/admin`.

**Reset:** `docker compose down -v` deletes the database; the next API start seeds it again.

## Demo

The seed creates these rules. A rule matches when all its conditions hold; an empty condition means "no filter".

| Rule | User | Types | Min severity | Keywords | Channels |
|---|---|---|---|---|---|
| R1 | Anna Kovács | disaster | 3 | árvíz, flood | email |
| R2 | Anna Kovács | any | 4 | — | email |
| R3 | Bence Tóth | market | 2 | interest rate | email, slack |

The admin page has two tabs. **Rules** lists each user's rules, deletes them and creates new ones (channels are offered from the API, so a newly registered channel appears without UI changes). **Events** injects an event and shows the delivery log.

Inject these on the Events tab (every field except Tags is required; Tags is comma-separated), or send the matching file from `demo/` with curl:

| # | Type | Sev | Title | Summary | Tags | Result | Shows |
|---|---|---|---|---|---|---|---|
| 1 | market | 3 | Interest rate hike | The central bank raised rates by 25 bp. | — | Bence: email + slack | one rule, two channels |
| 2 | disaster | 4 | Árvíz a Dunán | Rekordközeli vízszint Budapestnél. | — | Anna: **one** email | R1 (keyword) and R2 (severity ≥ 4) both match; one delivery per user and channel, carrying the first rule's id (D19) |
| 3 | disaster | 3 | Heavy rain in the north | Rivers are rising after two days of rain. | FLOOD, hungary | Anna: email | keyword matched as a tag, case-insensitive; severity 3 keeps R2 out |
| 4 | market | 3 | Corporate earnings beat forecasts | Quarterly results were strong. | — | nothing | whole-word matching: "rate" does not hit "corporate" (D20) |

```bash
curl -s -X POST localhost:3000/api/events -H 'Content-Type: application/json' --data-binary @demo/case-2-arviz.json
curl -s localhost:3000/api/deliveries
```

The files are pure ASCII (`\u` escapes for Hungarian letters), so the text arrives intact from any Windows shell; typing accented text into a curl command line may not. Only one rule id per delivery is visible; that R1 and R2 both matched in case 2 is what the dedup unit tests in `apps/api/src/matching/plan-deliveries.spec.ts` cover — the visible part is that Anna gets one email, not two.

**Rule round trip (D31):** on the Rules tab create a rule for Bence — type news, min severity 1, keyword `election`, channel slack. On the Events tab inject news / 2 / "Election results announced" → one Slack delivery to Bence. Delete the rule and inject the same event again → no delivery.

**Failure isolation (D22):**

1. Stop the API (Ctrl+C in its terminal).
2. Create a `.env` in the repo root containing only these two lines (a closed port):
   ```
   SMTP_HOST=localhost
   SMTP_PORT=2525
   ```
3. Start the API again and send case 1 (`demo/case-1-market.json`) or inject it from the UI.
4. Expected: the email row is `failed` with `connect ECONNREFUSED` (`::1:2525` or `127.0.0.1:2525`), the Slack row is still `dry-run`, and the request returns 201.
5. Stop the API, delete `.env`, start it again.

## How it works

`POST /api/events` validates and stores the event, loads all rules, plans deliveries with two pure functions (`matchesRule`, `planDeliveries`), sends each one through the channel registry and stores one delivery row per user and channel — all inside the request. A failing channel produces a `failed` row, never a failed request. `GET /api/deliveries` returns the latest 100 rows with event and user details. Rules are managed with `GET /api/users` (users with their rules), `POST /api/rules` (validated: known user, registered channels, keywords with at least one letter or digit, size limits) and `DELETE /api/rules/:id`; `GET /api/channels` lists the registered channels. Details and "at larger scale" notes: `docs/02-design.md`.

**Adding a channel** is one class implementing `NotificationChannel` (`id` + `send(alert)`) and one entry in the factory in `apps/api/src/channels/channels.module.ts`. The pipeline, matcher and entities do not change — Slack was added this way in M3.

```
apps/api     NestJS 12, TypeORM 0.3, Postgres — events, rules, matching, channels, delivery log
apps/admin   Angular 22, Material — Events tab (inject form + delivery log), Rules tab (rules + new-rule form)
demo/        request bodies for the demo cases
docs/        plan, assumptions, design, decisions, AI review log, review reports
prompts/     every prompt sent to Claude Code: raw.md (verbatim, by hook), log.md (summary + outcome)
.claude/     project settings, the prompt-logging hook, the /review command
```

## How to read the process

1. `docs/00-plan.md` — how I read the brief, milestones, the re-plan after M2
2. `docs/scoping-notes.md` — the pre-build scoping session: what the AI proposed, what I overrode
3. `docs/01-assumptions.md` — what the brief left open, and the non-goals with "how it would be added"
4. `docs/03-decision-log.md` — D01–D31, each with the rejected alternative
5. `docs/04-ai-review-log.md` — every meaningful AI output, how I checked it, the verdict; recurring failure patterns at the end
6. `docs/reviews/` — AI pre-review reports (M2 retroactive, M3, M4, M7) and the fresh-clone README test (M6)
7. `docs/screenshots/` — the admin view during the M7 manual test
8. `prompts/` and `CLAUDE.md` — what Claude Code was told, and the rules it worked under. Documentation drafted by the second assistant (a desktop chat that reviewed Claude Code's output) was written straight into the repo and has no prompt-log entry — see "How I use the AI" in `docs/00-plan.md`.

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
| M6 README, patterns, retro, fresh-clone test | 1h | 19:40–21:36, ~2h |
| M7 rule management (after re-checking the brief) | 1h | 22:30–23:05, then (next morning) 05:40–06:20 manual test, tabs and review fixes; ~1.25h |

Hands-on total: about 7.5h up to M4 (10:15–19:38 minus the 15:30–17:30 break), about 11h including M6 and M7.

The original plan totalled ~15h for a brief that describes a short feature. That ratio was a planning error; after M2 the scope was cut and time-boxed (D26). The largest single cost was M1's dependency crash; the largest avoidable cost was polishing documentation in several passes instead of once per milestone.

## Known limitations

- No auth on the API or the admin view (D06); the delivery log exposes user emails.
- Events are injected or seeded; no live news/market source (D02). RSS was cut (D26).
- No retries, queue, dedup of similar events or rate limiting (non-goals, `docs/01-assumptions.md`).
- Event and delivery rows are not written in one transaction (D22).
- Slack uses one shared webhook, so the message names the recipient (D28).
- TypeORM `synchronize` instead of migrations; schema sync can print a `pg` deprecation warning at startup, typically once the tables exist (D23, D24).
- Unit tests only (api 62, admin 42); no end-to-end or HTTP-level tests through Nest's pipes (D26, M7 pre-review #4). The admin bundle is ~646 kB against a 500 kB warning budget (D29).
- Rules are managed by the operator in the admin view; there is no end-user login or self-service UI (A4, D31).
