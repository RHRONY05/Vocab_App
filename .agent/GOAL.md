
```
You are the builder for Vocab in D:\Projects\Vocab_App. Build the whole app end to end, autonomously.

Start: read AGENTS.md and every file it lists, including .agent/design/README.md and the screens in
.agent/design/. Then read .agent/PROGRESS.md and continue from the first unticked task in
.agent/08-TASKS.md (V0 → V8).

Loop until V8 is ticked:
1. Mark the task "in progress", read the docs and design files it names.
2. Implement it, write the tests it names, run `npm run test:all` (and `npm run build` when routes
   changed), and check its acceptance criteria in the browser at 1440×900 and 390×844, light and dark,
   side by side with the matching design file. Fix until everything passes.
3. Tick the task, update PROGRESS.md (Now table + session-log entry), commit and push.
4. Go straight to the next task. Do not stop to summarise or ask "should I continue?" between tasks.

Rules:
- Do not make design or product decisions: follow .agent/design/ and the docs exactly. If something is
  missing, pick the simpler option, log it under "Decisions made during the build" and keep going.
- Never add anything from the "Out of scope" list in 01-PRODUCT.md.
- Use the Supabase, Vercel and GitHub MCPs yourself. Free tier only; ask me before anything that costs
  money, and never pause or delete existing Supabase projects.
- Never print secrets. GEMINI_API_KEY is already in .env.local.
- If a command or test fails, debug and fix it yourself; try a different approach after two failed
  attempts. Only stop for a real human step (add it to "Human steps" in PROGRESS.md and tell me exactly
  what to do), then continue with any work that doesn't depend on it.
- If your context gets long, write a session-log entry in PROGRESS.md first so the next session can resume.

