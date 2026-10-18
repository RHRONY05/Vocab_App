# 04 — API contracts

All routes: JSON in/out, `requireOwner()` first (401 `{ error: "unauthorized" }`),
Zod-validate input (400 `{ error, details }`). AI failure → 502 `{ error: "ai_unavailable" }`.
Unexpected → 500 `{ error: "server_error" }` (log the cause server-side, never leak it).
Date ranges use `APP_TIMEZONE`.

## `POST /api/lookup`
Input: `{ input: string (1–300 chars, trimmed), currentWord?: string }`

Flow:
1. If `input` looks like a word/short phrase (≤ 4 words, no `?`, no sentence-ending `.`) **and**
   matches a saved word (case-insensitive) → apply the repeat-lookup rule (07-QUIZ-ENGINE.md §2),
   return the saved card. **No AI call.**
2. Else call the lookup prompt (05-AI-PROMPTS.md §2).
3. If the AI returns a `word` card whose `word` matches a saved word → treat as step 1
   (repeat-lookup rule + return the saved card).

Output:
```ts
| { type: "word"; card: WordCard; source: "ai" | "saved";
    saved: null | { id: string; lookupCount: number; box: number; createdAt: string };
    repeatCounted: boolean }       // true when this lookup incremented lookup_count
| { type: "reply"; text: string }
```

## `POST /api/words`
Input: `{ card: WordCard }` (`isRealWord` must be true, else 400).
Generates the quiz (05 §3), then inserts, or updates `card` + `quiz` if the word exists.
If quiz generation fails, save anyway with `quiz = []` (recall questions still work) and return `quizReady: false`.
Output: `{ id, status: "created" | "updated", quizReady: boolean }`

## `GET /api/words?range=today|week|month|all&q=&page=1`
30 per page, newest first; `q` = case-insensitive contains on `word`.
Output:
```ts
{ words: { id, word, partOfSpeech, meaningEn, status: "new"|"learning"|"mastered",
           lookupCount, createdAt }[],
  counts: { today, week, month, all },
  hasMore: boolean }
```

## `GET /api/words/stats`
Output:
```ts
{ total, new, learning, mastered, dueNow, reviewedToday, savedToday,
  duePreview: { id: string; word: string; lookupCount: number }[],   // up to 4 due words, weakest first
  nextDue: null | { at: string; count: number } }                    // only when dueNow = 0: the next day
                                                                     // that has due words and how many
```
Used by the header badge, Learn empty state, Words `ProgressStrip` and Review start (06-UI.md).

## `GET /api/words/[id]` · `DELETE /api/words/[id]`
GET → `{ id, card, status, box, nextReviewAt, lookupCount, correctCount, wrongCount, createdAt,
lastAttempts: { kind, correct, answeredAt }[] (last 3, newest first) }`. DELETE → 204. Unknown id → 404.

## `GET /api/quiz?mode=review|practice&scope=week|month|all|weak&size=5|10|20`
`scope` and `size` only for practice. Uses `lib/quiz/select.ts`.
Output:
```ts
{ questions: {
    wordId: string; word: string; kind: "meaning"|"fill_blank"|"usage"|"recall";
    prompt: string; options: string[];   // shuffled; empty for recall
    answerIndex: number;                 // -1 for recall
    explanation: string;                 // MCQ: one sentence. Recall: meaningEn
    recall?: { partOfSpeech: string; meaningBn: string; example: string };  // recall only
    isRetry?: false                      // the client sets true on end-of-session repeats
  }[],
  remainingDue: number }                 // review mode: due words left after this batch
```
The answer is sent to the client: this is a single-user learning app, cheating is not a concern.

## `POST /api/quiz/answer`
Input: `{ wordId, kind, mode: "review"|"practice", correct: boolean, isRepeat: boolean }`
- `isRepeat: true` (end-of-session retry) → insert nothing, change nothing, return current state.
- Else apply `lib/quiz/srs.ts`, update the word, insert a `quiz_attempts` row.
- If the word was promoted into box 3 or 5 → schedule quiz regeneration with `after()`.
Output: `{ box, previousBox, status, nextReviewAt }` — the client uses `box > previousBox` and
`status === "mastered"` (newly) to build the end-screen summary.

## `GET /api/cron/keepalive`
Requires `Authorization: Bearer ${CRON_SECRET}` (else 401). Runs a trivial read so the free
Supabase project never pauses. Output `{ ok: true }`.
