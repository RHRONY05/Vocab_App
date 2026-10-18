# PROGRESS — the project's memory

**Every agent reads this first and updates it before ending any session.**
`08-TASKS.md` is the *plan* (what to build). This file is the *state* (where we are).

---

## Now
| | |
|---|---|
| **Phase** | Building (V0 done, V1 next) |
| **Next task** | V1 Scaffold + design system |
| **Blocked on** | — |
| **Production URL** | — |
| **Last updated** | 2026-10-19 by Antigravity (V0 Preflight complete) |

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
| Supabase project ref / region | — / ap-southeast-1 |
| Vercel project / URL | — |
| Gemini model | gemini-2.5-flash |
| Node / npm | v20.19.2 / 10.8.2 |

## Decisions made during the build
Agents append one line per choice the docs didn't cover (newest last). If it changes a doc, update the doc too.
- 2026-10-19 — Planning: see `AGENTS.md` "Key decisions".
- 2026-10-19 — V0 Preflight: selected `gemini-2.5-flash` for `GEMINI_MODEL` (supports structured outputs and fast Flash-class inference).

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
