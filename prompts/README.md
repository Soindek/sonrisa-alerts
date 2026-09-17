# Prompts

- `raw.md` — every prompt sent to Claude Code, verbatim, appended by the `UserPromptSubmit` hook in `.claude/hooks/log-prompt.js`. Entries wrapped in `<task-notification>` are background-task events, not my prompts (review log row 12). Two early prompts have no entry (row 9).
- `log.md` — the same prompts with an English summary, the plan and the outcome, written by Claude Code. The prompts are pasted verbatim, so headings inside them (`## Backend …`) appear as extra headings in this file; the real entries are the ones starting with `## <timestamp> — <milestone>`.
- `planning-chat-summary.md` — a digest of the separate chat in which I reviewed Claude Code's output and turned my notes into these prompts. The chat itself is not published; see the file for why.
