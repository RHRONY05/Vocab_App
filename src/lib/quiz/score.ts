export interface WordScoreState {
  box: number;
  lookup_count: number;
  correct_count: number;
  wrong_count: number;
  next_review_at: string | Date;
}

export function calculateWeaknessScore(
  word: WordScoreState,
  now: Date = new Date()
): number {
  // 1. Box term: new / low-box words are weaker (0..10)
  const clampedBox = Math.max(0, Math.min(5, word.box));
  const boxTerm = 2 * (5 - clampedBox);

  // 2. Lookup term: each repeat lookup = forgot it
  const lookupTerm = 3 * Math.max(0, word.lookup_count - 1);

  // 3. Attempt term: wrong answers weigh more than correct answers
  const attemptTerm = Math.max(0, 2 * word.wrong_count - word.correct_count);

  // 4. Overdue term: 0.5 per day overdue up to 10 days; 0 when not due
  const nextReviewMs = new Date(word.next_review_at).getTime();
  const diffMs = now.getTime() - nextReviewMs;
  const daysOverdue = diffMs > 0 ? diffMs / (24 * 60 * 60 * 1000) : 0;
  const overdueTerm = 0.5 * Math.min(daysOverdue, 10);

  const score = boxTerm + lookupTerm + attemptTerm + overdueTerm;
  return Math.max(0, score);
}
