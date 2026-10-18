# Vocab

A private, single-user vocabulary web application built for Muhammad Rony to replace an n8n + Notion vocabulary agent. Designed desktop-first for daily laptop reading, documentation study, coding, and client communication, with full responsive support for mobile phones (390×844).

- **Production URL:** [https://vocab-rony.vercel.app](https://vocab-rony.vercel.app)
- **Allowed User:** `muhammadrony147@gmail.com`
- **Owner Password:** Stored locally in `.env.local` under `OWNER_PASSWORD`.

---

## Features

- **Fast Intelligent Lookup:** Type any English word to get immediate, structured explanations powered by Google Gemini (`gemini-3.5-flash`), including part of speech, register, natural English meaning, Bangla translation, usage guide, collocations, grammatical patterns, highlighted example sentences, and "Don't confuse with" distinctions.
- **Repeat Lookup Detection:** Looking up an already-saved word returns the saved card immediately without consuming AI calls, while updating lookup frequency and automatically scheduling the word into today's review session if forgotten.
- **Interactive Chat & Sentence Feedback:** Ask follow-up questions about the current word or submit sentences to test your usage and receive immediate grammar feedback and corrections.
- **1-Click Saving:** Save words instantly via the Save button or the `Ctrl + S` (`Cmd + S`) keyboard shortcut. Automatically generates 3 active recall quiz questions upon save.
- **Spaced Repetition Engine (Leitner 5-Box):** Spaced intervals (1d, 3d, 7d, 14d, 30d) with intelligent weakness scoring prioritizing forgotten and overdue words.
- **Dual Review Modes:**
  - *Daily Review:* Weakest-first session capped at 15 due words, with instant end-of-session retries for missed words.
  - *Targeted Practice:* Filter by scope (Week, Month, All Words, Weak Words) and batch size (5, 10, 15) using Efraimidis-Spirakis weighted sampling without duplicate selections.
- **Automated Keepalive Cron:** Daily Vercel cron invoking `/api/cron/keepalive` with bearer token authentication to prevent Supabase free-tier project auto-pausing.

---

## Tech Stack

- **Framework:** Next.js 16 (App Router, Turbopack, React 19, TypeScript strict mode)
- **Styling:** Tailwind CSS v4 with custom CSS design tokens ("calm study desk" palette)
- **Database & Auth:** Supabase (PostgreSQL, Row-Level Security policies, Supabase Auth)
- **AI Engine:** Google Gemini API (`@google/genai`) with structured JSON schema output and Zod validation
- **Testing:** Vitest (unit & integration), Playwright (desktop 1440×900 and mobile 390×844 e2e specs), `@axe-core/playwright` (accessibility)
- **Hosting:** Vercel (Hobby plan)

---

## Browser Search Shortcut

To look up any word directly from your browser's address bar without navigating to the app first:

1. Open your browser settings:
   - **Chrome / Brave:** Go to `Settings` → `Search engine` → `Manage search engines and site search`.
   - **Edge:** Go to `Settings` → `Privacy, search, and services` → `Address bar and search` → `Manage search engines`.
2. Under **Site search**, click **Add**:
   - **Name:** `Vocab`
   - **Shortcut:** `v`
   - **URL with %s in place of query:** `https://vocab-rony.vercel.app/?q=%s`
3. Click **Save**.

Now simply type `v <word>` (e.g. `v cohesive` or `v inference`) into the address bar and press Enter to instantly jump to the word's card!

---

## Local Setup

### 1. Prerequisites
- Node.js ≥ 20
- npm ≥ 10
- Git

### 2. Clone and Install
```bash
git clone https://github.com/RHRONY05/Vocab_App.git
cd Vocab_App
npm install
```

### 3. Environment Configuration
Create a `.env.local` file in the project root:

```ini
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key> # Local admin scripts only, never commit or deploy
GEMINI_API_KEY=<your-gemini-api-key>
GEMINI_MODEL=gemini-3.5-flash
ALLOWED_EMAIL=muhammadrony147@gmail.com
OWNER_PASSWORD=<generated-owner-password>
CRON_SECRET=<generated-cron-secret>
APP_TIMEZONE=Asia/Dhaka
E2E_EMAIL=e2e+vocab@gmail.com
E2E_PASSWORD=<generated-e2e-password>
```

### 4. Database Setup & Seeding
Apply migrations and seed initial vocabulary:
```bash
# Seed initial 6 words (augmentation, cohesive, inference, morph, substantial, substantive)
npx tsx scripts/seed-words.ts
```

### 5. Running the App Locally
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Scripts & Testing

| Command | Description |
|---|---|
| `npm run dev` | Starts local Next.js development server with Turbopack |
| `npm run build` | Compiles production build with TypeScript verification and static analysis |
| `npm run start` | Starts production server locally |
| `npm run lint` | Runs ESLint analysis |
| `npm run typecheck` | Validates TypeScript types across the entire project (`tsc --noEmit`) |
| `npm run test` | Runs pure unit tests (SRS machine, score algorithm, selection, date helpers) |
| `npm run test:int` | Runs API integration tests with isolated E2E user & mocked AI fixtures |
| `npm run test:e2e` | Runs Playwright end-to-end tests across desktop and mobile viewports |
| `npm run test:all` | Executes full validation suite (`typecheck` + `lint` + `test` + `test:int` + `test:e2e`) |
| `npx tsx scripts/verify-production.ts` | Validates live Vercel deployment: auth, seeded words, and live AI lookup |
| `npx tsx scripts/audit-production.ts` | Executes Lighthouse audits on live production URL across desktop & mobile |

---

## Production Lighthouse Verification

Audited on [https://vocab-rony.vercel.app](https://vocab-rony.vercel.app) with authenticated session:

| Page | Viewport | Performance | Accessibility | Best Practices | LCP | CLS | TBT |
|---|---|---|---|---|---|---|---|
| `/login` | Desktop | 99 | 100 | 100 | 0.9s | 0.00 | 0ms |
| `/login` | Mobile | 90 | 100 | 100 | 3.6s | 0.00 | 90ms |
| `/` | Desktop | 99 | 99 | 100 | 0.8s | 0.02 | 0ms |
| `/` | Mobile | 87 | 99 | 100 | 3.8s | 0.07 | 49ms |
| `/words` | Desktop | 95 | 97 | 100 | 0.9s | 0.07 | 0ms |
| `/words` | Mobile | 83 | 100 | 100 | 4.2s | 0.03 | 55ms |
| `/review` | Desktop | 99 | 100 | 100 | 0.8s | 0.00 | 0ms |
| `/review` | Mobile | 96 | 100 | 100 | 2.7s | 0.00 | 29ms |
