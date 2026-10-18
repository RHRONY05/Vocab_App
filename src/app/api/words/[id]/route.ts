import { NextRequest, NextResponse } from "next/server";
import { requireOwner, AuthError } from "@/lib/auth";
import { WordCard } from "@/lib/schemas";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { supabase } = await requireOwner();
    const { id } = await params;

    const { data: wordRow, error: wordError } = await supabase
      .from("words")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (wordError) {
      throw wordError;
    }

    if (!wordRow) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    // Fetch last 3 attempts for this word
    const { data: attempts, error: attemptsError } = await supabase
      .from("quiz_attempts")
      .select("kind, correct, answered_at")
      .eq("word_id", id)
      .order("answered_at", { ascending: false })
      .limit(3);

    if (attemptsError) {
      throw attemptsError;
    }

    const box = wordRow.box;
    const status: "new" | "learning" | "mastered" =
      box === 0 ? "new" : box >= 4 ? "mastered" : "learning";

    const lastAttempts = (attempts || []).map((a) => ({
      kind: a.kind,
      correct: a.correct,
      answeredAt: a.answered_at,
    }));

    return NextResponse.json({
      id: wordRow.id,
      card: wordRow.card as unknown as WordCard,
      status,
      box: wordRow.box,
      nextReviewAt: wordRow.next_review_at,
      lookupCount: wordRow.lookup_count,
      correctCount: wordRow.correct_count,
      wrongCount: wordRow.wrong_count,
      createdAt: wordRow.created_at,
      lastAttempts,
    });
  } catch (err: unknown) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    console.error("Unhandled error in GET /api/words/[id]:", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { supabase } = await requireOwner();
    const { id } = await params;

    const { error } = await supabase.from("words").delete().eq("id", id);
    if (error) {
      throw error;
    }

    return new NextResponse(null, { status: 204 });
  } catch (err: unknown) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    console.error("Unhandled error in DELETE /api/words/[id]:", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
