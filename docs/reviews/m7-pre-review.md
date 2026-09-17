# Review of `feat/m7-rules` against `main`

I found no blockers and no majors, only 7 minor issues. The API and the admin page match `02-design.md` (the M7 paragraph) and decisions D23, D29 and D31. I only added my entry to `prompts/log.md` and committed nothing.

The branch has 3 commits and changes 39 files (+1250/−30). In `apps/` it adds four endpoints, the rules panel and the create-rule form, and the Events/Rules tabs.

## Findings

| # | Severity | file:line | Finding | Evidence | Suggested fix |
|---|---|---|---|---|---|
| 1 | minor | apps/api/src/rules/rules.controller.ts:43 | A keyword made only of punctuation (e.g. `"!!!"`) gets saved. It has no letters or digits, so it never matches a title or summary, and only matches a tag spelled exactly the same. A rule whose only keyword is like that stays silent, and nothing warns the user. | Controller: `.map((keyword) => keyword.trim()).filter((keyword) => keyword.length > 0)`. Matcher, match-rule.ts:26: `if (sequence.length === 0) return false;` | In the controller, drop or reject keywords that contain no letter or digit (`/[\p{L}\p{N}]/u`), and add a spec case. |
| 2 | minor | apps/api/src/rules/rules.controller.ts:44 | Duplicate channel ids like `["email","email"]` are stored as given. Dedup (D19) prevents a double send, but the rules table then shows "email, email". | `channels: dto.channels,` | Save `[...new Set(dto.channels)]`, or add `@ArrayUnique()` to the DTO. |
| 3 | minor | apps/api/src/rules/create-rule.dto.ts:20 | Nothing limits how many keywords or channels a rule has, or how long they are. `POST /api/rules` has no auth (D06), and the matcher tokenizes every keyword of every rule for every event, so an oversized rule slows every inject. | `@IsArray()` / `@IsString({ each: true })` with no `ArrayMaxSize` / `MaxLength` | Add `@ArrayMaxSize(…)` and `@MaxLength(…, { each: true })` to `keywords` and `channels`. |
| 4 | minor | apps/api/src/rules/rules.controller.ts:51 | Some HTTP behaviour has no test. The specs call the controller methods directly, which skips Nest's pipes and decorators. Untested: a non-uuid id on DELETE (400), the 204 status, and `forbidNonWhitelisted` for the rule body. `ChannelsController` has no spec. | `async remove(@Param('id', ParseUUIDPipe) id: string)`. Spec: `await expect(controller.remove('r1'))`, where `'r1'` isn't even a uuid. | E2e tests are a recorded non-goal (D26), so a note is enough. If wanted: one small test that boots the Nest app with the global `ValidationPipe`. |
| 5 | minor | apps/admin/src/app/create-rule-form.ts:57 | If loading channels fails, the form shows an error, but no test covers that path. | `error: () => this.channelsError.set('Could not load channels'),` (no spec matches this string) | Add a spec that returns 500 for `/api/channels` and checks `.field-error`. |
| 6 | minor | apps/admin/src/app/app.html:8 | The log is now refreshed through `#log` inside a lazy tab template, but `app.spec.ts` only checks that both components exist. Nothing tests that injecting an event refreshes the log. | `<app-inject-event-form (created)="log.refresh()" />`. Spec: `expect(element().querySelector('app-delivery-log-table')).not.toBeNull();` | Add an App spec: emit `created` from the form and `expectOne('/api/deliveries')` a second time. |
| 7 | minor | apps/admin/src/app/create-rule-form.ts:12 | The rule form imports helpers from another component's file, and `parseTags` is used on keywords, so the name is misleading. The `errorMessages` helper was already moved to its own file in this diff, so the pattern exists. | `import { parseTags, wholeNumber } from './inject-event-form';` … `keywords: parseTags(keywords)` | Move both helpers to a shared file, e.g. rename `parseTags` to `parseCommaList` in `form-utils.ts`. |

## By category
- **Correctness against the design:** only #1 and #2. The status codes (400 listing unknown channels, 404, 204), keyword trimming, the `createdAt, id` rule order and the two-query user load all match `02-design.md`.
- **Error handling:** no unhandled promise paths. Failed loads, creates and deletes all set an error signal. The panel refreshes after a failed delete. `errorMessages` now also passes through 404 messages, which harmlessly affects the inject form too.
- **Security:** only #3. No secrets and no new logging. The global `ValidationPipe` whitelist covers the new DTO, and the 404 message only echoes a uuid that has already been validated.
- **Tests:** #4, #5 and #6.
- **Scope creep:** none. The rule management follows D31, and the tabs were asked for in the follow-up prompt.
- **Dead code, duplication, names:** #7. The `UserWithRules` type exists in both api and admin, but D29 records and accepts that duplication.

**Verdict: merge.** All seven are minor. #1 is the only one that changes what a user sees, so it's worth a quick fix.
