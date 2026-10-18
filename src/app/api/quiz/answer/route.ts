import { NextRequest, NextResponse, after } from "next/server";
import { requireOwner, AuthError } from "@/lib/auth";
import { quizAnswerRequestSchema, WordCard, QuizQuestion } from "@/lib/schemas";
import { applyAnswer, getWordStatus } from "@/lib/quiz/srs";
import { generateQuizWithAi } from "@/lib/ai";
import { Json } from "@/types/database";

export async function POST(req: NextRequest) {
  try {
    const { user, supabase } = await requireOwner();

    const body = await req.json().catch(() => null);
    const parsed = quizAnswerRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "bad_request", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { wordId, kind, mode, correct, isRepeat } = parsed.data;

    // Fetch the word
    const { data: word, error: selectError } = await supabase
      .from("words")
      .select("*")
      .eq("id", wordId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (selectError) {
      throw selectError;
    }

    if (!word) {
      return NextResponse.json({ error: "word_not_found" }, { status: 404 });
    }

    // If isRepeat: true (end-of-session retry) -> insert nothing, change nothing, return current state
    if (isRepeat) {
      return NextResponse.json({
        box: word.box,
        previousBox: word.box,
        status: getWordStatus(word.box),
        nextReviewAt: word.next_review_at,
      });
    }

    const now = new Date();
    const srsResult = applyAnswer({
      word: {
        box: word.box,
        next_review_at: word.next_review_at,
        review_count: word.review_count,
        correct_count: word.correct_count,
        wrong_count: word.wrong_count,
      },
      mode,
      correct,
      now,
    });

    // Update word row
    const { error: updateError } = await supabase
      .from("words")
      .update({
        box: srsResult.box,
        next_review_at: srsResult.next_review_at,
        last_reviewed_at: srsResult.last_reviewed_at,
        review_count: srsResult.review_count,
        correct_count: srsResult.correct_count,
        wrong_count: srsResult.wrong_count,
      })
      .eq("id", word.id);

    if (updateError) {
      throw updateError;
    }

    // Insert quiz_attempts row
    const { error: attemptError } = await supabase.from("quiz_attempts").insert({
      user_id: user.id,
      word_id: word.id,
      kind,
      mode,
      correct,
      answered_at: srsResult.last_reviewed_at,
    });

    if (attemptError) {
      console.warn("Failed to record quiz attempt:", attemptError);
    }

    // Schedule background quiz regeneration if promoted into box 3 or box 5
    if (srsResult.promotedToBox3 || srsResult.promotedToBox5) {
      after(async () => {
        try {
          const avoidPrompts = Array.isArray(word.quiz)
            ? (word.quiz as unknown as QuizQuestion[]).map((q) => q.prompt)
            : [];
          const newQuiz = await generateQuizWithAi(
            word.card as unknown as WordCard,
            avoidPrompts
          );
          if (newQuiz && newQuiz.length > 0) {
            await supabase
              .from("words")
              .update({
                quiz: newQuiz as unknown as Json,
                quiz_generated_at: new Date().toISOString(),
              })
              .eq("id", word.id);
          }
        } catch (genErr) {
          console.warn(
            "Background quiz regeneration failed for word:",
            word.id,
            genErr
          );
        }
      });
    }

    return NextResponse.json({
      box: srsResult.box,
      previousBox: srsResult.previousBox,
      status: srsResult.status,
      nextReviewAt: srsResult.next_review_at,
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    console.error("POST /api/quiz/answer error:", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
