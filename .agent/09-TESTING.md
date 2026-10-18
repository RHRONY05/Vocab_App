# 09 — Testing and performance

Four layers. All must be green before a task is ticked (each task names which specs it adds).

| Layer | Tool | Command | What it covers |
|---|---|---|---|
| Unit | Vitest | `npm run test` | Pure logic in `src/lib/` (SRS, weakness score, selection, dates, word normalisation, Zod schemas). |
| Integration | Vitest (`*.int.test.ts`, separate config) | `npm run test:int` | API route handlers against the real Supabase project, logged in as the **e2e user**, with the AI mocked. |
| End-to-end | Playwright | `npm run test:e2e` | Real browser flows on the running app, desktop **and** mobile viewports. |
| Performance + a11y | Lighthouse (Chrome DevTools MCP `lighthouse_audit`, or the `performance-audit` skill) | — | Scores on desktop and mobile, recorded in PROGRESS.md. |

## Test user and mocked AI
- A second Supabase user, the **e2e user** (`E2E_EMAIL`, `E2E_PASSWORD` in `.env.local` only), created by `scripts/create-user.ts --e2e`. RLS keeps its data separate from the owner's real words.
- When tests start the app, they set `ALLOWED_EMAIL=$E2E_EMAIL` and `AI_MOCK=1` (Playwright `webServer.env`; Vitest setup for integration tests).
- `AI_MOCK=1` makes `src/lib/ai.ts` return fixtures from `tests/fixtures/ai/` (cards for `substantive`, `cohesive`, `inference`, `morph`, a typo case, a follow-up reply, a sentence-feedback reply, and quiz sets). No Gemini calls, no cost, deterministic.
- `src/lib/env.ts` must **refuse to start** if `AI_MOCK=1` and `NODE_ENV=production` on Vercel (`VERCEL_ENV=production`).
- Each test run first deletes all words of the e2e user (helper `tests/helpers/reset.ts` using the service-role key), so runs are repeatable.

## Integration tests (minimum)
- `/api/lookup`: new word → AI card; saved word → saved card with no AI call (mock call counter = 0) and the repeat-lookup rule applied; follow-up → reply.
- `/api/words`: create, save again → `updated` with one row, list with ranges + counts, stats, delete cascades attempts.
- `/api/words/stats`: counts, `duePreview` (max 4, weakest first), `nextDue` only when nothing is due.
- `/api/quiz` + `/api/quiz/answer`: review returns only due words; answer updates box/next review and inserts an attempt; `isRepeat` changes nothing.
- Every route returns 401 without a session and for a user whose email is not `ALLOWED_EMAIL`.
- `/api/cron/keepalive`: 401 without the secret, 200 with it.

## E2E specs (Playwright)
Projects: `desktop` (1440×900, Chromium) and `mobile` (390×844, Chromium with touch, `isMobile`).
Log in once in a setup project and reuse the storage state.

| Spec | Flow |
|---|---|
| `auth.spec.ts` | logged out → redirected to `/login`; wrong password → error banner; correct → Learn; log out. |
| `learn.spec.ts` | look up "substantive" → card sections visible; follow-up "is it formal?" → reply bubble; typo "recieve" → "Did you mean"; Bangla toggle hides the Bangla line and survives reload; `/?q=cohesive` runs on load; `/` focuses the input (desktop). |
| `save.spec.ts` | Save with the button and with `Ctrl+S` (desktop); "Saved" state; look up the same word again → saved card + "Saved on" banner; it appears under Words → Today. |
| `words.spec.ts` | tabs and counts; search; open a word (desktop: right pane; mobile: detail page); delete with confirmation. |
| `review.spec.ts` | make words due (helper sets `next_review_at` in the past); full review with the keyboard (desktop) and with taps (mobile); a wrong answer is retried at the end; end screen; practice "Weak words · 5". |
| `visual.spec.ts` | screenshot every main screen in both projects, light and dark; compare by eye with `.agent/design/` once, then keep them as Playwright snapshot baselines (`toHaveScreenshot`, small threshold). |
| `a11y.spec.ts` | `@axe-core/playwright` on Login, Learn (with a card), Words, Review question: no serious or critical violations. |

## Performance targets (Lighthouse)
Run on a **production build** (`npm run build && npm run start`) in V6 to catch problems early, and on the **production URL** in V8.
Pages: `/login`, `/` with a word card, `/words`, `/review`. Log in first in the audited browser (Chrome DevTools MCP: navigate, log in, then `lighthouse_audit` on each page), once in **mobile** mode and once in **desktop** mode.

| Metric | Mobile | Desktop |
|---|---|---|
| Performance | ≥ 90 | ≥ 95 |
| Accessibility | 100 (≥ 95 only with a written reason) | 100 |
| Best Practices | ≥ 95 | ≥ 95 |
| LCP | < 2.5 s | < 1.5 s |
| CLS | < 0.05 | < 0.05 |
| TBT | < 200 ms | < 100 ms |

SEO is not a target: the app is private. Add `robots: { index: false, follow: false }` metadata and a `robots.txt` that disallows everything.
Record every score in PROGRESS.md as a table (page × mobile/desktop). If a target is missed, fix the cause (bundle size, fonts, images, blocking scripts, layout shift) and re-run; only write a reason when it cannot be fixed.

## Scripts in package.json
`test` (unit), `test:int`, `test:e2e`, `test:all` (= typecheck + lint + test + test:int + test:e2e).
Extra dev dependencies allowed: `@playwright/test`, `@axe-core/playwright`.
