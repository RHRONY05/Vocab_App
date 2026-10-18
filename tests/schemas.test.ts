import { describe, it, expect } from "vitest";
import { wordCardSchema, lookupRequestSchema } from "@/lib/schemas";

describe("schemas", () => {
  it("validates lookupRequestSchema", () => {
    const valid = lookupRequestSchema.safeParse({ input: "substantive" });
    expect(valid.success).toBe(true);

    const invalid = lookupRequestSchema.safeParse({ input: "" });
    expect(invalid.success).toBe(false);
  });

  it("validates wordCardSchema", () => {
    const validCard = {
      word: "cohesive",
      partOfSpeech: "adjective",
      meaningEn: "Forming a united whole.",
      meaningBn: "সংযুক্ত বা সংহতিপূর্ণ",
      register: "neutral",
      howUsed: "Used to describe things that stick together well.",
      collocations: ["cohesive group", "cohesive unit"],
      patterns: ["be cohesive with"],
      examples: [
        "The team remained cohesive under pressure.",
        "A cohesive essay has clear paragraphs.",
        "We need a cohesive design system.",
        "The modules formed a cohesive architecture.",
      ],
      dontConfuse: [{ word: "coherent", difference: "Coherent means logically clear." }],
      isRealWord: true,
      suggestion: null,
    };
    const parsed = wordCardSchema.safeParse(validCard);
    expect(parsed.success).toBe(true);
  });
});
