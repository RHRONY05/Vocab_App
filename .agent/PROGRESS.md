# PROGRESS — the project's memory

**Every agent reads this first and updates it before ending any session.**
`08-TASKS.md` is the *plan* (what to build). This file is the *state* (where we are).

---

## Now
| | |
|---|---|
| **Phase** | Building (V2 done, V3 next) |
| **Next task** | V3 Lookup + Learn page |
| **Blocked on** | — |
| **Production URL** | — |
| **Last updated** | 2026-10-19 by Antigravity (V2 Supabase, auth, proxy complete) |

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
| GEMINI_MODEL | ✅ | Selected `gemini-2.5-flash` (fast, low-cost Flash model with structured JSON output). |
| Design gallery | ✅ | Gallery, tokens, illustrations and component specs inspected. |

## Human steps
Things only the human can do. Agents add to this list; the human ticks them.
- [x] Add `GEMINI_API_KEY=<key>` to `D:\Projects\Vocab_App\.env.local` (done 2026-10-19). Agents: keep this line when you add other variables to `.env.local`.
- [ ] When the build is done: open the production URL, log in (password: `OWNER_PASSWORD` in `.env.local`), and try it.

## Environment facts (no secrets here!)
| Item | Value |
|---|---|
| GitHub repo | RHRONY05/Vocab_App (private) |
| Supabase project ref / region | vnadntttnwylvarcqwhe / ap-southeast-1 |
| Vercel project / URL | — |
| Gemini model | gemini-2.5-flash |
| Node / npm | v20.19.2 / 10.8.2 |

## Decisions made during the build
Agents append one line per choice the docs didn't cover (newest last). If it changes a doc, update the doc too.
- 2026-10-19 — Planning: see `AGENTS.md` "Key decisions".
- 2026-10-19 — V0 Preflight: selected `gemini-2.5-flash` for `GEMINI_MODEL` (supports structured outputs and fast Flash-class inference).
- 2026-10-19 — V1 Scaffold: converted AppLayout to a Server Component with Suspense boundaries around client headers/tabbar to support Next.js 16 Partial Prerendering and dynamic routes. Added explicit 768px media queries in `globals.css` for desktop topbar and mobile header/tabbar.
- 2026-10-19 — V2 Supabase & Auth: Configured Next.js 16 `src/proxy.ts` (using proxy convention). Disabled signups via Supabase Management API. Used `supabase.auth.signOut({ scope: "local" })` so browser logout leaves other test sessions intact. Handled `cookies()` safely outside request scope for tests.

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
