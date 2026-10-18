import { NextRequest, NextResponse } from "next/server";
import { requireOwner, AuthError } from "@/lib/auth";
import { quizQuerySchema, WordCard, QuizQuestion } from "@/lib/schemas";
import {
  selectReviewWords,
  selectPracticeWords,
  SelectWordCandidate,
  QuestionKind,
} from "@/lib/quiz/select";
import { getWeekRange, getMonthRange } from "@/lib/dates";

export async function GET(req: NextRequest) {
  try {
    const { user, supabase } = await requireOwner();

    const searchParams = req.nextUrl.searchParams;
    const mode = searchParams.get("mode");
    const scope = searchParams.get("scope") || undefined;
    const size = searchParams.get("size") || undefined;

    const parsed = quizQuerySchema.safeParse({ mode, scope, size });
    if (!parsed.success) {
      return NextResponse.json(
        { error: "bad_request", details: parsed.error.issues },
        { status: 400 }
      );
    }

    // Fetch user words
    const { data: wordsData, error: wordsError } = await supabase
      .from("words")
      .select("id, word, box, lookup_count, correct_count, wrong_count, next_review_at, created_at, card, quiz")
      .eq("user_id", user.id);

    if (wordsError) {
      throw wordsError;
    }

    // Fetch recent quiz attempts to get the last attempt kind per word
    const { data: attempts, error: attemptsError } = await supabase
      .from("quiz_attempts")
      .select("word_id, kind, answered_at")
      .eq("user_id", user.id)
      .order("answered_at", { ascending: false });

    if (attemptsError) {
      console.warn("Could not fetch quiz_attempts for kind avoidance:", attemptsError);
    }

    const lastAttemptMap = new Map<string, QuestionKind>();
    if (attempts) {
      for (const att of attempts) {
        if (!lastAttemptMap.has(att.word_id)) {
          lastAttemptMap.set(att.word_id, att.kind as QuestionKind);
        }
      }
    }

    const candidates: SelectWordCandidate[] = (wordsData || []).map((w) => ({
      id: w.id,
      word: w.word,
      box: w.box,
      lookup_count: w.lookup_count,
      correct_count: w.correct_count,
      wrong_count: w.wrong_count,
      next_review_at: w.next_review_at,
      created_at: w.created_at,
      card: w.card as unknown as WordCard,
      quiz: (w.quiz as unknown as QuizQuestion[]) || [],
      lastAttemptKind: lastAttemptMap.get(w.id) || null,
    }));

    const now = new Date();

    if (parsed.data.mode === "review") {
      const reviewResult = selectReviewWords(candidates, now);
      return NextResponse.json({
        questions: reviewResult.questions,
        remainingDue: reviewResult.remainingDue,
      });
    }

    // Practice mode
    const weekRange = getWeekRange(now);
    const monthRange = getMonthRange(now);

    const practiceResult = selectPracticeWords({
      words: candidates,
      scope: parsed.data.scope,
      size: parsed.data.size,
      weekStart: new Date(weekRange.start),
      monthStart: new Date(monthRange.start),
      now,
    });

    return NextResponse.json({
      questions: practiceResult.questions,
      remainingDue: 0,
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    console.error("GET /api/quiz error:", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
