---
description: Resume work — pick and complete the next unticked task, then keep going
---

1. Read `AGENTS.md`, `.agent/rules/vocab.md` and `.agent/PROGRESS.md`.
2. In `.agent/08-TASKS.md`, find the first task that is not ticked `[x]`. Mark it `— in progress: <your name>`.
3. Read the docs the task references.
4. Implement it and write the tests it names.
5. Run `npm run test:all` (and `npm run build` when routes changed). Check the task's AC in a real browser. Fix until everything passes.
6. Tick the task with a one-line note, update PROGRESS.md ("Now" + a session-log entry), commit, push.
7. Continue with the next task unless the human said to stop or you are blocked on a human step. At the very end, follow V8.
