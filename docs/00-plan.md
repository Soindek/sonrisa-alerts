# 00 — Plan of Attack

**Brief received:** 2026-09-16. **Window:** 24h. **Author:** László Szabó.

## How I read the brief

The brief is a product wish, not a spec. Three things are undefined and I have to decide them myself: what an "important event" is and where it comes from, what a user actually configures when they "set up an alert", and what "admin view" means. The evaluation is explicitly on *process* — planning, directing the AI, validating its output — so the code is evidence, not the goal.

Consequences for how I work:

- Decide scope up front, write it down, then build. Every non-obvious choice goes into `03-decision-log.md` with the alternative I rejected.
- Build a thin end-to-end slice first so there is always something demoable; widen only if time remains.
- Treat every AI output as a draft. Record what I checked, what I rejected and why in `04-ai-review-log.md`.

## Deliverables (in priority order)

| # | Deliverable | Why |
|---|-------------|-----|
| 1 | This plan + `01-assumptions.md` | Forces the scope decisions before any code exists |
| 2 | `02-design.md` — domain model, event pipeline, channel abstraction | The "flexible for more channels" requirement is an architecture decision, must be explicit |
| 3 | Backend (NestJS + Postgres): events, alert rules, matching, delivery via channel registry | Core of the feature; the admin view is useless without it |
| 4 | Email + Slack channel adapters | Explicitly required |
| 5 | Admin view (Angular): users, rules, delivery log, manual event injection | Explicitly required; also the demo surface |
| 6 | Unit tests on the matching + delivery planning logic (shipped with M2) | Primary validation tool for AI-generated code |
| 7 | Process artifacts: prompt history, decision log, AI review log, README | The actual submission |
| 8 | ~~(Stretch) second event source (RSS)~~ — dropped (D26) | Would prove the `EventSource` abstraction is real; now a documented non-goal |

## Milestones and order

| M | Content | Budget |
|---|---------|--------|
| M0 | Read brief, write plan, assumptions, initial decisions. No code. | 1.5h |
| M1 | Repo skeleton: NestJS + Angular workspace, docker-compose (Postgres), CLAUDE.md with process rules, CI-free. | 1h |
| M2 | Vertical slice: one simulated event → rule matching (type, severity, keywords) → email adapter (dry-run) → delivery log row. Matcher and planner unit tests included. Demoable. | 3h → **~1h actual** |
| M3 | Slack adapter via the channel registry; NFC normalization fix; registry and Slack unit tests. | ~~1.5h~~ **45 min** |
| M4 | Admin view: delivery log table + "inject event" form. Nothing else. | ~~2.5h~~ **1.5h** |
| ~~M5~~ | ~~Tests on matcher + delivery orchestration.~~ Dropped: shipped with M2 (D26). | — |
| M6 | README (setup, demo, time spent), process artifacts consolidated. | ~~2h~~ **1h** |
| ~~M7~~ | ~~Stretch: RSS event source.~~ Dropped: non-goal (D26). | — |

**Re-plan after M2 (D26):** actual time for M0–M2 was ~5h against a brief that describes 1–2 hours of work, and the original plan totalled ~15h. The remaining scope is cut and time-boxed rather than extended. The original rows are kept struck through so the change stays visible.

Why this order: M2 before anything wide, because a partial vertical slice is demoable and a half-built horizontal layer is not. Admin view (M4) after the channel work (M3) because the admin view displays delivery results — building it earlier would mean building it against fake data twice. Tests (M5) deliberately after the feature is shaped, but the matcher gets tested inline in M2 because that is where AI-generated logic is most likely to be subtly wrong.

## How this plan was produced

Before opening Claude Code, I worked the brief through in a Claude desktop conversation: it read the brief cold and proposed a scope, I pushed back until what remained was small enough to build and document in the time available. Several of its proposals were overridden — database choice, monorepo tooling, and the git discipline the AI works under. `docs/scoping-notes.md` records that session: what the AI got right, where I overrode it, and what I cut.

## How I use the AI

- Claude Code for implementation, one milestone per session where possible.
- Milestone prompts are drafted by me in rough Hungarian, then reworded into clean English in a separate chat before being sent, so the recorded prompt is the one actually used. In-between prompts (corrections, "run the tests") are sent as typed. All prompts are logged verbatim by a `UserPromptSubmit` hook into `prompts/raw.md`; English summaries in `prompts/log.md`.
- The AI works on feature branches only, commits only on my explicit instruction (one commit per milestone, short messages), never pushes or merges. I review every diff before it reaches `main`.
- I do not accept generated code without one of: running it, reading the relevant part, or a test. Which one, and the outcome, goes into `04-ai-review-log.md`.

## What "done" means for this submission

A reviewer can clone the repo, run `docker compose up` + two `npm` commands, inject an event from the admin view and see a delivery row appear — and can read, in order, why every piece is the way it is.