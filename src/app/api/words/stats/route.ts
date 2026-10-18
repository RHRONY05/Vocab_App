import { NextResponse } from "next/server";
import { requireOwner, AuthError } from "@/lib/auth";
import { getTodayRange, getStartOfDay } from "@/lib/dates";

export async function GET() {
  try {
    const { supabase } = await requireOwner();
    const todayStart = getTodayRange().start;

    // Fetch all user words to compute exact aggregate statistics in memory
    const { data: words, error: wordsError } = await supabase
      .from("words")
      .select("id, word, box, next_review_at, lookup_count, wrong_count, correct_count, created_at");

    if (wordsError) {
      throw wordsError;
    }

    // Fetch reviewed count today from quiz_attempts
    const { count: reviewedTodayCount, error: attemptsError } = await supabase
      .from("quiz_attempts")
      .select("*", { count: "exact", head: true })
      .gte("answered_at", todayStart);

    if (attemptsError) {
      throw attemptsError;
    }

    const allWords = words || [];
    const total = allWords.length;
    let newCount = 0;
    let learningCount = 0;
    let masteredCount = 0;
    let savedToday = 0;
    const dueWords: typeof allWords = [];
    const futureWords: typeof allWords = [];

    const nowTime = Date.now();

    for (const w of allWords) {
      if (w.box === 0) {
        newCount++;
      } else if (w.box >= 1 && w.box <= 3) {
        learningCount++;
      } else if (w.box >= 4) {
        masteredCount++;
      }

      if (new Date(w.created_at).getTime() >= new Date(todayStart).getTime()) {
        savedToday++;
      }

      const nextReviewTime = new Date(w.next_review_at).getTime();
      if (nextReviewTime <= nowTime) {
        dueWords.push(w);
      } else {
        futureWords.push(w);
      }
    }

    const dueNow = dueWords.length;

    // Compute weakness score for duePreview:
    // weakness = 2 * (5 - box) + 3 * (lookup_count - 1) + max(0, 2*wrong - correct)
    dueWords.sort((a, b) => {
      const scoreA =
        2 * (5 - a.box) +
        3 * (a.lookup_count - 1) +
        Math.max(0, 2 * a.wrong_count - a.correct_count);
      const scoreB =
        2 * (5 - b.box) +
        3 * (b.lookup_count - 1) +
        Math.max(0, 2 * b.wrong_count - b.correct_count);

      return scoreB - scoreA; // Weakest first
    });

    const duePreview = dueWords.slice(0, 4).map((w) => ({
      id: w.id,
      word: w.word,
      lookupCount: w.lookup_count,
    }));

    // nextDue only when dueNow === 0
    let nextDue: null | { at: string; count: number } = null;
    if (dueNow === 0 && futureWords.length > 0) {
      futureWords.sort(
        (a, b) =>
          new Date(a.next_review_at).getTime() -
          new Date(b.next_review_at).getTime()
      );
      const earliest = futureWords[0];
      const earliestDate = new Date(earliest.next_review_at);
      const earliestDayStart = getStartOfDay(earliestDate).getTime();
      const earliestDayEnd = earliestDayStart + 24 * 60 * 60 * 1000;

      const wordsOnEarliestDay = futureWords.filter((w) => {
        const t = new Date(w.next_review_at).getTime();
        return t >= earliestDayStart && t < earliestDayEnd;
      });

      nextDue = {
        at: earliest.next_review_at,
        count: wordsOnEarliestDay.length,
      };
    }

    return NextResponse.json({
      total,
      new: newCount,
      learning: learningCount,
      mastered: masteredCount,
      dueNow,
      reviewedToday: reviewedTodayCount ?? 0,
      savedToday,
      duePreview,
      nextDue,
    });
  } catch (err: unknown) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    console.error("Unhandled error in GET /api/words/stats:", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
