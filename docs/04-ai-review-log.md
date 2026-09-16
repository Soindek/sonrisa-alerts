# 04 — AI Review Log

What the AI produced, how I checked it, what I did with it. One row per meaningful output. Filled in during the build, not afterwards.

| # | Milestone | What was generated | Check applied | Verdict | Notes / what I changed |
|---|-----------|--------------------|---------------|---------|------------------------|
| 1 | M0 | UserPromptSubmit hook to log raw prompts | ran it (test prompt) | accepted with edits | Payload field name was a guess (payload.prompt) — verified by sending a test prompt and reading the file. It worked, but the IDE integration prepends an <ide_opened_file> context block that isn't part of what I typed; added a regex to strip it so the log stays a record of my own words. |

Verdict values: `accepted` · `accepted with edits` · `rejected` · `rewritten by me`

Check values: `ran it` · `read it` · `unit test` · `manual test in UI` · `compared with docs`

## Patterns noticed
*(recurring failure modes of the AI on this task — filled in at the end)*
