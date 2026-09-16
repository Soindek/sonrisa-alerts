# M6 README test — fresh clone, new Claude Code session (Opus), README only

Run from `D:\dev\vibecode\sonrisa-readme-test` (clone of main after PR #6). The session was told to follow only README.md, not read the code or docs, fix nothing, and clean up afterwards. Report as returned by the session:

I followed the README's Quick start and Demo on the fresh clone. Everything worked except one thing: the README's only curl command, run as written, garbles the Hungarian text. Case 2 still shows "one email", but only because R2 (severity) matched, not R1's árvíz keyword. Everything is cleaned up, but the clone isn't fully clean any more: this repo's prompt-logging hook added 41 lines to prompts/raw.md. I didn't touch it; revert it if you want the clone clean.

| # | README step | What happened | Matches README? | What is unclear or wrong in the README |
|---|---|---|---|---|
| 0 | Requirements: Node ^22.22.3, npm 10, Docker | Node 22.23.2, npm 10.9.8, Docker 29.6.1 / Compose v5.2.0 | Yes | — |
| 1 | docker compose up -d | Exit 0; pulled postgres:16; container healthy after ~8s on 5432 | Yes | — |
| 2 | npm install | Exit 0; 635 packages, 1 deprecation warning, 5 audit vulnerabilities (2 low, 1 moderate, 2 high) | Yes | The audit warning isn't mentioned. Minor. |
| 3 | npm run dev:api | Stays running; "Seeded 2 users and 3 rules"; GET :3000/api/deliveries → 200 [] | Yes | It doesn't say this runs in the foreground, so steps 3 and 4 need separate terminals. The pg deprecation warning only showed on the second start. |
| 4 | npm run dev:admin | Stays running; GET :4200/ → 200 with `<app-root>`; GET :4200/api/deliveries → 200 through the proxy | Yes | Same terminal issue. |
| 5 | "No .env is needed" | Everything ran in dry-run mode without .env | Yes | — |
| 6 | Case 1: market / 3 / "Interest rate hike" | Without summary: 400 summary must be a string. With summary: 201, Bence email + slack, both dry-run | Yes, once summary is added | The table has no summary column, but summary is required. Only case 2 has a curl, so the field names for cases 1, 3 and 4 have to be copied from it. |
| 7 | Case 2 via the README curl, exactly as written | 201, but stored title is `�rv�z a Dun�n`. One email, from rule 6b45b91a (R2) only | Result looks right, for the wrong reason | The text says "\u escapes keep non-ASCII text intact" but the sample uses plain UTF-8. On Windows the text gets garbled, so R1's árvíz keyword can't match. |
| 7b | Case 2 with \u escapes (sent as a pure-ASCII file) | Title `Árvíz a Dunán` stored correctly; exactly one email from rule 746b2d43 (R1) | Yes | Typing \u escapes straight into this shell didn't help, because they were converted to real characters before curl ran. Sending from a file worked. |
| 8 | Case 3: disaster / 3 / tags FLOOD, hungary | Sent as `"tags":["FLOOD","hungary"]`: 201, Anna email via R1 | Yes | It doesn't say tags is a JSON array of strings; I had to guess. |
| 9 | Case 4: "Corporate earnings beat forecasts" | 201, deliveries: [] | Yes | — |
| 10 | Failure isolation: stop API, add SMTP lines to .env, restart, inject case 1 | Created .env with only the two lines. Email failed with `connect ECONNREFUSED ::1:2525`, Slack dry-run, HTTP 201; same result via :4200 | Yes | It doesn't say whether to create .env from .env.example or with just these two lines. I couldn't read .env.example because of a permission block here. "Remove the two lines" leaves an empty .env behind; "delete .env" would be clearer. It also doesn't say how to stop the API. |
| 11 | "R1 and R2 both match" | The API shows only one ruleId per delivery, with no rule names | Can't be checked | A reviewer can't see from the API or its log that two rules matched. |
| 12 | Cleanup | Not covered by the README | — | No teardown or reset step (docker compose down -v), so demo data from earlier runs stays in the log. |

Suggested README fixes, most important first:

1. Fix the curl sample: use real `\u00c1rv\u00edz a Dun\u00e1n` escapes (or `--data-binary @event.json`) so it matches the note above it. As written it quietly breaks case 2's keyword match on Windows.
2. Say summary is required: add a Summary column to the demo table, or a note like "all cases need summary".
3. Add a copy-paste curl for every case, including case 3 with `"tags":["FLOOD","hungary"]` and the failure-isolation case.
4. Make failure isolation concrete: create .env containing just those two lines (or copy .env.example and set them), stop the API with Ctrl+C, and delete .env afterwards. Also say the error reads `connect ECONNREFUSED ::1:2525`.
5. Say steps 3 and 4 need their own terminals, and that the admin app can start before the API.
6. Add a teardown/reset line: `docker compose down -v` to wipe the database and re-seed on the next start.
7. Make "R1 and R2 both match" checkable (for example, the ruleId to look for), or reword the claim to what a reviewer can actually see.
8. Minor: make the pg warning wording less absolute (it didn't show on every start), and note the npm audit warnings.

Cleanup reported by the session: whole process trees for both dev servers killed; `.env` created and deleted; `docker compose down -v` exit 0; ports 3000, 4200 and 5432 free (3000 still showed closing connections with no process). Nothing committed or pushed.

## Triage

All eight fixes accepted and applied in the README (review log row 26). Fix 3 was solved with request files in `demo/` instead of more inline curl commands, because the session showed that escapes typed into a Windows shell are not reliable either. Fix 7: rule ids are random per database, so the README now says what is visible (one email) and points to the unit tests for the rest.
