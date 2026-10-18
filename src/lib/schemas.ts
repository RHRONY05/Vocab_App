import { z } from "zod";

export const partOfSpeechSchema = z.enum([
  "noun",
  "verb",
  "adjective",
  "adverb",
  "preposition",
  "conjunction",
  "interjection",
  "pronoun",
  "phrase",
]);
export type PartOfSpeech = z.infer<typeof partOfSpeechSchema>;

export const registerSchema = z.enum(["formal", "neutral", "informal"]);
export type Register = z.infer<typeof registerSchema>;

export const dontConfuseItemSchema = z.object({
  word: z.string(),
  difference: z.string(),
});
export type DontConfuseItem = z.infer<typeof dontConfuseItemSchema>;

export const wordCardSchema = z.object({
  word: z.string().min(1).max(80),
  partOfSpeech: partOfSpeechSchema,
  meaningEn: z.string().min(1),
  meaningBn: z.string().min(1),
  register: registerSchema,
  howUsed: z.string().min(1),
  collocations: z.array(z.string()).min(1),
  patterns: z.array(z.string()).min(1),
  examples: z.array(z.string()).length(4),
  dontConfuse: z.array(dontConfuseItemSchema).default([]),
  isRealWord: z.boolean(),
  suggestion: z.string().nullable().default(null),
});
export type WordCard = z.infer<typeof wordCardSchema>;

export const lookupAiResultSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("word"),
    card: wordCardSchema,
  }),
  z.object({
    type: z.literal("reply"),
    text: z.string().min(1),
  }),
]);
export type LookupAiResult = z.infer<typeof lookupAiResultSchema>;

export const quizQuestionKindSchema = z.enum(["meaning", "fill_blank", "usage"]);
export type QuizQuestionKind = z.infer<typeof quizQuestionKindSchema>;

export const quizQuestionSchema = z.object({
  kind: quizQuestionKindSchema,
  prompt: z.string().min(1),
  options: z.array(z.string()).length(4),
  answerIndex: z.number().int().min(0).max(3),
  explanation: z.string().min(1),
});
export type QuizQuestion = z.infer<typeof quizQuestionSchema>;

export const quizQuestionsArraySchema = z.array(quizQuestionSchema).length(3);

export const lookupRequestSchema = z.object({
  input: z.string().trim().min(1).max(300),
  currentWord: z.string().optional(),
});
export type LookupRequest = z.infer<typeof lookupRequestSchema>;

export const saveWordRequestSchema = z.object({
  card: wordCardSchema,
});
export type SaveWordRequest = z.infer<typeof saveWordRequestSchema>;

export const quizAnswerRequestSchema = z.object({
  wordId: z.string().uuid(),
  kind: z.enum(["meaning", "fill_blank", "usage", "recall"]),
  mode: z.enum(["review", "practice"]),
  correct: z.boolean(),
  isRepeat: z.boolean(),
});
export type QuizAnswerRequest = z.infer<typeof quizAnswerRequestSchema>;
