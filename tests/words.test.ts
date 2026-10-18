import { describe, it, expect } from "vitest";
import {
  normaliseWord,
  isPotentialWordLookup,
  applyRepeatLookupRule,
} from "@/lib/words";

describe("words utilities", () => {
  describe("normaliseWord", () => {
    it("trims and lowercases input", () => {
      expect(normaliseWord("  Inference  ")).toBe("inference");
      expect(normaliseWord("SUBSTANTIVE")).toBe("substantive");
    });

    it("strips wrapping quotes and brackets", () => {
      expect(normaliseWord('"cohesive"')).toBe("cohesive");
      expect(normaliseWord("“morph”")).toBe("morph");
      expect(normaliseWord("(substantial)")).toBe("substantial");
    });
  });

  describe("isPotentialWordLookup", () => {
    it("returns true for words and short phrases <= 4 words", () => {
      expect(isPotentialWordLookup("inference")).toBe(true);
      expect(isPotentialWordLookup("break the ice")).toBe(true);
      expect(isPotentialWordLookup("fall by the wayside")).toBe(true);
    });

    it("returns false for questions, sentences, or phrases > 4 words", () => {
      expect(isPotentialWordLookup("is it formal?")).toBe(false);
      expect(isPotentialWordLookup("This is a complete sentence.")).toBe(false);
      expect(isPotentialWordLookup("one two three four five")).toBe(false);
      expect(isPotentialWordLookup("")).toBe(false);
    });
  });

  describe("applyRepeatLookupRule", () => {
    it("increments lookup_count and sets box=1 when > 12 hours since last lookup", () => {
      const now = new Date("2026-10-19T14:00:00Z");
      const lastLookedUpAt = new Date("2026-10-18T20:00:00Z"); // 18 hours ago

      const result = applyRepeatLookupRule({
        lookupCount: 1,
        lastLookedUpAt,
        box: 3,
        now,
      });

      expect(result.repeatCounted).toBe(true);
      expect(result.lookupCount).toBe(2);
      expect(result.box).toBe(1);
      expect(result.nextReviewAt).toBe(now.toISOString());
      expect(result.lastLookedUpAt).toBe(now.toISOString());
    });

    it("does not increment lookup_count or reset box when within 12 hours", () => {
      const now = new Date("2026-10-19T14:00:00Z");
      const lastLookedUpAt = new Date("2026-10-19T10:00:00Z"); // 4 hours ago

      const result = applyRepeatLookupRule({
        lookupCount: 2,
        lastLookedUpAt,
        box: 3,
        now,
      });

      expect(result.repeatCounted).toBe(false);
      expect(result.lookupCount).toBe(2);
      expect(result.box).toBe(3);
      expect(result.lastLookedUpAt).toBe(now.toISOString());
      expect(result.nextReviewAt).toBeUndefined();
    });

    it("keeps box 0 or 1 as is if already low", () => {
      const now = new Date("2026-10-19T14:00:00Z");
      const lastLookedUpAt = new Date("2026-10-18T20:00:00Z");

      const result = applyRepeatLookupRule({
        lookupCount: 1,
        lastLookedUpAt,
        box: 0,
        now,
      });

      expect(result.repeatCounted).toBe(true);
      expect(result.box).toBe(0); // box not downgraded from 0 to 1
    });
  });
});
