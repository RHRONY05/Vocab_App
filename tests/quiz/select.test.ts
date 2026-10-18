import { describe, it, expect } from "vitest";
import {
  selectReviewWords,
  selectPracticeWords,
  selectQuestionForWord,
  SelectWordCandidate,
  REVIEW_CAP,
} from "@/lib/quiz/select";
import { WordCard, QuizQuestion } from "@/lib/schemas";

function createSeededRng(seed = 123456789) {
  let s = seed;
  return function () {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return (s + 1) / 4294967297;
  };
}

const mockCard: WordCard = {
  word: "test",
  partOfSpeech: "noun",
  meaningEn: "A procedure intended to establish the quality, performance, or reliability of something.",
  meaningBn: "পরীক্ষা বা যাচাই",
  register: "neutral",
  howUsed: "Common in everyday, technical and workplace English.",
  collocations: ["conduct a test", "pass a test", "rigorous test", "test result"],
  patterns: ["put sth to the test"],
  examples: [
    "The engineer conducted a stress test on the server.",
    "Students took the final exam as a test of their progress.",
    "The new feature is currently in user testing.",
    "Her patience was put to the ultimate test during the delay.",
  ],
  dontConfuse: [],
  isRealWord: true,
  suggestion: null,
};

const mockQuiz: QuizQuestion[] = [
  {
    kind: "meaning",
    prompt: "What does test mean?",
    options: ["A trial or evaluation", "A type of tree", "A slow dance", "An old building"],
    answerIndex: 0,
    explanation: "A test is a trial or evaluation.",
  },
  {
    kind: "fill_blank",
    prompt: "The team conducted a ____ on the database.",
    options: ["test", "toast", "taste", "task"],
    answerIndex: 0,
    explanation: "'test' fits the context of evaluating a database.",
  },
  {
    kind: "usage",
    prompt: "Which sentence uses 'test' correctly?",
    options: [
      "The scientist tested the hypothesis thoroughly.",
      "She will test down the street tomorrow.",
      "The test was too blue to eat.",
      "He test a cup of coffee yesterday.",
    ],
    answerIndex: 0,
    explanation: "The scientist evaluated the hypothesis.",
  },
];

function makeCandidate(
  id: string,
  word: string,
  box: number,
  overdueHours: number,
  weaknessAttrs: {
    lookup_count?: number;
    correct_count?: number;
    wrong_count?: number;
    createdHoursAgo?: number;
    quiz?: QuizQuestion[];
    lastAttemptKind?: "meaning" | "fill_blank" | "usage" | "recall";
  } = {}
): SelectWordCandidate {
  const baseTime = new Date("2026-10-19T10:00:00.000Z");
  const nextReviewAt = new Date(baseTime.getTime() - overdueHours * 60 * 60 * 1000);
  const createdAt = new Date(baseTime.getTime() - (weaknessAttrs.createdHoursAgo ?? 24) * 60 * 60 * 1000);

  return {
    id,
    word,
    box,
    lookup_count: weaknessAttrs.lookup_count ?? 1,
    correct_count: weaknessAttrs.correct_count ?? 0,
    wrong_count: weaknessAttrs.wrong_count ?? 0,
    next_review_at: nextReviewAt.toISOString(),
    created_at: createdAt.toISOString(),
    card: { ...mockCard, word },
    quiz: weaknessAttrs.quiz ?? mockQuiz,
    lastAttemptKind: weaknessAttrs.lastAttemptKind,
  };
}

describe("Word & Question Selection Engine (lib/quiz/select.ts)", () => {
  const baseTime = new Date("2026-10-19T10:00:00.000Z");

  describe("Review Mode", () => {
    it("takes only due words, weakest first, capped at 15", () => {
      const candidates: SelectWordCandidate[] = [];

      // 20 due words with varying weaknesses
      for (let i = 1; i <= 20; i++) {
        // Higher i -> lower box -> higher weakness
        const box = i <= 5 ? 0 : i <= 10 ? 1 : i <= 15 ? 2 : 3;
        candidates.push(
          makeCandidate(`due-${i}`, `due-word-${i}`, box, 1, {
            lookup_count: i, // higher i has more lookups -> weaker
          })
        );
      }

      // 5 not-due words (in the future)
      for (let i = 1; i <= 5; i++) {
        candidates.push(
          makeCandidate(`future-${i}`, `future-word-${i}`, 4, -24, {
            lookup_count: 1,
          })
        );
      }

      const result = selectReviewWords(candidates, baseTime);

      expect(result.questions).toHaveLength(REVIEW_CAP); // 15
      expect(result.remainingDue).toBe(5); // 20 - 15 = 5

      // Check none of the future words were selected
      const selectedIds = result.questions.map((q) => q.wordId);
      for (let i = 1; i <= 5; i++) {
        expect(selectedIds).not.toContain(`future-${i}`);
      }

      // Check that the weakest words came first (due-20, due-19, etc.)
      expect(selectedIds[0]).toBe("due-20");
      expect(selectedIds[1]).toBe("due-19");
    });

    it("returns empty questions and remainingDue: 0 when nothing is due", () => {
      const candidates: SelectWordCandidate[] = [
        makeCandidate("future-1", "future-word-1", 3, -12),
        makeCandidate("future-2", "future-word-2", 4, -48),
      ];

      const result = selectReviewWords(candidates, baseTime);
      expect(result.questions).toHaveLength(0);
      expect(result.remainingDue).toBe(0);
    });
  });

  describe("Practice Mode", () => {
    it("never returns duplicates, respects size and scope", () => {
      const candidates: SelectWordCandidate[] = [];

      // 30 words created over 14 days
      for (let i = 1; i <= 30; i++) {
        const createdHoursAgo = i * 10; // 10h to 300h
        candidates.push(
          makeCandidate(`word-${i}`, `word-${i}`, 1, 0, {
            createdHoursAgo,
            lookup_count: i,
          })
        );
      }

      // Week scope (within last 7 days = 168 hours)
      const weekStart = new Date(baseTime.getTime() - 7 * 24 * 60 * 60 * 1000);
      const weekResult = selectPracticeWords({
        words: candidates,
        scope: "week",
        size: 5,
        weekStart,
        now: baseTime,
      });

      expect(weekResult.questions).toHaveLength(5);
      const uniqueWeekIds = new Set(weekResult.questions.map((q) => q.wordId));
      expect(uniqueWeekIds.size).toBe(5); // No duplicates!

      // All scope with size 20
      const allResult = selectPracticeWords({
        words: candidates,
        scope: "all",
        size: 20,
        now: baseTime,
      });

      expect(allResult.questions).toHaveLength(20);
      const uniqueAllIds = new Set(allResult.questions.map((q) => q.wordId));
      expect(uniqueAllIds.size).toBe(20); // No duplicates!

      // Size larger than available candidates
      const smallCandidates = candidates.slice(0, 3);
      const smallResult = selectPracticeWords({
        words: smallCandidates,
        scope: "all",
        size: 10,
        now: baseTime,
      });
      expect(smallResult.questions).toHaveLength(3);
    });

    it("picks a high-weight word far more often than a low-weight word with seeded RNG", () => {
      // Word A has weakness ~19 (weight 20): box 0, lookup 4 (3*3=9), wrong 3 (2*3=6) -> 10 + 9 + 6 = 25
      const wordA = makeCandidate("word-a", "weak-word", 0, 0, {
        lookup_count: 4,
        wrong_count: 3,
      });

      // Word B has weakness 0 (weight 1): box 5, lookup 1, wrong 0, correct 5
      const wordB = makeCandidate("word-b", "strong-word", 5, 0, {
        lookup_count: 1,
        wrong_count: 0,
        correct_count: 5,
      });

      const rng = createSeededRng(42);
      let countA = 0;
      let countB = 0;
      const runs = 1000;

      for (let i = 0; i < runs; i++) {
        const result = selectPracticeWords({
          words: [wordA, wordB],
          scope: "all",
          size: 1,
          now: baseTime,
          rng,
        });
        if (result.questions[0].wordId === "word-a") {
          countA++;
        } else {
          countB++;
        }
      }

      // Word A has weight ~26, Word B has weight 1.
      // Word A should be picked > 90% of the time (typically > 950 times).
      expect(countA).toBeGreaterThan(900);
      expect(countB).toBeLessThan(100);
    });
  });

  describe("Question Kind Rules & Fallback", () => {
    it("restricts box 0–1 to meaning and fill_blank", () => {
      const word = makeCandidate("w1", "test-w1", 1, 0);
      const kinds = new Set<string>();

      for (let i = 0; i < 50; i++) {
        const q = selectQuestionForWord(word);
        kinds.add(q.kind);
      }

      expect(kinds.has("meaning") || kinds.has("fill_blank")).toBe(true);
      expect(kinds.has("usage")).toBe(false);
      expect(kinds.has("recall")).toBe(false);
    });

    it("restricts box 2–3 to fill_blank and usage", () => {
      const word = makeCandidate("w2", "test-w2", 2, 0);
      const kinds = new Set<string>();

      for (let i = 0; i < 50; i++) {
        const q = selectQuestionForWord(word);
        kinds.add(q.kind);
      }

      expect(kinds.has("fill_blank") || kinds.has("usage")).toBe(true);
      expect(kinds.has("meaning")).toBe(false);
    });

    it("restricts box 4–5 to usage and recall", () => {
      const word = makeCandidate("w4", "test-w4", 4, 0);
      const kinds = new Set<string>();

      for (let i = 0; i < 50; i++) {
        const q = selectQuestionForWord(word);
        kinds.add(q.kind);
      }

      expect(kinds.has("usage") || kinds.has("recall")).toBe(true);
      expect(kinds.has("meaning")).toBe(false);
      expect(kinds.has("fill_blank")).toBe(false);
    });

    it("avoids the kind of the most recent attempt when another is allowed", () => {
      // In box 1: allowed are ["meaning", "fill_blank"].
      // If lastAttemptKind was "meaning", it MUST pick "fill_blank".
      const word = makeCandidate("w1", "test-w1", 1, 0, {
        lastAttemptKind: "meaning",
      });

      for (let i = 0; i < 20; i++) {
        const q = selectQuestionForWord(word);
        expect(q.kind).toBe("fill_blank");
      }
    });

    it("falls back to recall when stored quiz is empty or missing chosen kind", () => {
      const word = makeCandidate("w-empty", "morph", 0, 0, {
        quiz: [], // no AI questions
      });

      const q = selectQuestionForWord(word);
      expect(q.kind).toBe("recall");
      expect(q.prompt).toBe("morph");
      expect(q.options).toEqual([]);
      expect(q.answerIndex).toBe(-1);
      expect(q.recall?.partOfSpeech).toBe("noun");
      expect(q.recall?.meaningBn).toBe(mockCard.meaningBn);
    });

    it("shuffles MCQ options while preserving correct answer index", () => {
      const word = makeCandidate("w1", "test", 0, 0);
      const q = selectQuestionForWord(word);

      expect(q.options).toHaveLength(4);
      expect(q.answerIndex).toBeGreaterThanOrEqual(0);
      expect(q.answerIndex).toBeLessThan(4);

      // The selected option at answerIndex must match the correct answer from mockQuiz
      const originalQuestion = mockQuiz.find((orig) => orig.kind === q.kind)!;
      const originalAnswer = originalQuestion.options[originalQuestion.answerIndex];
      expect(q.options[q.answerIndex]).toBe(originalAnswer);
    });
  });
});
