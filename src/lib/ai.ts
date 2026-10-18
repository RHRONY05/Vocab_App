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

export async function lookupWithAi(params: {
  input: string;
  currentWord?: string;
}): Promise<LookupAiResult> {
  const { input, currentWord } = params;

  // 1. Mock path for tests
  if (process.env.AI_MOCK === "1") {
    const normalised = normaliseWord(input);
    const lower = input.toLowerCase();

    if (lower.includes("formal")) {
      return loadFixture<LookupAiResult>("formal_reply.json");
    }
    if (lower.includes("inference from") || lower.includes("a inference")) {
      return loadFixture<LookupAiResult>("sentence_feedback_reply.json");
    }
    if (normalised === "recieve") {
      return loadFixture<LookupAiResult>("typo_recieve.json");
    }
    if (normalised === "substantive") {
      return loadFixture<LookupAiResult>("substantive.json");
    }
    if (normalised === "cohesive") {
      return loadFixture<LookupAiResult>("cohesive.json");
    }
    if (normalised === "inference") {
      return loadFixture<LookupAiResult>("inference.json");
    }
    if (normalised === "morph") {
      return loadFixture<LookupAiResult>("morph.json");
    }

    // Generic fallback mock for other words
    const base = loadFixture<LookupAiResult>("substantive.json");
    if (base.type === "word") {
      return {
        type: "word",
        card: {
          ...base.card,
          word: normalised || "word",
          meaningEn: `The meaning of ${normalised || "this word"}.`,
          examples: [
            `First example sentence with ${normalised || "the word"}.`,
            `Second example sentence with ${normalised || "the word"}.`,
            `Third example sentence with ${normalised || "the word"}.`,
            `Fourth example sentence with ${normalised || "the word"}.`,
          ],
        },
      };
    }
    return base;
  }

  // 2. Real Gemini API call
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new AiError("Missing GEMINI_API_KEY");
  }

  const ai = new GoogleGenAI({ apiKey });
  const userPrompt = buildLookupUserPrompt(input, currentWord);

  const lookupSchema = {
    type: Type.OBJECT,
    properties: {
      type: {
        type: Type.STRING,
        enum: ["word", "reply"],
      },
      card: {
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
      },
      text: { type: Type.STRING },
    },
    required: ["type"],
  };

  const attemptCall = async (): Promise<LookupAiResult> => {
    const response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || env.GEMINI_MODEL,
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

    return validated.data;
  };

  try {
    return await attemptCall();
  } catch (firstErr) {
    console.warn("First Gemini lookup attempt failed, retrying once...", firstErr);
    try {
      return await attemptCall();
    } catch (secondErr) {
      const msg = secondErr instanceof Error ? secondErr.message : String(secondErr);
      console.error("Second Gemini lookup attempt failed:", msg);
      throw new AiError(msg, 502);
    }
  }
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

  const attemptCall = async (): Promise<QuizQuestion[]> => {
    const response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || env.GEMINI_MODEL,
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
  };

  try {
    return await attemptCall();
  } catch (firstErr) {
    console.warn("First Gemini quiz attempt failed, retrying once...", firstErr);
    try {
      return await attemptCall();
    } catch (secondErr) {
      console.error("Second Gemini quiz attempt failed:", secondErr);
      throw new AiError("ai_unavailable", 502);
    }
  }
}
