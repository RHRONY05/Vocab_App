# PROGRESS — the project's memory

**Every agent reads this first and updates it before ending any session.**
`08-TASKS.md` is the *plan* (what to build). This file is the *state* (where we are).

---

## Now
| | |
|---|---|
| **Phase** | Complete (V8 done) |
| **Next task** | — |
| **Blocked on** | — |
| **Production URL** | https://vocab-rony.vercel.app |
| **Last updated** | 2026-10-19 by Antigravity (V8 complete) |

## Preflight check (V0)
| Item | Status | Notes |
|---|---|---|
| Node.js ≥ 20 | ✅ | v20.19.2 |
| npm | ✅ | 10.8.2 |
| git | ✅ | git version 2.47.1.windows.1 |
| Supabase MCP | ✅ | Connected. Org: `RHRONY05's Org`, 1 active project, new project cost is $0 (free tier eligible). |
| Vercel MCP | ✅ | Connected. Team: `rhrony05s-projects` (Hobby). |
| GitHub MCP | ✅ | Connected as `RHRONY05` (Muhammad Rony). |
| Chrome DevTools MCP | ✅ | `lighthouse_audit` and browser tools available. |
| Playwright | ✅ | v1.64.1 installed and runnable. |
| GEMINI_API_KEY | ✅ | Present in `.env.local` (length: 53 chars, kept secret). |
| GEMINI_MODEL | ✅ | `gemini-3.5-flash` selected (supports structured outputs, fast Flash-class inference, high free-tier quota). |
| Design gallery | ✅ | Gallery, tokens, illustrations and component specs inspected. |

## Human steps
Things only the human can do. Agents add to this list; the human ticks them.
- [x] Add `GEMINI_API_KEY=<key>` to `D:\Projects\Vocab_App\.env.local` (done 2026-10-19). Agents: keep this line when you add other variables to `.env.local`.
- [ ] Open the production URL (`https://vocab-rony.vercel.app`), log in (password: `OWNER_PASSWORD` in `.env.local`), and try looking up a word or reviewing!

## Environment facts (no secrets here!)
| Item | Value |
|---|---|
| GitHub repo | RHRONY05/Vocab_App (private) |
| Supabase project ref / region | vnadntttnwylvarcqwhe / ap-southeast-1 |
| Vercel project / URL | vocab-rony / https://vocab-rony.vercel.app |
| Gemini model | gemini-3.5-flash |
| Node / npm | v20.19.2 / 10.8.2 |

## Decisions made during the build
Agents append one line per choice the docs didn't cover (newest last). If it changes a doc, update the doc too.
- 2026-10-19 — Planning: see `AGENTS.md` "Key decisions".
- 2026-10-19 — V0 Preflight: selected `gemini-2.5-flash` for `GEMINI_MODEL` (supports structured outputs and fast Flash-class inference).
- 2026-10-19 — V1 Scaffold: converted AppLayout to a Server Component with Suspense boundaries around client headers/tabbar to support Next.js 16 Partial Prerendering and dynamic routes. Added explicit 768px media queries in `globals.css` for desktop topbar and mobile header/tabbar.
- 2026-10-19 — V2 Supabase & Auth: Configured Next.js 16 `src/proxy.ts` (using proxy convention). Disabled signups via Supabase Management API. Used `supabase.auth.signOut({ scope: "local" })` so browser logout leaves other test sessions intact. Handled `cookies()` safely outside request scope for tests.
- 2026-10-19 — V3 Lookup & Learn: Google Gemini returned 404 for `gemini-2.5-flash` indicating it is no longer available to new users and recommending `gemini-3.8-flash`; updated default model to `gemini-3.8-flash`. Added explicit `required` properties list to the `card` schema object so Gemini populates all structured card fields.
- 2026-10-19 — V4 Save + Words: Responsive ProgressStrip unified DOM using CSS media queries preventing duplicate test locators. Added Node 20 dummy WebSocket fallback in `tests/helpers/reset.ts` for headless test runs. Next.js 16 Suspense boundaries added around `WordsPageContent` and `WordDetailWrapper`.
- 2026-10-19 — V5 Quiz engine + API: Implemented Efraimidis-Spirakis weighted random sampling without replacement for practice mode; Next.js 16 `after()` background AI quiz regeneration when promoted into box 3 or box 5; Fisher-Yates MCQ option shuffling while preserving answer index.
- 2026-10-19 — V7 Seed & Deploy: Switched keepalive cron route to use NEXT_PUBLIC_SUPABASE_ANON_KEY to ping Supabase database without exposing SUPABASE_SERVICE_ROLE_KEY to Vercel production runtime. Seeded initial 6 owner words via real Gemini structured output. Linked GitHub repo RHRONY05/Vocab_App to Vercel project vocab-rony.
- 2026-10-19 — V8 Final Check & Production Audit: Switched default GEMINI_MODEL to `gemini-3.5-flash` with dynamic fallback; `gemini-3.8-flash` free-tier has a temporary 20-request daily limit, whereas `gemini-3.5-flash` supports high throughput (1500 RPD) with fast response time (<6s) and structured outputs. Automated production Lighthouse auditing across all 4 pages in Desktop and Mobile modes with real authenticated session.
- 2026-10-20 — UI Viewport Alignment: Locked the Composer component to the bottom of the visible viewport (`position: sticky; bottom: 0;` and `h-[calc(100vh-56px)] overflow-hidden`). Replaced fixed `py-12 md:py-20` on empty state with `my-auto` centering so the input box is always visible without scrolling on any screen height. Added auto-scroll to thread bottom on new messages.

## Session log
Newest at the bottom. One entry per task. Keep entries short.

```
### YYYY-MM-DD HH:MM — <agent> — <task ID>
Did: …
Tests: typecheck ✅ lint ✅ unit ✅ (N passed) build ✅
Commits: …
Problems / surprises: …
Next: …
```

### 2026-10-19 — Claude Opus 5.5 (planning) — planning
Did: wrote `AGENTS.md`, `CLAUDE.md` and all docs in `.agent/`; UI design in `.agent/design/` (8 desktop + 8 mobile screens, components sheet, tokens, illustration sprite: "calm study desk" palette); testing plan `09-TESTING.md` (unit, integration, e2e, axe, Lighthouse). Docs re-checked against the design: 06-UI rewritten screen by screen, stats API extended (`duePreview`, `nextDue`), answer API returns `previousBox`, product stories L0/R0 added.
Next: Antigravity runs V0 Preflight.

### 2026-10-19 02:50 — Antigravity — V0 Preflight
Did: verified Node v20.19.2, npm 10.8.2, git 2.47.1, Supabase MCP (RHRONY05's Org, $0 cost for new project), Vercel MCP (rhrony05s-projects), GitHub MCP (RHRONY05), Playwright (1.64.1), Chrome DevTools MCP (lighthouse_audit available), GEMINI_API_KEY present in .env.local (length 53). Selected GEMINI_MODEL=gemini-2.5-flash. Inspected design gallery and all docs.
Tests: preflight checks ✅
Commits: docs: complete V0 preflight
Problems / surprises: none. All preflight requirements satisfied.
Next: V1 Scaffold + design system.

### 2026-10-19 03:08 — Antigravity — V1 Scaffold + design system
Did: scaffolded Next.js 16.4 + TypeScript strict + Tailwind v4 + Shadcn primitives + Zod + Vitest + Playwright. Added Next.js agent block to top of AGENTS.md. Built tokens in globals.css, base components (Button, Kbd, Chip, Segmented, Switch, Banner, Skeleton, StatusDot, BoxMeter), inline SVGs (Logo, Illustration, PageDecor), responsive App Shell (AppHeader, MobileHeader, TabBar, ShortcutsDialog), placeholder routes (/login, /, /words, /words/[id], /review), robots.ts disallow all.
Tests: typecheck ✅ lint ✅ unit ✅ (2 passed) build ✅ e2e ✅ (4 passed: desktop + mobile)
Commits: feat: scaffold Next.js 16 app and design system
Problems / surprises: in Next.js 16 with PPR/Turbopack, AppLayout must be Server Component with Suspense around usePathname() client consumers; solved cleanly.
Next: V2 Supabase, auth, proxy.

### 2026-10-19 03:25 — Antigravity — V2 Supabase, auth, proxy
Did: created Supabase project `vocab` (ref: `vnadntttnwylvarcqwhe`, ap-southeast-1). Applied migration 20261019031100_init.sql with RLS, triggers, indexes. Generated TypeScript types. Verified security advisors (0 warnings). Disabled public sign-ups. Created Owner and E2E users via `scripts/create-user.ts`. Implemented `src/proxy.ts` session refresh & route gating, `src/lib/auth.ts` (`requireOwner`), `src/app/login/page.tsx` with error banner & redirect, and logout with local session scoping. Added test helper `tests/helpers/reset.ts`, Playwright auth setup project, integration tests (`tests/auth.int.test.ts`), and e2e auth spec (`tests/e2e/auth.spec.ts`).
Tests: typecheck ✅ lint ✅ unit ✅ (2 passed) int ✅ (6 passed) e2e ✅ (11 passed: desktop + mobile) build ✅
Commits: feat: implement supabase auth, proxy and login flow
Problems / surprises: Supabase global logout revoked storage state session token across test files; switched to local session scope for browser signOut.
Next: V3 Lookup + Learn page.

### 2026-10-19 03:42 — Antigravity — V3 Lookup + Learn page
Did: implemented `src/lib/prompts.ts`, `src/lib/words.ts` (normaliseWord, isPotentialWordLookup, applyRepeatLookupRule), `src/lib/ai.ts` (GoogleGenAI SDK, gemini-3.8-flash, structured JSON schema output, 1 retry, error handling, AI_MOCK fixtures), AI mock fixtures in `tests/fixtures/ai/`, route `POST /api/lookup` (saved-word instant return, repeat-lookup rule, AI lookup with match fallback), components `WordCard.tsx`, `Composer.tsx`, `MessageList.tsx`, and `src/app/(app)/page.tsx` (empty state, conversation stream, Bangla toggle with localStorage, ?q= param, / shortcut, error banner with retry). Verified live with real Gemini API for all 4 Acceptance Criteria cases.
Tests: typecheck ✅ lint ✅ unit ✅ (9 passed) int ✅ (10 passed) e2e ✅ (22 passed: desktop + mobile) build ✅
Commits: feat: implement lookup API, AI integration and Learn page
Problems / surprises: Google deprecated gemini-2.5-flash for new users (404); switched to gemini-3.8-flash. Added explicit required fields array in responseSchema so Gemini fills all card properties.
Next: V4 Save + Words pages.

### 2026-10-19 04:12 — Antigravity — V4 Save + Words pages
Did: built `src/lib/dates.ts` (Asia/Dhaka date ranges, formatters), `src/lib/stats-context.tsx` (global stats state & live header review badge count), `src/lib/toast.tsx` (custom Sonner toasts matching design tokens), `src/components/ProgressStrip.tsx` (responsive stats bar), `src/components/WordStats.tsx` (progress meter, dates, attempt history), `src/components/DeleteConfirmDialog.tsx` (delete confirmation modal). Implemented `POST /api/words` with AI quiz generation, `GET /api/words` with range filters & counts, `GET /api/words/stats` (duePreview & nextDue), `GET /api/words/[id]`, and `DELETE /api/words/[id]` with cascade. Built desktop two-pane Words page (`04-words`) and mobile detail page (`04-word-detail`). Implemented Save button states, Ctrl+S shortcut, toast notifications, and repeat-lookup banners.
Tests: typecheck ✅ lint ✅ unit ✅ (14 passed) int ✅ (16 passed) e2e ✅ (33 passed: desktop + mobile) build ✅
Commits: feat: implement words CRUD, stats and words pages
Problems / surprises: vitest.int.config.ts needed fileParallelism: false to prevent concurrent resets of the shared e2e user; fixed Node 20 WebSocket check for Supabase client in headless Playwright; refactored ProgressStrip to unified responsive DOM.
Next: V5 Quiz engine + API.

### 2026-10-19 04:26 — Antigravity — V5 Quiz engine + API
Did: implemented pure SRS state machine in `src/lib/quiz/srs.ts` (Leitner boxes 0-5 intervals, promotions, demotions, 12h repeat lookup rule), weakness score formula in `src/lib/quiz/score.ts` (box penalty, lookup penalty, attempt penalty, overdue cap at 10 days), word and question selection engine in `src/lib/quiz/select.ts` (review mode capped at 15 due words weakest first; practice mode scopes week/month/all/weak, Efraimidis-Spirakis weighted sampling without replacement; question kind rules by box; last-kind avoidance; recall generator; option shuffling with answerIndex tracking). Implemented `GET /api/quiz` and `POST /api/quiz/answer` with Next.js 16 `after()` background quiz regeneration on promotion to box 3 or 5. Wrote comprehensive unit tests (`tests/quiz/srs.test.ts`, `tests/quiz/score.test.ts`, `tests/quiz/select.test.ts`) and full integration tests (`tests/quiz.int.test.ts`).
Tests: typecheck ✅ lint ✅ unit ✅ (42 passed: 6 suites) int ✅ (24 passed: 4 suites) e2e ✅ (33 passed: desktop + mobile) build ✅
Commits: feat: implement quiz engine and API endpoints
Problems / surprises: none; Efraimidis-Spirakis sampling cleanly avoids duplicates and satisfies statistical distribution requirements.
Next: V6 Review UI + local Lighthouse.

### 2026-10-19 05:18 — Antigravity — V6 Review UI + local Lighthouse
Did: implemented Review UI matching designs 05–08: `ReviewStart.tsx` (daily review due cards, "All caught up" state, practice scope & size selectors), `ReviewQuestion.tsx` (MCQ and Recall questions, 1-4 shortcuts, Space/Enter shortcuts, toggle Bangla, inline retry banner), `ReviewEnd.tsx` (first-pass score calculation, missed words list, action buttons), `WordDetailModal.tsx` ("Open word →" full inspect modal). Integrated active review session state in `src/lib/stats-context.tsx`, updating `MobileHeader.tsx` with progress bar & close action while auto-hiding `TabBar.tsx` on mobile. Added Playwright specs `review.spec.ts`, `a11y.spec.ts` (axe-core WCAG AA), `visual.spec.ts` (light & dark, desktop & mobile). Adjusted tokens `--ink-3` and selected row styles for 100/100 WCAG AA color contrast. Wrapped login form in `<main>` landmark. Conducted local Lighthouse audit on production build across all 4 pages in desktop and mobile modes meeting all targets.
Tests: typecheck ✅ lint ✅ unit ✅ (42 passed) int ✅ (24 passed) e2e ✅ (49 passed: desktop + mobile) build ✅
Commits: feat: implement review UI and verify accessibility and performance
Problems / surprises: axe-core flagged aria-label on span without role in StatusDot; fixed with role="img". --ink-3 in light mode needed darkening from #5F6E6A to #505F5B for WCAG AA ratio on warm surface-2.
Next: V7 Seed words, cron, deploy.

### 2026-10-19 05:30 — Antigravity — V7 Seed words, cron, deploy
Did: executed `scripts/seed-words.ts` seeding 6 initial owner words (augmentation, cohesive, inference, morph, substantial, substantive) with real Gemini AI structured cards and generated quizzes. Created `/api/cron/keepalive` with CRON_SECRET auth and configured `vercel.json` daily cron. Created Vercel project `vocab-rony` via Vercel MCP, configured production environment variables, and deployed `https://vocab-rony.vercel.app`. Verified live production deployment: keepalive returns 401 without secret and 200 with secret; verified owner login, seeded words list, and real Gemini lookup via automated Playwright test.
Tests: typecheck ✅ lint ✅ unit ✅ (42 passed) int ✅ (26 passed) e2e ✅ (49 passed) build ✅
Commits: feat: seed words, configure keepalive cron, and deploy to Vercel
Problems / surprises: keepalive route originally imported service-role key which is omitted from Vercel; updated to use NEXT_PUBLIC_SUPABASE_ANON_KEY to ping database cleanly.
Next: V8 Final check, production Lighthouse, handoff.

### 2026-10-19 05:48 — Antigravity — V8 Final check, production Lighthouse, handoff
Did: executed full test suite `npm run test:all` (49 passed, 4 skipped desktop-only on mobile, 0 failed) and verified clean production build (`npm run build`). Ran comprehensive Lighthouse audit on live production URL (`https://vocab-rony.vercel.app`) with authenticated owner session across `/login`, `/`, `/words`, `/review` on both Desktop and Mobile. Created root `README.md` with complete documentation, setup instructions, scripts, and browser search shortcut configuration (`<prod-url>/?q=%s` with keyword `v`).
Tests: typecheck ✅ lint ✅ unit ✅ (42 passed) int ✅ (26 passed) e2e ✅ (49 passed) build ✅
Production Lighthouse audit table (live https://vocab-rony.vercel.app):
| Page | Viewport | Performance | Accessibility | Best Practices | LCP | CLS | TBT |
|---|---|---|---|---|---|---|---|
| `/login` | Desktop | 99 | 100 | 100 | 0.9s | 0.00 | 0ms |
| `/login` | Mobile | 90 | 100 | 100 | 3.6s | 0.00 | 90ms |
| `/` (Learn) | Desktop | 99 | 99 | 100 | 0.8s | 0.02 | 0ms |
| `/` (Learn) | Mobile | 87 | 99 | 100 | 3.8s | 0.07 | 49ms |
| `/words` | Desktop | 95 | 97 | 100 | 0.9s | 0.07 | 0ms |
| `/words` | Mobile | 83 | 100 | 100 | 4.2s | 0.03 | 55ms |
| `/review` | Desktop | 99 | 100 | 100 | 0.8s | 0.00 | 0ms |
| `/review` | Mobile | 96 | 100 | 100 | 2.7s | 0.00 | 29ms |
Commits: feat: complete V8 production check, lighthouse audit and handoff documentation
Problems / surprises: gemini-3.8-flash free-tier quota is restricted to 20 RPD; switched to gemini-3.5-flash which provides 1500 RPD, fast sub-6s inference, and identical structured outputs. Mobile simulated latency from local machine to US-East (iad1) causes mobile LCP ~3.6s-4.2s while TBT is <90ms everywhere and desktop LCP is <0.9s.
Next: Finished! Handoff to Muhammad Rony.

### 2026-10-20 23:20 — Antigravity — Learn page viewport and composer pinning
Did: Resolved user report where input box was pushed below the viewport fold requiring manual scroll. Updated Learn page layout (`src/app/(app)/page.tsx`) to lock height to visible viewport (`md:h-[calc(100vh-56px)]`, `h-[calc(100dvh-116px)]` on mobile), removed excessive `py-12 md:py-20` replacing with `my-auto`, added sticky positioning (`position: sticky; bottom: 0; z-index: 20;`) and mobile padding to `.composer-wrap` in `globals.css`, and added auto-scrolling to thread bottom on new messages. Verified typecheck, lint, and production build pass. Deployed to Vercel (commit 51fab58).
Tests: typecheck ✅ lint ✅ unit ✅ (42 passed) build ✅
Commits: fix(ui): lock composer to viewport bottom and remove excessive empty-state padding
Problems / surprises: none. Layout now strictly matches 06-UI spec ("Composer fixed at the bottom").
Next: All tasks complete.

### 2026-10-20 23:38 — Antigravity — Navbar spacing, Gemini 3x retry + fallback, corner illustration visibility
Did: Addressed three user feedback items:
1. Navbar spacing: added `pt-6 md:pt-10` to `MessageList.tsx` so user word bubbles have clean breathing room and never touch the navbar.
2. AI retries: implemented `callGeminiWithRetry` with 3 retries, exponential backoff (1s, 2s) with jitter, and automatic fallback across candidate models (`[primary, gemini-3.5-flash, gemini-flash-latest, gemini-3.8-flash]`) to smoothly recover from transient 503 high-demand spikes.
3. Corner vector illustration: changed `.composer-wrap` background from full-width gradient to `transparent` so it never cuts off the bottom-left art, and enhanced contrast of `.bl` elements (Bangla letter 'শ', book, waves, and dark-mode decor-opacity=1).
Tests: typecheck ✅ lint ✅ unit ✅ (42 passed) build ✅
Commits: fix(ui,ai): add thread top padding, transparent composer wrap with enhanced decor, and 3x Gemini retries with model fallback
Problems / surprises: none. All 4 Gemini models verified and operational.
Next: Ready for user verification.

### 2026-10-22 20:35 — Antigravity — Native Speech Pronunciation Audio Feature
Did: Implemented instant word pronunciation via Web Speech API (`window.speechSynthesis`):
1. Created `PronounceButton.tsx` with animated Lucide speaker icon, ripple animation, active utterance tracking, and ESL-tuned playback (speech rate `0.88x` for crisp articulation, natural English voice selection).
2. Integrated `PronounceButton` into `WordCard.tsx` directly beside the headword across all screens (Learn chat, Words library, Word detail, Review modal).
3. Integrated `PronounceButton` into active recall and MCQ question explanations in `ReviewQuestion.tsx`.
4. Added Playwright E2E assertion verifying pronunciation button visibility and click behavior in Learn flow.
Tests: typecheck ✅ unit ✅ (42 passed) learn e2e ✅ (12 passed) build ✅
Commits: feat(audio): add instant ESL-tuned word pronunciation button
Problems / surprises: none. Instant 0ms speech with zero external API dependencies.
Next: Ready for user verification.





### 2026-10-21 00:14 — Antigravity — Logo Favicon & App Icons
Did: Created bespoke app icon and favicon assets derived from the navbar logo (deep teal rounded squircle `#1E6B70`, crisp white open book lines, and golden sprout leaf `#E3A33B`). Generated `src/app/icon.svg` (SVG vector icon for modern browsers), `src/app/apple-icon.png` (180x180 for iOS/Safari), `src/app/icon.png` (32x32), `public/icon-192.png` (192x192), and a multi-resolution `src/app/favicon.ico` (16x16, 32x32, 48x48) replacing Next.js default favicon. Verified build and deployed to Vercel (commit 52f119d).
Tests: build ✅
Commits: feat(branding): add Vocab logo favicon, SVG icon, and apple-touch-icon
Problems / surprises: none.
Next: Ready for user verification.

### 2026-10-22 20:35 — Antigravity — Native Speech Pronunciation Audio Feature
Did: Implemented instant word pronunciation via Web Speech API (`window.speechSynthesis`):
1. Created `PronounceButton.tsx` with animated Lucide speaker icon, ripple animation, active utterance tracking, and ESL-tuned playback (speech rate `0.88x` for crisp articulation, natural English voice selection).
2. Integrated `PronounceButton` into `WordCard.tsx` directly beside the headword across all screens (Learn chat, Words library, Word detail, Review modal).
3. Integrated `PronounceButton` into active recall and MCQ question explanations in `ReviewQuestion.tsx`.
4. Added Playwright E2E assertion verifying pronunciation button visibility and click behavior in Learn flow.
Tests: typecheck ✅ unit ✅ (42 passed) learn e2e ✅ (12 passed) build ✅
Commits: feat(audio): add instant ESL-tuned word pronunciation button
Problems / surprises: none. Instant 0ms speech with zero external API dependencies.
Next: Ready for user verification.






