# 05 — Retrospective

Written after the last milestone, with hindsight. D30 in the decision log is the short version; this file is the full one.

## Time, in context

The task says to plan for 24 hours. The screening call mentioned that candidates usually finish it in 2–3 hours — a remark, not part of the brief, and possibly about the coding alone. My first plan (~15h) fit the 24-hour window, but it split the work into more milestones than the feature needed; after M2 I cut and time-boxed it (D26, corrected by D32). Writing the code took roughly those 2–3 hours. The rest — about 11 hours in total — went into what the task evaluates: planning, decision and review logs, AI pre-reviews, manual runs, a fresh-clone README test and correcting what the checks found.

## Process — what I would do differently

- **Re-check against the brief after every milestone, not only at the end.** Rule management, the first thing the PM asked for, was seed-only until the final comparison caught it (D31). A five-minute line-by-line check after M2 would have found it.
- **Start the review loop and the manual UI run in M1.** The `/review` command came in only after M2 and still found a real bug there (row 20). The manual runs kept finding defects the reviewer missed (rows 24, 28).
- **Put process hygiene into the prompt template from day one:** kill the whole process tree and prove it, copy timestamps from the hook log, never run git commands that touch the working tree. Each of these was learned from an incident (rows 11, 18, 23, 27).
- **Size the milestones to the feature, not to the window.** Fewer, larger slices would have left the same time for documentation with less bookkeeping between them.
- **Write the docs once per milestone.** The M1 logs went through several correction passes, which cost more than the milestone itself.

## The reviewing chat — where it went wrong

I used a second assistant (Claude in the desktop app) to check Claude Code's work and to draft prompts and docs. It was useful, and it made mistakes of its own that I had to catch:
- It introduced wrong facts into the docs: the first version of D10, placeholders committed into the logs, and a time estimate it attributed to the brief.
- Its own `git status` left a stale `index.lock` in the repo.
- A few times it relied on Claude Code's report instead of opening the files, until I asked it to check the machine directly.
- The two-assistant setup should have been described in the plan from the start; instead its direct doc edits had to be explained afterwards (`00-plan.md`, `prompts/planning-chat-summary.md`).

## Technical decisions — in hindsight

- **Angular Material was unnecessary.** When I chose it (D29) I had a more ambitious UI in mind. For two small forms and two tables it added ~650 kB against a 500 kB budget, and I am not satisfied with how the page looks. Plain CSS would have been smaller and faster to shape.
- **The admin layout should have been designed up front.** The Events/Rules tabs came only after a manual run showed the single page was hard to read.
- **`EventSource` should not have been described before it existed** (D02, corrected in A6 and D31). Naming the actual entry point, `POST /api/events`, would have been accurate from the start.
- **Excluding all HTTP-level tests was too strict** (D26). One thin test through Nest's pipes would have covered the validation wiring that unit tests skip (M7 pre-review #4).

## What I would keep

- Git discipline: a branch per milestone, PRs, separate `feat:` / `fix:` / `docs:` commits, every merge by me, the AI never pushing.
- Treating every AI claim as unverified until checked against command output or the files. This produced the strongest part of the review log.
- The combination of an AI pre-review in a fresh session and a manual run by me — each found things the other missed.
- The fresh-clone README test (row 26): it found a demo that looked right for the wrong reason.
- Recording gaps openly (D31, D32, this file) instead of smoothing them over.

## With more time

- **UI:** drop Material and redo the admin view with plain CSS and a deliberate layout; add a rule edit action and filters on the delivery log.
- **Deployment:** Cloudflare Pages for the admin app, a Hetzner VM (or container host) for the API and Postgres, secrets outside the repo.
- **CI:** GitHub Actions running lint, build and both test suites on every PR, plus a small HTTP test against a throwaway Postgres; the pre-review could run there as a PR check.
- **Real delivery:** an actual SMTP account and a Slack app with per-user delivery (`02-design.md`, "At larger scale").
- None of this was in the task's scope, and the time went to the process artifacts the task asks for — which I would prioritise the same way again.
