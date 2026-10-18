# 07 — Quiz engine (spaced repetition + word selection)

**Principle:** the app never quizzes "all words from this week". Each word carries its own
memory state and comes back exactly when it is about to be forgotten. Choosing words is plain,
tested code in `src/lib/quiz/`. The AI only writes the questions, once per word, at save time.

## 1. Memory state per word: Leitner boxes
| Box | Meaning | Next review after a correct answer |
|---|---|---|
| 0 | New (saved, never reviewed) | first review is due 1 day after saving |
| 1 | Learning | 1 day |
| 2 | Learning | 3 days |
| 3 | Learning | 7 days |
| 4 | Mastered | 16 days |
| 5 | Mastered | 35 days (stays in box 5, keeps coming back every 35 days) |

## 2. What changes the state (`lib/quiz/srs.ts`, pure)
| Event | Effect |
|---|---|
| **Review** answer, correct | `box = min(box + 1, 5)`; `next_review_at = now + interval(box)` |
| **Review** answer, wrong | `box = 1`; `next_review_at = now + 1 day` |
| **Practice** answer, wrong | same as a wrong review answer (it's an honest "I don't know it") |
| **Practice** answer, correct | if the word is due → same as a correct review; if not due → only `correct_count++` (no promotion, so cramming can't fake mastery) |
| **Repeat lookup** of a saved word (more than 12 h after its `last_looked_up_at`) | `lookup_count++`; `last_looked_up_at = now`; if `box > 1` then `box = 1`; `next_review_at = now` (due today). Within 12 h: only `last_looked_up_at = now` (re-reading the same document doesn't count twice). |

Every answer also sets `last_reviewed_at`, `review_count++`, `correct_count++`/`wrong_count++`, and inserts a `quiz_attempts` row.

## 3. Weakness score (`lib/quiz/score.ts`, pure)
```
weakness = 2 × (5 − box)                         // new / low-box words are weaker (0..10)
         + 3 × (lookup_count − 1)                // each repeat lookup = forgot it
         + max(0, 2 × wrong_count − correct_count)
         + 0.5 × min(days_overdue, 10)           // 0 when not due
```
Example: "sustainable", box 1, looked up 3 times, wrong 2, correct 1 → 8 + 6 + 3 + 0 = **17**.
A word in box 5, looked up once, never wrong → **0**.

## 4. Choosing words (`lib/quiz/select.ts`, pure, RNG injected for tests)

### Mode A — Daily review (the main habit)
- Candidates: words with `next_review_at <= now`.
- Order: weakness, highest first. Take **15** (`REVIEW_CAP`).
- If more are due, the end screen shows "N more due — continue" (another 15).
- Nothing due → "All caught up" + buttons for practice.

So 100 words saved this week does **not** mean 100 questions: on any day only the words that are
due appear, and words you know well drift to 16–35-day gaps.

### Mode B — Practice (optional, any time)
- Scope: `week` (last 7 days) · `month` (this calendar month) · `all` · `weak` (top 30 by weakness across all words).
- Round size: 5 · 10 · 20 (fewer if fewer candidates).
- Weighted random sample **without replacement**, `weight = 1 + weakness`
  (Efraimidis–Spirakis: `key = random() ^ (1 / weight)`, take the top N keys).
  Weak words appear much more often, but strong words still show up sometimes.

### Within a session
- Wrong answers are asked once more at the end of the session (a different question kind if one
  exists). The repeat does **not** change the SRS state again.

## 5. Choosing the question for a word
Kinds: `meaning`, `fill_blank`, `usage` (AI-generated, stored in `words.quiz`) and `recall`
(built from the card, no AI: show the word → user thinks → reveal meaning + one example →
user marks "I knew it" / "I didn't").

| Box | Allowed kinds (easier → harder) |
|---|---|
| 0–1 | `meaning`, `fill_blank` |
| 2–3 | `fill_blank`, `usage` |
| 4–5 | `usage`, `recall` |

Pick randomly among the allowed kinds, avoiding the kind of this word's most recent attempt
when another is allowed. If the stored quiz has no question of that kind (e.g. generation
failed), fall back to `recall`. Shuffle options every time a question is served.

## 6. Keeping questions fresh
3 stored questions get memorised. When a word is **promoted into box 3 or box 5**, regenerate its
quiz in the background after the response is sent (Next.js `after()`), passing the old prompts so
the model writes new ones. On failure keep the old questions. Saving an existing word again also
regenerates them.

## 7. Required unit tests
- `srs.test.ts`: every row of the table in §2, box 5 stays 5, the 12-hour repeat-lookup rule.
- `score.test.ts`: the two examples in §3; never negative.
- `select.test.ts`: review takes only due words, weakest first, capped at 15; practice never returns duplicates, respects size and scope; with a seeded RNG, a word with weight 20 is picked far more often than one with weight 1 over 1,000 runs; question-kind rules and fallback to `recall`.
- `dates.test.ts`: today / last 7 days / this month boundaries in `Asia/Dhaka`, including a time just after midnight Dhaka (still the previous day in UTC).
