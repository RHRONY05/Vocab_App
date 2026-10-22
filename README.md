<div align="center">
  <a href="https://vocab.rhrony05.me">
    <img src="public/icon-192.png" width="80" height="80" alt="Vocab Logo" style="border-radius: 18px;" />
  </a>
  <h1>Vocab</h1>
  <p><strong>A private, intelligent vocabulary companion for daily reading, code study, and active recall.</strong></p>
  <p>
    <a href="https://vocab.rhrony05.me"><strong>🌐 vocab.rhrony05.me</strong></a>
    &nbsp;•&nbsp;
    <a href="https://vocab-rony.vercel.app">Vercel Mirror</a>
  </p>

  <p>
    <a href="https://nextjs.org/"><img src="https://img.shields.io/badge/Next.js-16.4-black?style=flat-square&logo=next.js" alt="Next.js 16" /></a>
    <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-5.x-blue?style=flat-square&logo=typescript" alt="TypeScript" /></a>
    <a href="https://tailwindcss.com/"><img src="https://img.shields.io/badge/Tailwind_CSS-v4-38bdf8?style=flat-square&logo=tailwindcss" alt="Tailwind CSS v4" /></a>
    <a href="https://ai.google.dev/"><img src="https://img.shields.io/badge/Google_Gemini-API-orange?style=flat-square&logo=google" alt="Google Gemini" /></a>
    <a href="https://supabase.com/"><img src="https://img.shields.io/badge/Supabase-PostgreSQL_%26_Auth-3ecf8e?style=flat-square&logo=supabase" alt="Supabase" /></a>
    <a href="https://vercel.com/"><img src="https://img.shields.io/badge/Vercel-Deployed-black?style=flat-square&logo=vercel" alt="Vercel" /></a>
    <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square" alt="License: MIT" /></a>
  </p>
</div>

---

## The Problem & The Solution

### The Problem
Traditional dictionaries give rigid, literal definitions. When reading technical documentation, papers, or drafting professional client messages, knowing just the literal meaning of a word isn't enough:
- You need to know **how it's naturally used** in real-world contexts.
- You need to know **what words pair with it** (collocations) and what grammatical patterns follow it.
- You need to avoid **confusing it with similar-sounding words**.
- Previous attempts using an n8n webhook + Notion database were slow, disconnected from a daily reading workflow, and lacked an active recall system to help retain the words.

### The Solution
**Vocab** explains English words **the way you actually need them**:
- Instead of dry dictionary entries, it breaks down each word with practical context, common collocations, real-world examples, and Bengali nuance.
- Designed **desktop-first** for rapid keyboard lookups while working, with full responsive support on mobile.
- Backed by an intelligent **Leitner 5-Box Spaced Repetition System (SRS)** so that looked-up words are never forgotten.

---

## What You Can Do

### 1. Get Practical, Contextual Word Meanings
Type any English word (or ask for multiple words at once) to get a structured explanation:
- **Natural Definition & Register:** Plain-English meaning with formality tone (formal, neutral, informal).
- **Bengali Nuance:** Direct Bangla translation (`বাংলা`) to bridge understanding instantly.
- **How It's Used:** Practical workplace, engineering, and everyday usage notes.
- **Collocations:** High-frequency word pairings (e.g., *“sign a lease”*, *“substantive discussion”*).
- **Grammatical Patterns & Numbered Examples:** Sentence patterns and real examples with the target word highlighted.
- **“Don't Confuse”:** Clear distinctions between easily confused words (e.g., *substantive* vs. *substantial*).

### 2. Interactive Chat & Sentence Checking
- Ask follow-up questions about the word in a clean, conversational thread.
- Write your own practice sentences and receive immediate grammar analysis, naturalness feedback, and suggested refinements.

### 3. 1-Click & Keyboard Shortcut Saving
- Save any looked-up word instantly with the **Save** button or via `Ctrl + S` (`Cmd + S`).
- Repeat lookups of already-saved words display your saved card instantly with zero AI latency, while scheduling the word into today's review if you forgot it.

### 4. Spaced Repetition Quizzes (SRS)
- **Daily Review:** Practice due words every day based on the Leitner 5-box schedule (1d, 3d, 7d, 14d, 30d). Overdue and weak words are surfaced first, with instant retries for mistakes at the end of the session.
- **Targeted Practice:** Test yourself anytime across customizable scopes:
  - **Weekly:** Words added or practiced this week.
  - **Monthly:** Words from the current month.
  - **All Time:** Your entire vocabulary library.
  - **Weak Words:** Words with low accuracy scores that need reinforcement.

---

## Documentation

Comprehensive design specifications, prompt engineering guidelines, database schemas, and Leitner SRS algorithm details are organized under the `.agent/` folder (and upcoming `/docs` directory).

---

## Local Setup & Deployment

If you want to run or deploy your own instance of Vocab:

### 1. Prerequisites
- **Node.js** ≥ 20
- **npm** ≥ 10
- **Git**
- A free **[Supabase](https://supabase.com/)** account (Postgres database & Auth)
- A **[Google AI Studio](https://aistudio.google.com/)** Gemini API Key

### 2. Clone and Install
```bash
git clone https://github.com/RHRONY05/Vocab_App.git
cd Vocab_App
npm install
```

### 3. Environment Variables
Create a `.env.local` file in the root of the project:

```ini
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-supabase-service-role-key> # Local admin/migration scripts only

# Google Gemini AI
GEMINI_API_KEY=<your-gemini-api-key>
GEMINI_MODEL=gemini-3.5-flash

# Access Control & Auth
ALLOWED_EMAIL=<your-login-email@example.com>
OWNER_PASSWORD=<your-strong-owner-password>

# App Settings
APP_TIMEZONE=Asia/Dhaka
CRON_SECRET=<random-secret-for-cron-keepalive>

# E2E Testing (Optional - for local test suites)
E2E_EMAIL=e2e+vocab@gmail.com
E2E_PASSWORD=<e2e-user-password>
```

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase public anonymous client key. |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (used only in local admin/seed scripts). |
| `GEMINI_API_KEY` | Google Gemini API key for structured vocabulary generation. |
| `GEMINI_MODEL` | Gemini model name (default: `gemini-3.5-flash`). |
| `ALLOWED_EMAIL` | Single-user protection: only this email address can access the app. |
| `OWNER_PASSWORD` | Password used to authenticate the owner account. |
| `APP_TIMEZONE` | Timezone for SRS daily review cutoff (e.g. `Asia/Dhaka`). |
| `CRON_SECRET` | Bearer token securing `/api/cron/keepalive` against unauthorized calls. |

### 4. Database Setup
1. Create a new project in your Supabase dashboard.
2. Run the SQL schema migration located in `supabase/migrations/20261019031100_init.sql` using the Supabase SQL Editor.
3. Create your user account:
```bash
npx tsx scripts/create-user.ts
```
4. *(Optional)* Seed initial words:
```bash
npx tsx scripts/seed-words.ts
```

### 5. Run Locally
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) and log in with your configured `ALLOWED_EMAIL` and `OWNER_PASSWORD`.

---

## Deployment (Vercel)

1. Push your repository to GitHub.
2. Import the repository into **[Vercel](https://vercel.com/)**.
3. In project settings, add the environment variables defined above (exclude `SUPABASE_SERVICE_ROLE_KEY` for maximum production safety).
4. Deploy! Next.js 16 App Router builds automatically with Turbopack.
5. *(Optional)* Vercel Cron will automatically trigger `/api/cron/keepalive` daily to ensure the Supabase free-tier database remains active.

---

## License

This project is open-source and available under the [MIT License](LICENSE) © 2026 [Muhammad Rony](https://github.com/RHRONY05).
