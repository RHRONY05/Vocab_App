# 08 — Tasks

Rules: `rules/vocab.md`. Work **in order V0 → V8**, one agent, one go. Each task depends on the ones before it.
Mark a task `— in progress: <agent>` when you start; tick `[x]` + a one-line note when done; add a
session-log entry in `PROGRESS.md` after **every** task, then continue with the next task.

```
V0 Preflight ─▶ V1 Scaffold + design system ─▶ V2 Supabase + auth ─▶ V3 Lookup + Learn ─▶ V4 Save + Words
                                                                                              │
                      V8 Final check + Lighthouse (prod) ◀─ V7 Seed + deploy ◀─ V6 Review UI + Lighthouse (local) ◀─ V5 Quiz engine
```

---

- [ ] **V0 Preflight**
  - Read `AGENTS.md`, every file in `.agent/`, and open the design gallery (`.agent/design/README.md` → "How to view").
  - Check: Node ≥ 20, git, Supabase MCP (list orgs/projects, `get_cost` for a new free project), Vercel MCP (list teams/projects), GitHub access for `RHRONY05`, Chrome DevTools MCP (`lighthouse_audit` available), Playwright can install Chromium.
  - Check `.env.local` has a non-empty `GEMINI_API_KEY` (check the length only; never print it).
  - Check the current Gemini docs and choose `GEMINI_MODEL` (02-ARCHITECTURE.md). Record it.
  - **AC:** a preflight table in PROGRESS.md (item · ✅/❌ · what the agent did / what the human must do).

- [ ] **V1 Scaffold + design system**
  - Next.js 16 + TypeScript strict + Tailwind v4 + shadcn/ui (only the primitives in 02), Zod, `@supabase/ssr`, `@google/genai`, `lucide-react`, Vitest (unit + `vitest.int.config.ts`), Playwright (`desktop` + `mobile` projects, 09-TESTING.md). Folder skeleton from 02. Scripts from 09-TESTING.md.
  - The folder already has `AGENTS.md`, `CLAUDE.md` and `.agent/`, so `create-next-app` may refuse to run here. Scaffold in a temporary folder and move the files in. **Never overwrite our `AGENTS.md` or `CLAUDE.md`**: if Next.js generates its own agent-rules block, add that block at the top of our `AGENTS.md` and commit it.
  - Design system: copy `design/tokens.css` into `globals.css` + Tailwind `@theme`; fonts via `next/font`; build the base components from the design README's component map (`Button`, `Kbd`, `Chip`, `Segmented`, `Switch`, `Banner`, `Skeleton`, `StatusDot`, `BoxMeter`, `Logo`, `Illustration`, `PageDecor` from `design/illustrations/sprite.svg`) and the app shell (`AppHeader` ≥ 768 px, `MobileHeader` + `TabBar` < 768 px) with placeholder pages.
  - `noindex` metadata + `robots.txt` disallow all.
  - `src/lib/env.ts`, `.env.example`, `.gitignore` (includes `.env*.local`, Playwright reports).
  - `git init`, private GitHub repo `RHRONY05/Vocab_App`, first commit pushed.
  - **AC:** `npm run build`, `typecheck`, `lint`, `test` pass; a sample Playwright test opens the home page on both projects; the shell matches the header/tab bar in `design/` at 1440 and 390, light and dark; repo is private.

- [ ] **V2 Supabase, auth, proxy**
  - Create the free Supabase project `vocab` (region `ap-southeast-1`) via MCP. Put URL + anon key + service-role key in `.env.local`.
  - Migration from 03-DATABASE.md → `apply_migration` → generate types → `get_advisors` (fix all warnings).
  - Disable sign-ups (or list it as a human step). Generate `OWNER_PASSWORD`, `E2E_PASSWORD`, `CRON_SECRET` into `.env.local`. `scripts/create-user.ts` creates the owner (`ALLOWED_EMAIL`) and, with `--e2e`, the e2e user (`E2E_EMAIL`, e.g. `e2e+vocab@<owner's domain>`; any address works, it is never emailed).
  - `/login` (design `01-login`), logout, `proxy.ts`, `requireOwner()`. Test helpers: `tests/helpers/reset.ts`, Playwright login setup project.
  - **Tests:** `auth.spec.ts`; integration: 401 cases.
  - **AC:** logged out, `/` redirects to `/login`; login with the owner works; advisors clean; login page matches the design.

- [ ] **V3 Lookup + Learn page**
  - `lib/ai.ts` (+ `AI_MOCK` fixtures in `tests/fixtures/ai/`), `lib/prompts.ts`, schemas, `POST /api/lookup` (including the saved-word shortcut), `lib/words.ts` (normalise + repeat-lookup rule).
  - Learn page per 06-UI.md and design `02-learn` / `03-learn-empty` (desktop + mobile), including the empty state (it may show zeros until V4 adds stats): `WordCard`, `MessageList`, `Composer`, follow-ups with `currentWord`, sentence feedback, Bangla toggle, typo banner, `?q=`, `/` and `Esc` shortcuts, skeleton, error banner with Retry.
  - **Tests:** unit `words.test.ts`; integration for `/api/lookup`; e2e `learn.spec.ts`.
  - **AC (in the browser, real Gemini):** "inference" → full card that mentions the ML sense; follow-up "is it formal?" → short reply, no question back; "I made a inference from data" → corrected sentence; "recieve" → "Did you mean receive?"; matches the design at 1440 and 390, light and dark.

- [ ] **V4 Save + Words pages**
  - `POST /api/words` with quiz generation; `GET /api/words`, `/api/words/stats` (incl. `duePreview`, `nextDue`), `/api/words/[id]`, DELETE. Wire the stats into the Learn empty state and the header badge.
  - Save button + `Ctrl+S`; Save states; repeat-lookup banners.
  - Words page per design `04-words` (desktop two panes) and `03-words` / `04-word-detail` (mobile), `ProgressStrip`, tabs with counts, search, delete confirmation dialog.
  - **Tests:** unit `dates.test.ts`; integration for `/api/words*`; e2e `save.spec.ts`, `words.spec.ts`.
  - **AC:** save "cohesive" → appears under Today with count 1; saving again → "Updated", still 1 row; looking it up again → saved card with no AI call and the "Saved on" banner; the row has 3 quiz questions; pages match the design.

- [ ] **V5 Quiz engine + API**
  - `lib/quiz/srs.ts`, `score.ts`, `select.ts` exactly as 07-QUIZ-ENGINE.md. `GET /api/quiz`, `POST /api/quiz/answer` with `after()` regeneration on promotion into box 3/5.
  - **Tests:** unit `srs.test.ts`, `score.test.ts`, `select.test.ts` (07 §7); integration for `/api/quiz*`.
  - **AC:** all tests pass; review mode returns only due words; practice never returns duplicates.

- [ ] **V6 Review UI + local Lighthouse**
  - Review start (incl. the "All caught up" variant), MCQ, recall (hidden + revealed), end screens (both variants) per design `05`–`08` and 06-UI.md (desktop + mobile; tab bar hidden during a session on mobile), Review badge, keyboard shortcuts, shortcuts dialog.
  - **Tests:** e2e `review.spec.ts`, `a11y.spec.ts`, `visual.spec.ts` (create baselines after comparing with the design by eye).
  - Production build locally (`npm run build && npm run start`) → Lighthouse mobile + desktop on `/login`, `/`, `/words`, `/review` (09-TESTING.md). Fix misses.
  - **AC:** a full review works keyboard-only (desktop) and with taps (mobile); a wrong answer is retried at the end and the word goes to box 1; `npm run test:all` green; Lighthouse table in PROGRESS.md meets the targets.

- [ ] **V7 Seed words, cron, deploy**
  - `scripts/seed-words.ts`: save these 6 words for the **owner** through the same code path as the app (real AI card + quiz): **augmentation, cohesive, inference, morph, substantial, substantive**. Skip any that already exist.
  - `vercel.json` cron + `/api/cron/keepalive`.
  - Via Vercel MCP: create the project from the GitHub repo, set env vars (02-ARCHITECTURE.md; never `AI_MOCK`, never the service-role key or passwords), deploy.
  - **AC:** production URL loads; owner login works there; a real lookup works there; keepalive returns 401 without the secret and 200 with it; the 6 words show under Words.

- [ ] **V8 Final check, production Lighthouse, handoff**
  - `npm run test:all` and `npm run build` green.
  - Lighthouse on the **production URL**, mobile + desktop, the four pages (log in first in the audited browser). Fix misses, redeploy, re-run. Final table in PROGRESS.md.
  - `README.md`: what it is, local setup, env vars, scripts, tests, deploy, how to add a browser search shortcut (`<prod-url>/?q=%s` with keyword `v`), and where the owner password is.
  - PROGRESS.md "Now": production URL, final scores, remaining human steps.
  - Final message to the human: what was built, the production URL, the Lighthouse table, a code-flow walkthrough for **lookup**, **save** and **review answer** (request in → response out, which files), and anything left for him to do.
  - **AC:** everything green; targets met (or each miss explained); walkthrough delivered.

---

## Questions for the human
(Agents add questions here; the human answers inline.)
