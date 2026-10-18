import { describe, it, expect } from "vitest";
import { calculateWeaknessScore } from "@/lib/quiz/score";

describe("Weakness Score Engine (lib/quiz/score.ts)", () => {
  const baseTime = new Date("2026-10-19T10:00:00.000Z");

  it("calculates example 1 from 07-QUIZ-ENGINE §3 ('sustainable' -> 17)", () => {
    // sustainable, box 1, looked up 3 times, wrong 2, correct 1, not overdue
    const word = {
      box: 1,
      lookup_count: 3,
      correct_count: 1,
      wrong_count: 2,
      next_review_at: baseTime.toISOString(), // 0 days overdue
    };

    const score = calculateWeaknessScore(word, baseTime);
    // box: 2 * (5 - 1) = 8
    // lookup: 3 * (3 - 1) = 6
    // attempts: max(0, 2*2 - 1) = 3
    // overdue: 0
    // Total = 17
    expect(score).toBe(17);
  });

  it("calculates example 2 from 07-QUIZ-ENGINE §3 (box 5, lookup 1, never wrong -> 0)", () => {
    const word = {
      box: 5,
      lookup_count: 1,
      correct_count: 5,
      wrong_count: 0,
      next_review_at: new Date(baseTime.getTime() + 10 * 24 * 60 * 60 * 1000).toISOString(),
    };

    const score = calculateWeaknessScore(word, baseTime);
    // box: 2 * (5 - 5) = 0
    // lookup: 3 * (1 - 1) = 0
    // attempts: max(0, 0 - 5) = 0
    // overdue: 0
    // Total = 0
    expect(score).toBe(0);
  });

  it("is never negative even with high correct counts and zero lookups", () => {
    const word = {
      box: 5,
      lookup_count: 0,
      correct_count: 20,
      wrong_count: 0,
      next_review_at: new Date(baseTime.getTime() + 10 * 24 * 60 * 60 * 1000).toISOString(),
    };

    const score = calculateWeaknessScore(word, baseTime);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBe(0);
  });

  it("caps overdue penalty at 10 days (5 points)", () => {
    const due10DaysAgo = new Date(baseTime.getTime() - 10 * 24 * 60 * 60 * 1000);
    const due30DaysAgo = new Date(baseTime.getTime() - 30 * 24 * 60 * 60 * 1000);

    const word10 = {
      box: 5,
      lookup_count: 1,
      correct_count: 0,
      wrong_count: 0,
      next_review_at: due10DaysAgo.toISOString(),
    };
    const word30 = {
      box: 5,
      lookup_count: 1,
      correct_count: 0,
      wrong_count: 0,
      next_review_at: due30DaysAgo.toISOString(),
    };

    const score10 = calculateWeaknessScore(word10, baseTime);
    const score30 = calculateWeaknessScore(word30, baseTime);

    // 0.5 * 10 = 5
    expect(score10).toBe(5);
    expect(score30).toBe(5);
  });
});
