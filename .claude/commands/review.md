---
description: Pre-screen the current branch diff before I review it
argument-hint: [base ref, default: main]
---
You are reviewing code you did not write. Do not edit any file, except appending your prompts/log.md entry as CLAUDE.md requires. Do not commit.

1. Run `git diff ${ARGUMENTS:-main}...HEAD -- apps/` and `git diff --stat ${ARGUMENTS:-main}...HEAD`.
2. Read CLAUDE.md, docs/02-design.md and docs/03-decision-log.md — they define the intended behaviour. A deviation from them is a finding; a decision recorded there is not.
3. Check, in this order:
   - correctness against the design (matching semantics, dedup, failure isolation, status values)
   - error handling and unhandled promise paths
   - security: secrets, logging of sensitive data, input validation gaps
   - tests: behaviour in the diff that no test covers
   - scope creep: code nobody asked for
   - dead code, duplication, misleading names
4. Report each finding as one row:
   | # | Severity (blocker/major/minor) | file:line | Finding | Evidence (quote the code) | Suggested fix |
5. Rules: no style nits a formatter would fix; no speculation without a quoted line; if unsure, mark the row "unverified". If there is nothing to report in a category, say so in one line. End with a one-line verdict: merge / fix first.