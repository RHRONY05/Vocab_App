<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# AGENTS.md — Agent Operations & Codebase Guide

This repository is **Vocab**, a private, single-user vocabulary web application for **Muhammad Rony** (`muhammadrony147@gmail.com`).

- **Production URL:** [https://vocab.rhrony05.me](https://vocab.rhrony05.me) *(backup: [https://vocab-rony.vercel.app](https://vocab-rony.vercel.app))*
- **Current Status:** **Production Live & Maintained** (Tasks V0 through V8 complete, verified with 100% test coverage and live deployment).
- **Primary Use:** Daily laptop reading (engineering docs, papers, client messages) to look up words in context, save them with 1 click, and practice via Leitner 5-box spaced repetition. Fully responsive on mobile (390px+).

---

## Read in This Order
0. [.agent/PROGRESS.md](.agent/PROGRESS.md) — **Read first, update before you finish any task** (the project's active memory).
1. [.agent/rules/vocab.md](.agent/rules/vocab.md) — Non-negotiable engineering rules.
2. [.agent/01-PRODUCT.md](.agent/01-PRODUCT.md) — Product requirements and user stories.
3. [.agent/02-ARCHITECTURE.md](.agent/02-ARCHITECTURE.md) — Stack, database, auth, and deployment model.
4. [.agent/03-DATABASE.md](.agent/03-DATABASE.md) — Schema, triggers, and Row-Level Security.
5. [.agent/04-API.md](.agent/04-API.md) — API route contracts and request/response specifications.
6. [.agent/05-AI-PROMPTS.md](.agent/05-AI-PROMPTS.md) — System prompts and structured JSON schemas.
7. [.agent/06-UI.md](.agent/06-UI.md) — Page behaviors, states, and keyboard shortcuts.
8. [.agent/07-QUIZ-ENGINE.md](.agent/07-QUIZ-ENGINE.md) — Leitner SRS engine and word selection algorithms.
9. [.agent/09-TESTING.md](.agent/09-TESTING.md) — Test requirements (unit, integration, E2E, Lighthouse targets).

---

## Where Lives What (Codebase Directory Map)

```
Vocab_App/
├── src/
│   ├── app/                                 # Next.js 16 App Router
│   │   ├── (app)/                           # Authenticated application shell
│   │   │   ├── page.tsx                     # Learn / Chat page (lookup input, thread, word cards)
│   │   │   ├── words/page.tsx               # Words library (instant search, tab counts, infinite feed)
│   │   │   ├── words/[id]/page.tsx          # Word detail page (history, SRS stats, attempt log)
│   │   │   ├── review/page.tsx              # SRS Quiz engine (Daily Review & Targeted Practice)
│   │   │   └── layout.tsx                   # AppLayout (AppHeader, MobileHeader, TabBar, Shortcuts)
│   │   ├── api/                             # Backend Route Handlers
│   │   │   ├── lookup/route.ts              # POST /api/lookup (AI lookup + repeat-lookup DB cache)
│   │   │   ├── words/route.ts               # GET & POST /api/words (list with pagination & save word)
│   │   │   ├── words/[id]/route.ts          # GET & DELETE /api/words/[id]
│   │   │   ├── words/stats/route.ts         # GET /api/words/stats (overview numbers & counts)
│   │   │   ├── quiz/route.ts                # GET /api/quiz (session generator: daily review / practice)
│   │   │   ├── quiz/answer/route.ts         # POST /api/quiz/answer (records attempt, advances/drops box)
│   │   │   └── cron/keepalive/route.ts      # GET /api/cron/keepalive (pings DB daily to prevent sleep)
│   │   ├── login/page.tsx                   # Owner login page (Supabase Auth)
│   │   ├── globals.css                      # Design tokens ("calm study desk"), typography, and styling
│   │   ├── icon.svg & icon.png              # App icons and favicon assets
│   │   └── proxy.ts                         # Next.js 16 proxy middleware (session refresh & auth gating)
│   │
│   ├── components/                          # UI Components
│   │   ├── WordCard.tsx                     # Structured word card (desktop 2-col, mobile stacked)
│   │   ├── Composer.tsx                     # Chat & lookup input with keyboard shortcuts
│   │   ├── MessageList.tsx                  # Chat message feed with markdown renderer
│   │   ├── AiAvatar.tsx                     # Animated SVG/CSS AI icon with breathing glow
│   │   ├── ui.tsx                           # Primitives: Button, Chip, Segmented, Banner, Switch, etc.
│   │   ├── review/                          # Quiz components (MCQ question, results summary, word modal)
│   │   └── words/                           # Word row, filter strip, and word stats pane
│   │
│   └── lib/                                 # Business Logic & Infrastructure
│       ├── ai.ts                            # Google GenAI SDK wrapper (3x retry & fallback models)
│       ├── prompts.ts                       # Gemini system prompts (structured card & markdown reply)
│       ├── schemas.ts                       # Zod schemas (WordCard, QuizQuestion, API contracts)
│       ├── srs.ts                           # Leitner 5-box SRS scheduling & weakness scoring
│       ├── words.ts                         # Word normalizer & repeat lookup helper
│       ├── auth.ts                          # `requireOwner` helper enforcing single-user access
│       ├── utils.ts                         # Utility functions (`cn`, Tailwind merge)
│       └── supabase/                        # Supabase clients (client.ts, server.ts, admin.ts)
│
├── supabase/
│   └── migrations/                          # SQL migrations (schema, RLS, indexes, triggers)
│
├── scripts/                                 # Maintenance & Admin CLI Tools
│   ├── create-user.ts                       # Creates Owner & E2E users via Supabase Admin API
│   ├── seed-words.ts                        # Seeds initial vocabulary words with structured AI cards
│   ├── verify-production.ts                 # Validates live Vercel deployment (auth, lookup, save)
│   └── audit-production.ts                  # Runs automated Lighthouse audits on live URL
│
├── tests/                                   # Complete Test Suite
│   ├── srs.test.ts, score.test.ts, etc.     # Vitest unit tests (deterministic business logic)
│   ├── *.int.test.ts                        # Vitest integration tests (auth, lookup, words, quiz APIs)
│   ├── e2e/                                 # Playwright E2E tests (auth, learn, words, review, a11y)
│   └── helpers/reset.ts                     # Test isolation helper resetting E2E user data
│
└── .agent/                                  # Project Planning & System Memory
    ├── PROGRESS.md                          # Current project state & session history (MUST update)
    ├── rules/vocab.md                       # Strict architectural rules
    └── design/                              # HTML artboards and visual specifications
```

---

## Non-Negotiable Rules for Modifying the Codebase

1. **Single-User Lock:**
   - There is exactly one human user: `muhammadrony147@gmail.com`.
   - Never build a public registration page.
   - Every API route and proxy check MUST verify `user.email === ALLOWED_EMAIL`.

2. **AI Boundary (Zero Unnecessary LLM Calls):**
   - Gemini (`@google/genai`) is called **only** for:
     1. Looking up a new word.
     2. Answering a follow-up question or checking a user's practice sentence.
     3. Generating quiz questions when a word is saved or promoted.
   - Word selection for quizzes, SRS scheduling, and box calculations are **pure deterministic code**, never AI.
   - Looking up an already-saved word returns the cached card from the database instantly (0s AI latency).

3. **Design System & Tokens:**
   - All styling uses design tokens in `src/app/globals.css` ("calm study desk" palette).
   - Desktop layout uses the 2-column grid (`136px 1fr`); mobile (< 768px) stacks section headings on top with full-width content blocks underneath.
   - Never introduce ad-hoc hex colors or unapproved font families.

4. **Database & Migrations:**
   - Database operations use Supabase Postgres with Row-Level Security (RLS) enabled on all tables.
   - Any database schema changes must be committed as a migration file in `supabase/migrations/`.

5. **Test Discipline & Verification Before Finishing:**
   Before declaring any task or modification complete, you must verify:
   ```bash
   npm run typecheck    # TypeScript strict check (0 errors)
   npm run test         # Unit tests (42 passed)
   npm run test:int     # Integration tests (26 passed)
   npm run build        # Production Next.js build
   ```
   If modifying UI or flows, run targeted Playwright tests:
   ```bash
   npx playwright test tests/e2e/learn.spec.ts tests/e2e/visual.spec.ts
   ```

6. **Keep PROGRESS.md Updated:**
   - Always append an entry to [.agent/PROGRESS.md](.agent/PROGRESS.md) summarizing changes, test results, and next steps before finishing any turn.
