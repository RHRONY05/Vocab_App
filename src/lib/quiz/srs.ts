import { WordStatus } from "@/lib/schemas";

export const BOX_INTERVAL_DAYS: Record<number, number> = {
  0: 1,
  1: 1,
  2: 3,
  3: 7,
  4: 16,
  5: 35,
};

export function getWordStatus(box: number): WordStatus {
  if (box <= 0) return "new";
  if (box <= 3) return "learning";
  return "mastered";
}

export interface WordSrsState {
  box: number;
  next_review_at: string | Date;
  review_count: number;
  correct_count: number;
  wrong_count: number;
  last_reviewed_at?: string | Date | null;
}

export interface ApplyAnswerParams {
  word: WordSrsState;
  mode: "review" | "practice";
  correct: boolean;
  now?: Date;
}

export interface ApplyAnswerResult {
  box: number;
  previousBox: number;
  status: WordStatus;
  next_review_at: string;
  last_reviewed_at: string;
  review_count: number;
  correct_count: number;
  wrong_count: number;
  promotedToBox3: boolean;
  promotedToBox5: boolean;
}

export function applyAnswer({
  word,
  mode,
  correct,
  now = new Date(),
}: ApplyAnswerParams): ApplyAnswerResult {
  const previousBox = word.box;
  const isDue = new Date(word.next_review_at).getTime() <= now.getTime();

  let nextBox = previousBox;
  let nextReviewAtMs = new Date(word.next_review_at).getTime();

  let correctCount = word.correct_count;
  let wrongCount = word.wrong_count;

  if (correct) {
    correctCount += 1;
    if (mode === "review" || isDue) {
      // Promotion
      nextBox = Math.min(previousBox + 1, 5);
      const intervalDays = BOX_INTERVAL_DAYS[nextBox] ?? 1;
      nextReviewAtMs = now.getTime() + intervalDays * 24 * 60 * 60 * 1000;
    }
    // If practice and not due: box and next_review_at stay unchanged
  } else {
    // Wrong answer in review or practice
    wrongCount += 1;
    nextBox = 1;
    nextReviewAtMs = now.getTime() + 1 * 24 * 60 * 60 * 1000;
  }

  const reviewCount = word.review_count + 1;
  const promotedToBox3 = previousBox < 3 && nextBox === 3;
  const promotedToBox5 = previousBox < 5 && nextBox === 5;

  return {
    box: nextBox,
    previousBox,
    status: getWordStatus(nextBox),
    next_review_at: new Date(nextReviewAtMs).toISOString(),
    last_reviewed_at: now.toISOString(),
    review_count: reviewCount,
    correct_count: correctCount,
    wrong_count: wrongCount,
    promotedToBox3,
    promotedToBox5,
  };
}

export interface WordRepeatLookupState {
  box: number;
  lookup_count: number;
  last_looked_up_at: string | Date;
  next_review_at: string | Date;
}

export interface RepeatLookupResult {
  counted: boolean;
  lookup_count: number;
  last_looked_up_at: string;
  box: number;
  next_review_at: string;
  status: WordStatus;
}

export function applyRepeatLookup(
  word: WordRepeatLookupState,
  now: Date = new Date()
): RepeatLookupResult {
  const lastLookedUp = new Date(word.last_looked_up_at);
  const diffHours = (now.getTime() - lastLookedUp.getTime()) / (1000 * 60 * 60);

  if (diffHours > 12) {
    const nextBox = word.box > 1 ? 1 : word.box;
    return {
      counted: true,
      lookup_count: word.lookup_count + 1,
      last_looked_up_at: now.toISOString(),
      box: nextBox,
      next_review_at: now.toISOString(), // due today
      status: getWordStatus(nextBox),
    };
  }

  return {
    counted: false,
    lookup_count: word.lookup_count,
    last_looked_up_at: now.toISOString(),
    box: word.box,
    next_review_at: new Date(word.next_review_at).toISOString(),
    status: getWordStatus(word.box),
  };
}
