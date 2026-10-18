import { WordCard, QuizQuestion } from "@/lib/schemas";
import { calculateWeaknessScore, WordScoreState } from "./score";

export const REVIEW_CAP = 15;

export type QuestionKind = "meaning" | "fill_blank" | "usage" | "recall";

export interface FormattedQuizQuestion {
  wordId: string;
  word: string;
  kind: QuestionKind;
  prompt: string;
  options: string[];
  answerIndex: number;
  explanation: string;
  recall?: {
    partOfSpeech: string;
    meaningBn: string;
    example: string;
  };
  isRetry?: false;
}

export interface SelectWordCandidate extends WordScoreState {
  id: string;
  word: string;
  created_at: string | Date;
  card: WordCard;
  quiz?: QuizQuestion[] | null;
  lastAttemptKind?: QuestionKind | null;
}

export function shuffleArray<T>(
  arr: T[],
  rng: () => number = Math.random
): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function getAllowedKindsForBox(box: number): QuestionKind[] {
  if (box <= 1) return ["meaning", "fill_blank"];
  if (box <= 3) return ["fill_blank", "usage"];
  return ["usage", "recall"];
}

export function buildRecallQuestion(
  word: SelectWordCandidate
): FormattedQuizQuestion {
  return {
    wordId: word.id,
    word: word.word,
    kind: "recall",
    prompt: word.word,
    options: [],
    answerIndex: -1,
    explanation: word.card?.meaningEn || "",
    recall: {
      partOfSpeech: word.card?.partOfSpeech || "noun",
      meaningBn: word.card?.meaningBn || "",
      example: word.card?.examples?.[0] || "",
    },
  };
}

export function selectQuestionForWord(
  word: SelectWordCandidate,
  rng: () => number = Math.random
): FormattedQuizQuestion {
  const allowed = getAllowedKindsForBox(word.box);

  // Avoid the kind of the most recent attempt when another is allowed
  let candidateKinds = allowed;
  if (word.lastAttemptKind && allowed.length > 1) {
    const filtered = allowed.filter((k) => k !== word.lastAttemptKind);
    if (filtered.length > 0) {
      candidateKinds = filtered;
    }
  }

  // Pick randomly among the allowed candidate kinds
  const kindIndex = Math.floor(rng() * candidateKinds.length);
  const pickedKind = candidateKinds[kindIndex];

  if (pickedKind === "recall") {
    return buildRecallQuestion(word);
  }

  // Find stored question of that kind
  const quizList = Array.isArray(word.quiz) ? word.quiz : [];
  const stored = quizList.find((q) => q.kind === pickedKind);

  if (!stored) {
    // If the stored quiz has no question of that kind (e.g. generation failed), fall back to recall
    return buildRecallQuestion(word);
  }

  // Shuffle options and update answerIndex
  const originalCorrectAnswer = stored.options[stored.answerIndex];
  const shuffledOptions = shuffleArray(stored.options, rng);
  const newAnswerIndex = shuffledOptions.indexOf(originalCorrectAnswer);

  return {
    wordId: word.id,
    word: word.word,
    kind: pickedKind,
    prompt: stored.prompt,
    options: shuffledOptions,
    answerIndex: newAnswerIndex,
    explanation: stored.explanation,
  };
}

export interface ReviewSelectionResult {
  questions: FormattedQuizQuestion[];
  remainingDue: number;
}

export function selectReviewWords(
  words: SelectWordCandidate[],
  now: Date = new Date(),
  rng: () => number = Math.random
): ReviewSelectionResult {
  const nowMs = now.getTime();

  // Candidates: next_review_at <= now
  const dueWords = words.filter(
    (w) => new Date(w.next_review_at).getTime() <= nowMs
  );

  // Order: weakness, highest first
  const scored = dueWords.map((w) => ({
    word: w,
    weakness: calculateWeaknessScore(w, now),
  }));

  scored.sort((a, b) => {
    if (b.weakness !== a.weakness) {
      return b.weakness - a.weakness;
    }
    // Tie-break: earlier creation date or stable id
    return new Date(b.word.created_at).getTime() - new Date(a.word.created_at).getTime();
  });

  const selected = scored.slice(0, REVIEW_CAP).map((s) => s.word);
  const remainingDue = Math.max(0, dueWords.length - selected.length);

  const questions = selected.map((w) => selectQuestionForWord(w, rng));

  return {
    questions,
    remainingDue,
  };
}

export interface PracticeSelectionParams {
  words: SelectWordCandidate[];
  scope: "week" | "month" | "all" | "weak";
  size: number;
  weekStart?: Date;
  monthStart?: Date;
  now?: Date;
  rng?: () => number;
}

export function selectPracticeWords({
  words,
  scope,
  size,
  weekStart,
  monthStart,
  now = new Date(),
  rng = Math.random,
}: PracticeSelectionParams): { questions: FormattedQuizQuestion[]; remainingDue: number } {
  let candidates: SelectWordCandidate[] = [];

  if (scope === "week") {
    const cutoff = weekStart ? weekStart.getTime() : now.getTime() - 7 * 24 * 60 * 60 * 1000;
    candidates = words.filter((w) => new Date(w.created_at).getTime() >= cutoff);
  } else if (scope === "month") {
    const cutoff = monthStart
      ? monthStart.getTime()
      : new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    candidates = words.filter((w) => new Date(w.created_at).getTime() >= cutoff);
  } else if (scope === "weak") {
    // Top 30 by weakness across all words
    const scored = words.map((w) => ({
      word: w,
      weakness: calculateWeaknessScore(w, now),
    }));
    scored.sort((a, b) => b.weakness - a.weakness);
    candidates = scored.slice(0, 30).map((s) => s.word);
  } else {
    // "all"
    candidates = [...words];
  }

  const targetCount = Math.min(size, candidates.length);
  if (targetCount === 0) {
    return { questions: [], remainingDue: 0 };
  }

  // Weighted random sample WITHOUT replacement using Efraimidis-Spirakis:
  // weight = 1 + weakness; key = u ^ (1 / weight)
  const keyed = candidates.map((w) => {
    const weakness = calculateWeaknessScore(w, now);
    const weight = 1 + weakness;
    const u = Math.max(1e-10, rng());
    const key = Math.pow(u, 1 / weight);
    return { word: w, key };
  });

  // Sort descending by key
  keyed.sort((a, b) => b.key - a.key);

  const selected = keyed.slice(0, targetCount).map((k) => k.word);
  const questions = selected.map((w) => selectQuestionForWord(w, rng));

  return {
    questions,
    remainingDue: 0,
  };
}
