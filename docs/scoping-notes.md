# Scoping notes

Before starting Claude Code, I worked the brief through in a Claude desktop conversation: I asked it to read the brief cold, then pushed back on its proposals until the scope was small enough to build and document in the time available. This is the digest of that session — the decisions and, where it matters, who proposed what. The full decision list lives in `03-decision-log.md`; this file records the reasoning around it.

## What the AI got right

- Reading the brief as *process-evaluated*: the artifacts are the submission, the code is evidence. That reframing drove the whole plan — most of the budget goes to planning and documentation, not to feature count.
- The "vertical slice first" ordering: one event → one rule → one channel → one log row, end to end, before widening. Guarantees something demoable at any stop point.
- The channel registry as the architectural centre of gravity, since "flexible enough to add more channels later" is the only explicit architecture requirement in the brief.
- Treating the undefined parts of the brief (event source, importance semantics, admin scope) as decisions to be made and documented rather than questions to be asked back.

## Where I overrode it

**Database: Postgres, not SQLite.** The AI proposed SQLite for zero infra. I have far more hours in Postgres and pgAdmin, and in a 24h window debugging speed beats setup simplicity — an unfamiliar tool is a risk with no upside here, since the DB choice is not what's being evaluated. Docker Compose keeps the reviewer's setup to one command either way. (D07)

**Monorepo tooling: npm workspaces, not Nx.** Two apps, no shared libraries, no build caching needed. Nx would be ceremony. (D01)

**Git discipline: the AI never touches `main`.** This wasn't in the AI's proposal. Feature branch per milestone, the AI commits only on explicit instruction and never pushes or merges; I review every diff and merge by hand. `main` is branch-protected on GitHub as a backstop, so the rule holds even if the AI ignores `CLAUDE.md`. The point is that nothing reaches the main line without my having read it. (D09)

**Prompt handling: polish before sending, never after.** I draft milestone prompts in Hungarian and clean them up before sending. The tempting alternative — send them rough, tidy the history afterwards — produces a repo history that doesn't match what was actually sent. I rejected it: the submission is a record of how I worked, and a retouched record is worth nothing. In-between prompts (corrections, "run the tests") go as typed. (D09)

**Provenance had to be visible.** The initial commit contains a plan, assumptions, a decision log and process rules with no code and no history behind them. Unexplained, that looks like it appeared from nowhere. Hence this file and the note in `00-plan.md`.

## What I cut from the AI's suggestions

The AI initially inherited an earlier idea of mine — GitHub Actions with vitest + Playwright behind a coverage gate, deployed to Cloudflare — and correctly flagged it as infrastructure that isn't being evaluated. Cut. What survives from it is the part that serves the actual goal: unit tests as the validation mechanism for AI-generated logic, and a second-pass AI review of generated code with my verdict recorded. No pipeline needed for either.

Also deliberately deferred: a `shared/` package for DTOs. Tempting up front, but premature — if types genuinely duplicate between `apps/api` and `apps/admin` during the build, I'll extract it then and log it.

## Scope decisions that came out of the session

Recorded in full as D02–D08 in the decision log: simulated event source behind an `EventSource` interface, a flat event shape with type/severity/tags, AND-only rule matching, the channel registry, admin view limited to observability plus manual event injection, and an explicit non-goals list (retry, dedup, rate limiting, auth, end-user UI) with a one-line note on how each would be added.
