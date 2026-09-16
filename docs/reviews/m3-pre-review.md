I found 6 issues in `main...HEAD` (1 major, 5 minor), so the verdict is fix first. The diff covers 15 files under `apps/api`. The only file I changed is `prompts/log.md`, where I added this review's entry as `CLAUDE.md` requires.

I checked the new NFD test's bytes: its title really has combining marks (`́`). The diff just displays it as normal characters, so the test is real.

| # | Severity | file:line | Finding | Evidence | Suggested fix |
|---|---|---|---|---|---|
| 1 | major | [match-rule.ts:42](apps/api/src/matching/match-rule.ts#L42), [:49](apps/api/src/matching/match-rule.ts#L49) | NFC normalization only covers titles and summaries, not tags. D20 says the missing normalization was "fixed in M3 with NFC". But a tag typed in decomposed form (a letter plus a separate accent character) still won't match the keyword `árvíz`. | `const tags = event.tags.map((tag) => tag.toLowerCase());` … `tags.includes(keyword.toLowerCase())` | Apply `.normalize('NFC')` to both tag and keyword before comparing, and add a test with a decomposed tag. |
| 2 | minor | [slack.channel.ts:227-231](apps/api/src/channels/slack.channel.ts#L227-L231) | Event text goes into Slack's formatting without escaping `&`, `<`, `>`. `POST /events` has no auth (D06), so a title like `<!channel>` would ping the whole channel, and `<https://x\|label>` would show a disguised link. I haven't checked this against Slack's docs. | `` `*[${event.type} · severity ${event.severity}]* ${event.title}\n` + `${event.summary}\n` `` | Escape `&`→`&amp;`, `<`→`&lt;`, `>`→`&gt;` in the title, summary, tags, name and email. |
| 3 | minor | [slack.channel.ts:215](apps/api/src/channels/slack.channel.ts#L215) | No test covers a fetch that fails (network error or timeout). The design's 5 s timeout isn't tested either. | `signal: AbortSignal.timeout(TIMEOUT_MS),` | Add a spec where the stubbed `fetch` rejects, and assert that `send` rejects. Optionally check that `init.signal` is set. |
| 4 | minor | [config.ts:247-263](apps/api/src/config.ts#L247-L263), [:274](apps/api/src/config.ts#L274) | The `??` → `\|\|` change (so an empty env value falls back to the default) has no test. Neither does "an empty `SLACK_WEBHOOK_URL` counts as unset". | `port: Number(process.env.SMTP_PORT \|\| 587),` / `webhookUrl: process.env.SLACK_WEBHOOK_URL \|\| undefined,` | Add a small `config.spec.ts` that sets empty strings through `vi.stubEnv` and checks the defaults. |
| 5 | minor | [alert-pipeline.service.spec.ts:403](apps/api/src/events/alert-pipeline.service.spec.ts#L403) | The missing-user test doesn't check the error text. Any `failed` row passes, including `Unknown channel`. | `expect(result.deliveries).toMatchObject([{ channel: 'email', status: 'failed' }]);` | Assert `error: 'Recipient user not found'`. |
| 6 | minor | `docs/02-design.md` (Configuration and bootstrap section; uncommitted) | The config section still lists only two env groups. `SLACK_WEBHOOK_URL` is only mentioned in the Slack bullet. | `` - `POSTGRES_*` and `SMTP_*` come from `process.env`, with the same defaults as `docker-compose.yml`. `` | Add `SLACK_WEBHOOK_URL` (no default, empty means dry-run) to that line. |

By category:
- **Correctness against the design:** finding 1. Everything else matches:
  - Dedup is unchanged.
  - Status values stay `sent`/`dry-run`/`failed`.
  - Failure isolation now also covers row saves, and the known "unrecorded send" limitation is documented.
- **Error handling:** nothing beyond finding 3.
  - Slack's non-2xx responses throw with the status code and response body, and the pipeline records them as `failed`.
  - A failed row save is caught and logged.
- **Security:** nothing beyond finding 2.
  - The webhook URL is never logged.
  - The recipient's email in the shared channel is by design (A7 / `02-design.md`).
- **Tests:** findings 3, 4 and 5.
- **Scope creep:** none. Every change maps to the M3 prompt: the Slack channel, the five fixes, the seed and the tests.
- **Dead code, duplication, misleading names:** none. `errorMessage` replaces a duplicated inline expression.

I couldn't read the `.env.example` change because a deny rule blocks it (D13), and it's outside `apps/` anyway.

**Verdict: fix first**, for finding 1. The minor findings can go in the same commit.
