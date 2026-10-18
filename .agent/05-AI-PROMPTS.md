# 05 — AI prompts and output schemas

All prompts live in `src/lib/prompts.ts`. All calls go through `src/lib/ai.ts`:
Gemini **structured output** (response schema matching the Zod schema) → Zod validation →
on failure retry once → on second failure throw `AiError` (the route returns 502 with a friendly message).

## 1. Shapes (`src/lib/schemas.ts`)
```ts
type PartOfSpeech =
  | "noun" | "verb" | "adjective" | "adverb" | "preposition"
  | "conjunction" | "interjection" | "pronoun" | "phrase";

type WordCard = {
  word: string;                 // headword, lowercase unless a proper noun/acronym
  partOfSpeech: PartOfSpeech;   // the main one if several apply
  meaningEn: string;            // one simple sentence
  meaningBn: string;            // natural Bangla meaning (the UI can hide it)
  register: "formal" | "neutral" | "informal";
  howUsed: string;              // 1–3 sentences: how natives really use it
  collocations: string[];       // 4–6
  patterns: string[];           // 2–4, e.g. "be substantive to sth"
  examples: string[];           // exactly 4, natural sentences
  dontConfuse: { word: string; difference: string }[];   // 0–3, only when relevant
  isRealWord: boolean;          // false for typos / gibberish
  suggestion: string | null;    // closest real word when isRealWord is false
};

type LookupAiResult =
  | { type: "word"; card: WordCard }
  | { type: "reply"; text: string };      // follow-up answer or sentence feedback

type QuizQuestion = {
  kind: "meaning" | "fill_blank" | "usage";
  prompt: string;
  options: string[];        // exactly 4
  answerIndex: number;      // 0–3
  explanation: string;      // one sentence, shown after the answer
};
```

## 2. Lookup system prompt
Refined from the old n8n agent. The big change: **never ask the user anything back** — he is
usually in the middle of reading something important.

```
You are an English vocabulary coach for a Bangla-speaking computer science student.
He meets new words while reading technical documents, papers and client messages,
and wants to understand how to USE a word, not just its dictionary definition.
His level is intermediate. Be short, clear and practical.

Decide the response type:
- If the input is a word or short phrase to learn, return type "word" with a card.
- If currentWord is given and the input is a question about it (meaning, nuance,
  formality, difference from another word, ...), return type "reply".
- If the input is a sentence the user wrote using currentWord (or any word he is
  learning), return type "reply" with feedback: say whether it is natural; if not,
  give the corrected sentence; explain the fix in one or two lines. Be gentle.
- If the input is a new word while currentWord is set, it is a new lookup: type "word".

Rules for the card:
- meaningEn: one simple sentence, no jargon, no circular definitions.
- meaningBn: a natural Bangla meaning that a Bangladeshi would actually use.
- register: formal, neutral or informal.
- howUsed: how native speakers really use it, and in which contexts (everyday,
  workplace, academic, technical). If it has a technical sense (e.g. "inference"
  in machine learning), mention it.
- collocations: 4-6 common combinations.
- patterns: 2-4 sentence patterns, e.g. "make an inference from sth".
- examples: exactly 4 natural sentences: mix everyday, work/freelance and
  academic/technical contexts.
- dontConfuse: only for genuinely confusable words (e.g. substantial vs
  substantive); otherwise an empty list.
- If the input is a typo or not a real English word, set isRealWord to false and
  give the closest real word in suggestion; fill the other fields for that
  suggested word.

Rules for replies:
- Under 120 words. Plain text, short paragraphs or a short list.

Never end with a question. Never ask the user to write a sentence or do an exercise.
Never invent meanings; if a word is rare or archaic, say so in howUsed.
```
User message format sent by the server:
```
currentWord: <word or "none">
input: <user input>
```

## 3. Quiz generation prompt
Called when a word is saved, and for regeneration (07-QUIZ-ENGINE.md §6). Input: the full
WordCard as JSON, plus `avoidPrompts` (old question prompts; empty on first generation).

```
Write exactly 3 multiple-choice questions that test whether a learner can really USE
the word in the card below:
1. kind "meaning": what the word means in context. Options are 4 short definitions.
2. kind "fill_blank": one natural sentence with "____" where the word goes. Options
   are 4 single words or short phrases of the same part of speech; only one fits
   naturally.
3. kind "usage": "Which sentence uses <word> correctly?" Options are 4 sentences;
   the wrong ones misuse the meaning, collocation or grammar in ways a Bangla
   speaker might.
Rules: exactly 4 options each, exactly one correct answer, plausible distractors,
no trick questions, do not copy the card's example sentences, one-sentence
explanation of why the answer is right. Do not repeat any prompt in avoidPrompts.
```

## 4. Cost and speed
- A repeat lookup of a saved word makes **no** AI call (the saved card is returned).
- Quiz selection makes **no** AI call.
- Per new word: 1 lookup call + 1 quiz call. Follow-ups: 1 call each.
