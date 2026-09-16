# Project rules for Claude Code

This is a 24h take-home task evaluated on process, not on code. Follow these rules exactly.

## Prompt logging
After every user prompt, append an entry to `prompts/log.md` before doing anything else:
```
## <ISO timestamp> — <milestone>
**Prompt (verbatim):** <the user's message>
**Summary (EN):** <one line>
**Outcome:** <filled in when the turn ends: what was produced, what the user rejected>
```
Never skip this, never rewrite earlier entries.

## Git
- Never work on `main`. If the current branch is `main`, create a feature branch yourself before touching any file, name it from the task at hand, and tell me the name in one line. Do not ask first.
- Branch naming: `feat/m<N>-<short-name>` (e.g. `feat/m1-skeleton`).
- Never push. Never merge. Never open a PR. The user reviews every diff, pushes and merges by hand.
- Commit only when the user explicitly says "commit". Never commit on your own.
- One `feat:` commit per milestone. `docs/` and `prompts/` go in a separate `docs:` commit at milestone end; prompt-log lines written after that commit land in the next milestone's `docs:` commit.
- Format: `<type>: <summary, max 60 chars>` then a blank line, then a body of 1–3 plain sentences: what changed and, if applicable, what generated output was rejected or rewritten and why.
- No bullet lists, no emoji, no "This commit…" boilerplate, no co-author trailers.

## Working style
- Before implementing, state the plan in 3–6 lines and stop for confirmation if the task is larger than one file.
- When unsure about an API or library detail, say so instead of guessing.
- Do not add features, options or abstractions that were not asked for.
- Edit `docs/03-decision-log.md` and `docs/04-ai-review-log.md` only when the user explicitly asks; never add rows or entries unprompted.

## Stack
Angular (frontend, `apps/admin`), NestJS (backend, `apps/api`), Postgres via docker-compose, TypeORM. Dry-run mode for email/Slack when env vars are missing.