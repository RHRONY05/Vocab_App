# PROGRESS — the project's memory

**Every agent reads this first and updates it before ending any session.**
`08-TASKS.md` is the *plan* (what to build). This file is the *state* (where we are).

---

## Now
| | |
|---|---|
| **Phase** | Planned, ready to build |
| **Next task** | V0 Preflight |
| **Blocked on** | — |
| **Production URL** | — |
| **Last updated** | 2026-10-19 by Claude Opus 5.5 (planning) |

## Human steps
Things only the human can do. Agents add to this list; the human ticks them.
- [x] Add `GEMINI_API_KEY=<key>` to `D:\Projects\Vocab_App\.env.local` (done 2026-10-19). Agents: keep this line when you add other variables to `.env.local`.
- [ ] When the build is done: open the production URL, log in (password: `OWNER_PASSWORD` in `.env.local`), and try it.

## Environment facts (no secrets here!)
| Item | Value |
|---|---|
| GitHub repo | — (private) |
| Supabase project ref / region | — / ap-southeast-1 |
| Vercel project / URL | — |
| Gemini model | — |
| Node / npm | — |

## Decisions made during the build
Agents append one line per choice the docs didn't cover (newest last). If it changes a doc, update the doc too.
- 2026-10-19 — Planning: see `AGENTS.md` "Key decisions".

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
