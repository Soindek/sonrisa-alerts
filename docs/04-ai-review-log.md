# 04 — AI Review Log

What the AI produced, how I checked it, what I did with it. One row per meaningful output. Filled in during the build, not afterwards.

| # | Milestone | What was generated | Check applied | Verdict | Notes / what I changed |
|---|-----------|--------------------|---------------|---------|------------------------|
| 1 | M0 | UserPromptSubmit hook to log raw prompts | ran it (test prompt) | accepted with edits | Payload field name was a guess (payload.prompt) — verified by sending a test prompt and reading the file. It worked, but the IDE integration prepends an <ide_opened_file> context block that isn't part of what I typed; added a regex to strip it so the log stays a record of my own words. |
| 2 | M1 | Nest 12 / Angular 22 scaffolds, CLI version numbers | ran it | accepted | Versions treated as hallucination-prone; `npm view <pkg> version` and generated package.json confirmed them. |
| 3 | M1 | First explanation of the `npm install` crash (browser-playwright 5.0.1 vs vitest ^4) | read it | rejected | No package in the repo declares browser-playwright. Asked for evidence; CC withdrew the claim. |
| 4 | M1 | Second explanation + several scratch dry-runs + `overrides` proposal | ran it | accepted | Real install, `nest build`, `ng build`, `docker compose ps` healthy, `curl` 200 — "dry-run works" was not accepted as proof. Root cause marked unknown. |
| 5 | M1 | `docker-compose.yml` | read it | accepted with edits | Defaults added for all vars. -U was already present. Volume keeps its initial password — recreated with `compose down -v` after writing `.env`. |
| 6 | M1 | Scaffold tests after the vitest override | unit test | accepted | api 1/1 green, admin 2/2. Run now so M5 is not the first place to find a broken runner. |
| 7 | M1 | Staging for the M1 commit | read it | accepted with edits | CC flagged `tsconfig.build.tsbuildinfo` (build artifact) and `.claude/settings.json` (staged without being asked). Unstaged the first, kept the second, deleted CLI READMEs. |
| 8 | M1 | M1 commit | ran it | accepted with edits | CC flagged that my message did not match CLAUDE.md format; amended. |
| 9 | M1 | `prompts/log.md` timestamps reconciled with `raw.md` | read it | accepted | Two prompts have no raw entry; CC marked them instead of inventing timestamps. Cause not established: the hook appends every prompt it receives with no dedupe or filter beyond IDE blocks, so the script itself does not explain the gaps. |
| 10 | M1 | Row 9 text in this log, written without being asked | read it | accepted | CLAUDE.md reserves this file for me; CC edited it beyond the instruction. Content checked and kept. |

Verdict values: `accepted` · `accepted with edits` · `rejected` · `rewritten by me`

Check values: `ran it` · `read it` · `unit test` · `manual test in UI` · `compared with docs`

## Patterns noticed
*(recurring failure modes of the AI on this task — filled in at the end)*
