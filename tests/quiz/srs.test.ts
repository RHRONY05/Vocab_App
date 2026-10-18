import { describe, it, expect } from "vitest";
import {
  applyAnswer,
  applyRepeatLookup,
  BOX_INTERVAL_DAYS,
  getWordStatus,
  WordSrsState,
} from "@/lib/quiz/srs";

describe("SRS State Machine (lib/quiz/srs.ts)", () => {
  const baseTime = new Date("2026-10-19T10:00:00.000Z");

  it("checks intervals and status mappings", () => {
    expect(BOX_INTERVAL_DAYS[0]).toBe(1);
    expect(BOX_INTERVAL_DAYS[1]).toBe(1);
    expect(BOX_INTERVAL_DAYS[2]).toBe(3);
    expect(BOX_INTERVAL_DAYS[3]).toBe(7);
    expect(BOX_INTERVAL_DAYS[4]).toBe(16);
    expect(BOX_INTERVAL_DAYS[5]).toBe(35);

    expect(getWordStatus(0)).toBe("new");
    expect(getWordStatus(1)).toBe("learning");
    expect(getWordStatus(2)).toBe("learning");
    expect(getWordStatus(3)).toBe("learning");
    expect(getWordStatus(4)).toBe("mastered");
    expect(getWordStatus(5)).toBe("mastered");
  });

  describe("Review mode - correct answers", () => {
    it("promotes box 0 -> box 1 (1 day)", () => {
      const word: WordSrsState = {
        box: 0,
        next_review_at: baseTime.toISOString(),
        review_count: 0,
        correct_count: 0,
        wrong_count: 0,
      };
      const result = applyAnswer({
        word,
        mode: "review",
        correct: true,
        now: baseTime,
      });

      expect(result.box).toBe(1);
      expect(result.previousBox).toBe(0);
      expect(result.status).toBe("learning");
      expect(result.review_count).toBe(1);
      expect(result.correct_count).toBe(1);
      expect(result.wrong_count).toBe(0);
      expect(result.promotedToBox3).toBe(false);
      expect(result.promotedToBox5).toBe(false);

      const expectedNext = new Date(baseTime.getTime() + 1 * 24 * 60 * 60 * 1000);
      expect(new Date(result.next_review_at).getTime()).toBe(expectedNext.getTime());
    });

    it("promotes box 1 -> box 2 (3 days)", () => {
      const word: WordSrsState = {
        box: 1,
        next_review_at: baseTime.toISOString(),
        review_count: 1,
        correct_count: 1,
        wrong_count: 0,
      };
      const result = applyAnswer({
        word,
        mode: "review",
        correct: true,
        now: baseTime,
      });

      expect(result.box).toBe(2);
      expect(result.status).toBe("learning");
      const expectedNext = new Date(baseTime.getTime() + 3 * 24 * 60 * 60 * 1000);
      expect(new Date(result.next_review_at).getTime()).toBe(expectedNext.getTime());
    });

    it("promotes box 2 -> box 3 (7 days) and flags promotedToBox3", () => {
      const word: WordSrsState = {
        box: 2,
        next_review_at: baseTime.toISOString(),
        review_count: 2,
        correct_count: 2,
        wrong_count: 0,
      };
      const result = applyAnswer({
        word,
        mode: "review",
        correct: true,
        now: baseTime,
      });

      expect(result.box).toBe(3);
      expect(result.status).toBe("learning");
      expect(result.promotedToBox3).toBe(true);
      const expectedNext = new Date(baseTime.getTime() + 7 * 24 * 60 * 60 * 1000);
      expect(new Date(result.next_review_at).getTime()).toBe(expectedNext.getTime());
    });

    it("promotes box 3 -> box 4 (16 days)", () => {
      const word: WordSrsState = {
        box: 3,
        next_review_at: baseTime.toISOString(),
        review_count: 3,
        correct_count: 3,
        wrong_count: 0,
      };
      const result = applyAnswer({
        word,
        mode: "review",
        correct: true,
        now: baseTime,
      });

      expect(result.box).toBe(4);
      expect(result.status).toBe("mastered");
      const expectedNext = new Date(baseTime.getTime() + 16 * 24 * 60 * 60 * 1000);
      expect(new Date(result.next_review_at).getTime()).toBe(expectedNext.getTime());
    });

    it("promotes box 4 -> box 5 (35 days) and flags promotedToBox5", () => {
      const word: WordSrsState = {
        box: 4,
        next_review_at: baseTime.toISOString(),
        review_count: 4,
        correct_count: 4,
        wrong_count: 0,
      };
      const result = applyAnswer({
        word,
        mode: "review",
        correct: true,
        now: baseTime,
      });

      expect(result.box).toBe(5);
      expect(result.status).toBe("mastered");
      expect(result.promotedToBox5).toBe(true);
      const expectedNext = new Date(baseTime.getTime() + 35 * 24 * 60 * 60 * 1000);
      expect(new Date(result.next_review_at).getTime()).toBe(expectedNext.getTime());
    });

    it("box 5 stays in box 5 on correct answer (resets interval to 35 days)", () => {
      const word: WordSrsState = {
        box: 5,
        next_review_at: baseTime.toISOString(),
        review_count: 10,
        correct_count: 10,
        wrong_count: 0,
      };
      const result = applyAnswer({
        word,
        mode: "review",
        correct: true,
        now: baseTime,
      });

      expect(result.box).toBe(5);
      expect(result.previousBox).toBe(5);
      expect(result.status).toBe("mastered");
      expect(result.promotedToBox5).toBe(false); // was already in box 5
      const expectedNext = new Date(baseTime.getTime() + 35 * 24 * 60 * 60 * 1000);
      expect(new Date(result.next_review_at).getTime()).toBe(expectedNext.getTime());
    });
  });

  describe("Review mode - wrong answers", () => {
    it("demotes any box to box 1 (1 day)", () => {
      for (const startBox of [0, 1, 2, 3, 4, 5]) {
        const word: WordSrsState = {
          box: startBox,
          next_review_at: baseTime.toISOString(),
          review_count: 2,
          correct_count: 2,
          wrong_count: 0,
        };
        const result = applyAnswer({
          word,
          mode: "review",
          correct: false,
          now: baseTime,
        });

        expect(result.box).toBe(1);
        expect(result.status).toBe("learning");
        expect(result.wrong_count).toBe(1);
        const expectedNext = new Date(baseTime.getTime() + 1 * 24 * 60 * 60 * 1000);
        expect(new Date(result.next_review_at).getTime()).toBe(expectedNext.getTime());
      }
    });
  });

  describe("Practice mode", () => {
    it("wrong answer acts like wrong review answer (drops to box 1, due in 1 day)", () => {
      const word: WordSrsState = {
        box: 4,
        next_review_at: new Date(baseTime.getTime() + 10 * 24 * 60 * 60 * 1000).toISOString(),
        review_count: 4,
        correct_count: 4,
        wrong_count: 0,
      };
      const result = applyAnswer({
        word,
        mode: "practice",
        correct: false,
        now: baseTime,
      });

      expect(result.box).toBe(1);
      expect(result.status).toBe("learning");
      expect(result.wrong_count).toBe(1);
      const expectedNext = new Date(baseTime.getTime() + 1 * 24 * 60 * 60 * 1000);
      expect(new Date(result.next_review_at).getTime()).toBe(expectedNext.getTime());
    });

    it("correct answer when DUE acts like review correct (promotes box)", () => {
      const word: WordSrsState = {
        box: 2,
        next_review_at: baseTime.toISOString(), // due now
        review_count: 2,
        correct_count: 2,
        wrong_count: 0,
      };
      const result = applyAnswer({
        word,
        mode: "practice",
        correct: true,
        now: baseTime,
      });

      expect(result.box).toBe(3);
      expect(result.promotedToBox3).toBe(true);
      const expectedNext = new Date(baseTime.getTime() + 7 * 24 * 60 * 60 * 1000);
      expect(new Date(result.next_review_at).getTime()).toBe(expectedNext.getTime());
    });

    it("correct answer when NOT due leaves box and next_review_at unchanged", () => {
      const futureDate = new Date(baseTime.getTime() + 5 * 24 * 60 * 60 * 1000);
      const word: WordSrsState = {
        box: 2,
        next_review_at: futureDate.toISOString(), // due in 5 days
        review_count: 2,
        correct_count: 2,
        wrong_count: 0,
      };
      const result = applyAnswer({
        word,
        mode: "practice",
        correct: true,
        now: baseTime,
      });

      expect(result.box).toBe(2);
      expect(result.review_count).toBe(3);
      expect(result.correct_count).toBe(3);
      expect(result.wrong_count).toBe(0);
      expect(new Date(result.next_review_at).getTime()).toBe(futureDate.getTime());
    });
  });

  describe("Repeat lookup 12-hour rule", () => {
    it("increments lookup_count and resets box > 1 to 1 if > 12 hours have passed", () => {
      const lastLookedUp = new Date(baseTime.getTime() - 13 * 60 * 60 * 1000); // 13h ago
      const nextReview = new Date(baseTime.getTime() + 10 * 24 * 60 * 60 * 1000);

      const word = {
        box: 4,
        lookup_count: 1,
        last_looked_up_at: lastLookedUp.toISOString(),
        next_review_at: nextReview.toISOString(),
      };

      const result = applyRepeatLookup(word, baseTime);
      expect(result.counted).toBe(true);
      expect(result.lookup_count).toBe(2);
      expect(result.box).toBe(1);
      expect(result.status).toBe("learning");
      expect(new Date(result.next_review_at).getTime()).toBe(baseTime.getTime()); // due today
      expect(result.last_looked_up_at).toBe(baseTime.toISOString());
    });

    it("leaves box 0 as 0 and box 1 as 1 if > 12 hours have passed", () => {
      const lastLookedUp = new Date(baseTime.getTime() - 15 * 60 * 60 * 1000);
      const word = {
        box: 0,
        lookup_count: 1,
        last_looked_up_at: lastLookedUp.toISOString(),
        next_review_at: baseTime.toISOString(),
      };

      const result = applyRepeatLookup(word, baseTime);
      expect(result.counted).toBe(true);
      expect(result.lookup_count).toBe(2);
      expect(result.box).toBe(0);
      expect(result.status).toBe("new");
    });

    it("does NOT count or change box/schedule if within 12 hours", () => {
      const lastLookedUp = new Date(baseTime.getTime() - 2 * 60 * 60 * 1000); // 2h ago
      const nextReview = new Date(baseTime.getTime() + 5 * 24 * 60 * 60 * 1000);

      const word = {
        box: 3,
        lookup_count: 2,
        last_looked_up_at: lastLookedUp.toISOString(),
        next_review_at: nextReview.toISOString(),
      };

      const result = applyRepeatLookup(word, baseTime);
      expect(result.counted).toBe(false);
      expect(result.lookup_count).toBe(2);
      expect(result.box).toBe(3);
      expect(result.status).toBe("learning");
      expect(new Date(result.next_review_at).getTime()).toBe(nextReview.getTime());
      expect(result.last_looked_up_at).toBe(baseTime.toISOString());
    });
  });
});
