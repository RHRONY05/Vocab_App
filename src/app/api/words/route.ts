import { NextRequest, NextResponse } from "next/server";
import { requireOwner, AuthError } from "@/lib/auth";
import { saveWordRequestSchema, WordCard } from "@/lib/schemas";
import { normaliseWord } from "@/lib/words";
import { generateQuizWithAi } from "@/lib/ai";
import { getTodayRange, getWeekRange, getMonthRange } from "@/lib/dates";
import { Json } from "@/types/database";

export async function POST(req: NextRequest) {
  try {
    const { user, supabase } = await requireOwner();

    const body = await req.json().catch(() => null);
    const parsed = saveWordRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "bad_request", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { card } = parsed.data;
    if (!card.isRealWord) {
      return NextResponse.json(
        { error: "bad_request", message: "Cannot save a non-word" },
        { status: 400 }
      );
    }

    // Try quiz generation
    let quiz: unknown[] = [];
    let quizReady = false;
    try {
      quiz = await generateQuizWithAi(card);
      quizReady = Array.isArray(quiz) && quiz.length > 0;
    } catch (err) {
      console.warn("Quiz generation failed on save, saving with quiz = []:", err);
      quiz = [];
      quizReady = false;
    }

    const normalised = normaliseWord(card.word);

    // Check if word already exists for this user
    const { data: existing, error: selectError } = await supabase
      .from("words")
      .select("id, quiz")
      .eq("word", normalised)
      .maybeSingle();

    if (selectError) {
      throw selectError;
    }

    const now = new Date().toISOString();

    if (existing) {
      // Update existing word
      const finalQuiz = quiz.length > 0 ? quiz : (existing.quiz || []);
      const { error: updateError } = await supabase
        .from("words")
        .update({
          card: card as unknown as Json,
          quiz: finalQuiz as unknown as Json,
          updated_at: now,
        })
        .eq("id", existing.id);

      if (updateError) {
        throw updateError;
      }

      return NextResponse.json({
        id: existing.id,
        status: "updated",
        quizReady: (finalQuiz as unknown[]).length > 0,
      });
    }

    // Insert new word
    const nextReview = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const { data: inserted, error: insertError } = await supabase
      .from("words")
      .insert({
        user_id: user.id,
        word: normalised,
        card: card as unknown as Json,
        quiz: quiz as unknown as Json,
        box: 0,
        next_review_at: nextReview,
        lookup_count: 1,
        last_looked_up_at: now,
      })
      .select("id")
      .single();

    if (insertError) {
      throw insertError;
    }

    return NextResponse.json(
      {
        id: inserted.id,
        status: "created",
        quizReady,
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    console.error("Unhandled error in POST /api/words:", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { supabase } = await requireOwner();

    const { searchParams } = new URL(req.url);
    const range = searchParams.get("range") || "week";
    const q = (searchParams.get("q") || "").trim();
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limitRaw = searchParams.get("limit");
    const pageSize = limitRaw ? Math.max(1, Math.min(parseInt(limitRaw, 10) || 10, 100)) : 10;

    const todayStart = getTodayRange().start;
    const weekStart = getWeekRange().start;
    const monthStart = getMonthRange().start;

    // Fetch tab counts in parallel
    const [allCountRes, todayCountRes, weekCountRes, monthCountRes] =
      await Promise.all([
        supabase.from("words").select("*", { count: "exact", head: true }),
        supabase
          .from("words")
          .select("*", { count: "exact", head: true })
          .gte("created_at", todayStart),
        supabase
          .from("words")
          .select("*", { count: "exact", head: true })
          .gte("created_at", weekStart),
        supabase
          .from("words")
          .select("*", { count: "exact", head: true })
          .gte("created_at", monthStart),
      ]);

    const counts = {
      all: allCountRes.count ?? 0,
      today: todayCountRes.count ?? 0,
      week: weekCountRes.count ?? 0,
      month: monthCountRes.count ?? 0,
    };

    // Filter words query
    let query = supabase.from("words").select("*", { count: "exact" });

    if (range === "today") {
      query = query.gte("created_at", todayStart);
    } else if (range === "week") {
      query = query.gte("created_at", weekStart);
    } else if (range === "month") {
      query = query.gte("created_at", monthStart);
    }

    if (q) {
      query = query.ilike("word", `%${q}%`);
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    query = query.order("created_at", { ascending: false }).range(from, to);

    const { data: rows, count: totalFiltered, error } = await query;
    if (error) {
      throw error;
    }

    const words = (rows || []).map((row) => {
      const card = row.card as unknown as WordCard;
      const box = row.box;
      const status: "new" | "learning" | "mastered" =
        box === 0 ? "new" : box >= 4 ? "mastered" : "learning";

      return {
        id: row.id,
        word: row.word,
        partOfSpeech: card.partOfSpeech,
        meaningEn: card.meaningEn,
        status,
        lookupCount: row.lookup_count,
        createdAt: row.created_at,
      };
    });

    const hasMore = (totalFiltered ?? 0) > page * pageSize;

    return NextResponse.json({
      words,
      counts,
      hasMore,
    });
  } catch (err: unknown) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    console.error("Unhandled error in GET /api/words:", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
