# Vocab — always-on rules

If a rule conflicts with a task description, the rule wins — stop and flag it in the "Questions for the human" section of `08-TASKS.md`.

## Workflow
- Start every session by reading `AGENTS.md` and `.agent/PROGRESS.md`.
- Pick work only from `.agent/08-TASKS.md`, in order, one task at a time. Mark it `— in progress: <agent>` when you start.
- Do not invent features that are not in `01-PRODUCT.md`. If something is missing or contradictory, choose the simpler option, note it in PROGRESS.md "Decisions made during the build", and continue.
- Definition of done for every task:
  - `npm run typecheck`, `npm run lint`, `npm run test` pass, plus `npm run test:int` and `npm run test:e2e` once they exist (from V2 / V3 on). Add the specs the task names (`09-TESTING.md`).
  - The task's acceptance criteria (AC) pass, checked in a real browser at **1440×900** and **390×844**.
  - UI tasks: the page matches the matching file in `.agent/design/` (side by side, light and dark).
  - No `console.log`, no commented-out code, no `any` without a comment explaining why.
  - Task ticked `[x]` with a one-line note; PROGRESS.md updated ("Now" table + a session-log entry); committed with a conventional message (`feat:`, `fix:`, `test:`, `chore:`, `docs:`).
- One branch is enough (`main`); commit after every task. Never force-push.
- Before ending any session: update PROGRESS.md. A session that ends without it is not done.

## Database (Supabase MCP)
- Before creating a project, list existing projects and orgs. **Free tier only.** Ask the human before anything that has a cost (check with `get_cost`). The free tier allows 2 active projects per org; if both slots are used, ask the human which org to use or which project to pause. Never pause or delete a project yourself.
- Every schema change = a migration file first (`supabase/migrations/<YYYYMMDDHHMMSS>_<name>.sql`), then apply it with `apply_migration` using the same name. Use `execute_sql` only for reads, tests and seed data.
- After each migration: regenerate types into `src/types/database.ts` and run `get_advisors`; fix every security warning.
- RLS is on for every table.

## Secrets
- Never commit keys. `.env.local` is git-ignored; `.env.example` lists variable **names** only.
- `GEMINI_API_KEY`, `CRON_SECRET` and the Supabase service-role key are server-only: never in client code and never in a `NEXT_PUBLIC_*` variable. The deployed app does not use the service-role key at all.
- Never print a secret's value in chat, logs or PROGRESS.md.

## Code style
- TypeScript strict. Server Components by default; `"use client"` only where interaction needs it.
- Validate every input crossing a boundary (request bodies, query params, AI output) with Zod (`src/lib/schemas.ts`).
- Pure logic (SRS, word selection, date ranges) lives in `src/lib/` with no I/O, and has unit tests.
- **Do not design.** Layout, colours, spacing, type and copy come from `.agent/design/`. Colours, radii, shadows and fonts only through the tokens copied from `design/tokens.css` into `globals.css`: no raw hex values in components. Follow the system light/dark theme.
- Ask before adding a dependency not listed in `02-ARCHITECTURE.md` (note it in PROGRESS.md).

## Quality bar
- Speed matters: the user looks up a word mid-reading. Show a loading state immediately; never block the input.
- Every async action has loading, success and a friendly error state with Retry. Nothing fails silently.
- Keyboard-first on desktop (shortcuts in `06-UI.md`). Visible focus, labelled icon buttons, AA contrast.
