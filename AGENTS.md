<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# AGENTS.md — Start here

This repo is **Vocab**, a private, single-user vocabulary web app for Muhammad Rony
(a Bangla speaker working towards fluent English). It replaces an n8n + Notion vocab agent.

He meets new English words all day while working on his **laptop** (docs, papers, code, client
messages). He types a word, gets a short, practical explanation, saves it with one click,
and later practises saved words in quick quizzes that take a few minutes.

**Planned by** Claude Opus 5.5. **Built by** an AI agent (Antigravity), end to end.
The human checks the finished app; he does not write code.

## Read in this order
0. [.agent/PROGRESS.md](.agent/PROGRESS.md) — where the project is right now (read first, update before you stop)
1. [.agent/rules/vocab.md](.agent/rules/vocab.md) — always-on rules (non-negotiable)
2. [.agent/01-PRODUCT.md](.agent/01-PRODUCT.md) — what the app does, user stories, out of scope
3. [.agent/02-ARCHITECTURE.md](.agent/02-ARCHITECTURE.md) — stack, folders, env, auth, deploy
4. [.agent/03-DATABASE.md](.agent/03-DATABASE.md) — schema, RLS, migration
5. [.agent/04-API.md](.agent/04-API.md) — every route's contract
6. [.agent/05-AI-PROMPTS.md](.agent/05-AI-PROMPTS.md) — prompts and output schemas
7. [.agent/06-UI.md](.agent/06-UI.md) — pages, behaviour, keyboard shortcuts
8. [.agent/design/README.md](.agent/design/README.md) — **the visual design (source of truth)**: tokens + every screen, desktop and mobile
9. [.agent/07-QUIZ-ENGINE.md](.agent/07-QUIZ-ENGINE.md) — spaced repetition and word selection
10. [.agent/09-TESTING.md](.agent/09-TESTING.md) — unit, integration, e2e, Lighthouse targets
11. [.agent/08-TASKS.md](.agent/08-TASKS.md) — the task list (V0 → V8)
12. `.agent/workflows/` — `/next-task` and `/status` (the human's goal command is in `.agent/GOAL.md`)

## Key decisions (already made — do not re-open)
| Topic | Decision |
|---|---|
| Users | Exactly one user. No sign-up page. Login = Supabase Auth email + password. Every API route also checks `user.email === ALLOWED_EMAIL`. |
| Device | **Desktop-first** (laptop browser, ~90% of use). It must still work at 390 px (designs for both are in `.agent/design/`), but there is no PWA and no offline mode. |
| Stack | Next.js 16 (App Router, TypeScript strict) + Tailwind CSS v4 + Supabase (Postgres, Auth, RLS) + Gemini (`@google/genai`) + Zod + Vitest. Hosted on Vercel. |
| Supabase | Cloud project created and managed through the **Supabase MCP**. Free tier only. Every schema change is also a file in `supabase/migrations/`. |
| Vercel | Project, env vars and deploys managed through the **Vercel MCP**. Hobby (free) plan. |
| AI | Gemini, model name from `GEMINI_MODEL`. Structured JSON output validated with Zod. The AI is called **only** for: a new lookup, a follow-up/sentence check, and generating quiz questions. Word selection for quizzes is plain code, never AI. |
| Notion / n8n | Not used. Nothing is migrated. The 6 existing words are seeded in V7. |
| Chat | Not stored in the database. Last 20 messages kept in `localStorage`. Only saved **words** are stored. |
| Repeat lookups | Looking up an already-saved word shows the saved card instantly (no AI call) and counts as a "forgot it" signal (see 07-QUIZ-ENGINE.md). |
| Design | Done by the planner in `.agent/design/`. The builder implements it exactly and makes **no** design decisions. Tokens from `design/tokens.css` only. |
| Testing | Unit + integration (Vitest), e2e on desktop and mobile (Playwright), accessibility (axe), Lighthouse on mobile and desktop with targets in `09-TESTING.md`. Tests use a separate e2e user and mocked AI. |
| Repo | Git + **private** GitHub repo `RHRONY05/Vocab_App`. Never commit secrets. |

## Status
- [x] Planning (2026-10-19)
- [ ] Build V0 → V8
