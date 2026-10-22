import * as fs from "fs";
import * as path from "path";
import { GoogleGenAI, Type } from "@google/genai";
import { env } from "./env";
import {
  LookupAiResult,
  lookupAiResultSchema,
  QuizQuestion,
  quizQuestionsArraySchema,
  WordCard,
} from "./schemas";
import {
  LOOKUP_SYSTEM_PROMPT,
  buildLookupUserPrompt,
  QUIZ_SYSTEM_PROMPT,
  buildQuizUserPrompt,
} from "./prompts";
import { normaliseWord } from "./words";

export class AiError extends Error {
  constructor(message = "ai_unavailable", public status = 502) {
    super(message);
    this.name = "AiError";
  }
}

function loadFixture<T>(filename: string): T {
  const filePath = path.resolve(process.cwd(), "tests/fixtures/ai", filename);
  const content = fs.readFileSync(filePath, "utf8");
  return JSON.parse(content) as T;
}

async function callGeminiWithRetry<T>(
  actionName: string,
  fn: (model: string) => Promise<T>
): Promise<T> {
  const primaryModel = process.env.GEMINI_MODEL || env.GEMINI_MODEL || "gemini-3.5-flash";
  const candidateModels = [
    primaryModel,
    "gemini-3.5-flash",
    "gemini-flash-latest",
    "gemini-3.8-flash",
  ];
  const modelsToTry = Array.from(new Set(candidateModels));

  let lastError: unknown = null;
  const maxRetriesPerModel = 3;

  for (const model of modelsToTry) {
    for (let attempt = 1; attempt <= maxRetriesPerModel; attempt++) {
      try {
        return await fn(model);
      } catch (err) {
        lastError = err;
        const status = (err as { status?: number })?.status;
        const msg = err instanceof Error ? err.message : String(err);
        const isTransient =
          status === 503 ||
          status === 429 ||
          status === 500 ||
          status === 504 ||
          msg.includes("503") ||
          msg.includes("429") ||
          msg.includes("high demand") ||
          msg.includes("UNAVAILABLE") ||
          msg.includes("RESOURCE_EXHAUSTED") ||
          msg.includes("overloaded");

        console.warn(
          `[Gemini ${actionName}] Attempt ${attempt}/${maxRetriesPerModel} with ${model} failed (status: ${status || "unknown"}): ${msg}`
        );

        if (!isTransient && status && status < 500 && status !== 429) {
          // If 400 Bad Request or 401 or 404, don't retry same model
          break;
        }

        if (attempt < maxRetriesPerModel) {
          // Wait with exponential backoff + jitter before retrying
          const delay = Math.min(1000 * Math.pow(2, attempt - 1) + Math.random() * 300, 3500);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }
  }

  const finalMsg = lastError instanceof Error ? lastError.message : String(lastError);
  console.error(`[Gemini ${actionName}] All retries failed:`, finalMsg);
  throw new AiError(finalMsg, 502);
}

export type LookupAiWordResult = {
  type: "word";
  card: WordCard;
  cards: WordCard[];
};

export type LookupAiReplyResult = {
  type: "reply";
  text: string;
};

export type LookupAiResultNormalized = LookupAiWordResult | LookupAiReplyResult;

export async function lookupWithAi(params: {
  input: string;
  currentWord?: string;
}): Promise<LookupAiResultNormalized> {
  const { input, currentWord } = params;

  function normalizeResult(raw: LookupAiResult): LookupAiResultNormalized {
    if (raw.type === "word") {
      const cards =
        raw.cards && raw.cards.length > 0
          ? raw.cards
          : raw.card
          ? [raw.card]
          : [];
      return {
        type: "word",
        card: cards[0],
        cards,
      };
    }
    return {
      type: "reply",
      text: raw.text,
    };
  }

  // 1. Mock path for tests
  if (process.env.AI_MOCK === "1") {
    const normalised = normaliseWord(input);
    const lower = input.toLowerCase();

    if (lower.includes("formal")) {
      return normalizeResult(loadFixture<LookupAiResult>("formal_reply.json"));
    }
    if (lower.includes("inference from") || lower.includes("a inference")) {
      return normalizeResult(loadFixture<LookupAiResult>("sentence_feedback_reply.json"));
    }
    if (normalised === "recieve") {
      return normalizeResult(loadFixture<LookupAiResult>("typo_recieve.json"));
    }
    if (normalised === "substantive") {
      return normalizeResult(loadFixture<LookupAiResult>("substantive.json"));
    }
    if (normalised === "cohesive") {
      return normalizeResult(loadFixture<LookupAiResult>("cohesive.json"));
    }
    if (normalised === "inference") {
      return normalizeResult(loadFixture<LookupAiResult>("inference.json"));
    }
    if (normalised === "morph") {
      return normalizeResult(loadFixture<LookupAiResult>("morph.json"));
    }

    // Generic fallback mock for other words
    const base = loadFixture<LookupAiResult>("substantive.json");
    if (base.type === "word" && base.card) {
      const card = {
        ...base.card,
        word: normalised || "word",
        meaningEn: `The meaning of ${normalised || "this word"}.`,
        examples: [
          `First example sentence with ${normalised || "the word"}.`,
          `Second example sentence with ${normalised || "the word"}.`,
          `Third example sentence with ${normalised || "the word"}.`,
          `Fourth example sentence with ${normalised || "the word"}.`,
        ],
      };
      return {
        type: "word",
        card,
        cards: [card],
      };
    }
    return normalizeResult(base);
  }

  // 2. Real Gemini API call with 3 retries & model fallback
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new AiError("Missing GEMINI_API_KEY");
  }

  const ai = new GoogleGenAI({ apiKey });
  const userPrompt = buildLookupUserPrompt(input, currentWord);

  const singleCardSchema = {
    type: Type.OBJECT,
    properties: {
      word: { type: Type.STRING },
      partOfSpeech: {
        type: Type.STRING,
        enum: [
          "noun",
          "verb",
          "adjective",
          "adverb",
          "preposition",
          "conjunction",
          "interjection",
          "pronoun",
          "phrase",
        ],
      },
      meaningEn: { type: Type.STRING },
      meaningBn: { type: Type.STRING },
      register: {
        type: Type.STRING,
        enum: ["formal", "neutral", "informal"],
      },
      howUsed: { type: Type.STRING },
      collocations: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
      },
      patterns: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
      },
      examples: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
      },
      dontConfuse: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            word: { type: Type.STRING },
            difference: { type: Type.STRING },
          },
          required: ["word", "difference"],
        },
      },
      isRealWord: { type: Type.BOOLEAN },
      suggestion: { type: Type.STRING, nullable: true },
    },
    required: [
      "word",
      "partOfSpeech",
      "meaningEn",
      "meaningBn",
      "register",
      "howUsed",
      "collocations",
      "patterns",
      "examples",
      "isRealWord",
    ],
  };

  const lookupSchema = {
    type: Type.OBJECT,
    properties: {
      type: {
        type: Type.STRING,
        enum: ["word", "reply"],
      },
      card: singleCardSchema,
      cards: {
        type: Type.ARRAY,
        items: singleCardSchema,
      },
      text: { type: Type.STRING },
    },
    required: ["type"],
  };

  return await callGeminiWithRetry("lookup", async (model) => {
    const response = await ai.models.generateContent({
      model,
      contents: userPrompt,
      config: {
        systemInstruction: LOOKUP_SYSTEM_PROMPT,
        responseMimeType: "application/json",
        responseSchema: lookupSchema,
      },
    });

    const rawText = response.text;
    if (!rawText) {
      throw new Error("Empty response from Gemini");
    }

    const parsedJson = JSON.parse(rawText);
    const validated = lookupAiResultSchema.safeParse(parsedJson);
    if (!validated.success) {
      throw new Error(`Schema validation failed: ${validated.error.message}`);
    }

    const result = validated.data;
    if (result.type === "word") {
      let cards: WordCard[] = [];
      if (result.cards && result.cards.length > 0) {
        cards = result.cards;
      } else if (result.card) {
        cards = [result.card];
      }
      if (cards.length === 0) {
        throw new Error("Gemini returned word type without card or cards");
      }
      return {
        type: "word",
        card: cards[0],
        cards,
      };
    }

    return {
      type: "reply",
      text: result.text,
    };
  });
}

export async function generateQuizWithAi(
  card: WordCard,
  avoidPrompts: string[] = []
): Promise<QuizQuestion[]> {
  if (process.env.AI_MOCK === "1") {
    return loadFixture<QuizQuestion[]>("quiz_questions.json");
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new AiError("Missing GEMINI_API_KEY");
  }

  const ai = new GoogleGenAI({ apiKey });
  const userPrompt = buildQuizUserPrompt(card, avoidPrompts);

  const quizSchema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        kind: {
          type: Type.STRING,
          enum: ["meaning", "fill_blank", "usage"],
        },
        prompt: { type: Type.STRING },
        options: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
        answerIndex: { type: Type.INTEGER },
        explanation: { type: Type.STRING },
      },
      required: ["kind", "prompt", "options", "answerIndex", "explanation"],
    },
  };

  return await callGeminiWithRetry("quiz", async (model) => {
    const response = await ai.models.generateContent({
      model,
      contents: userPrompt,
      config: {
        systemInstruction: QUIZ_SYSTEM_PROMPT,
        responseMimeType: "application/json",
        responseSchema: quizSchema,
      },
    });

    const rawText = response.text;
    if (!rawText) {
      throw new Error("Empty response from Gemini");
    }

    const parsedJson = JSON.parse(rawText);
    const validated = quizQuestionsArraySchema.safeParse(parsedJson);
    if (!validated.success) {
      throw new Error(`Schema validation failed: ${validated.error.message}`);
    }

    return validated.data;
  });
}
