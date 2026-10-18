import { NextRequest, NextResponse } from "next/server";
import { requireOwner, AuthError } from "@/lib/auth";
import { lookupRequestSchema, WordCard } from "@/lib/schemas";
import {
  normaliseWord,
  isPotentialWordLookup,
  applyRepeatLookupRule,
} from "@/lib/words";
import { lookupWithAi, AiError } from "@/lib/ai";

export async function POST(req: NextRequest) {
  try {
    const { supabase } = await requireOwner();

    const body = await req.json().catch(() => null);
    const parsed = lookupRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "bad_request", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { input, currentWord } = parsed.data;

    // Flow 1: Quick check for existing saved word if input looks like a single word or short phrase
    if (isPotentialWordLookup(input)) {
      const targetWord = normaliseWord(input);
      const { data: existingWord, error: dbError } = await supabase
        .from("words")
        .select("*")
        .eq("word", targetWord)
        .maybeSingle();

      if (!dbError && existingWord) {
        const rule = applyRepeatLookupRule({
          lookupCount: existingWord.lookup_count,
          lastLookedUpAt: existingWord.last_looked_up_at,
          box: existingWord.box,
        });

        const updatePayload: {
          lookup_count: number;
          last_looked_up_at: string;
          box: number;
          next_review_at?: string;
        } = {
          lookup_count: rule.lookupCount,
          last_looked_up_at: rule.lastLookedUpAt,
          box: rule.box,
        };
        if (rule.nextReviewAt) {
          updatePayload.next_review_at = rule.nextReviewAt;
        }

        await supabase
          .from("words")
          .update(updatePayload)
          .eq("id", existingWord.id);

        return NextResponse.json({
          type: "word",
          card: existingWord.card as unknown as WordCard,
          source: "saved",
          saved: {
            id: existingWord.id,
            lookupCount: rule.lookupCount,
            box: rule.box,
            createdAt: existingWord.created_at,
          },
          repeatCounted: rule.repeatCounted,
        });
      }
    }

    // Flow 2: Call Gemini AI
    const aiResult = await lookupWithAi({ input, currentWord });

    // If reply (follow-up or sentence feedback)
    if (aiResult.type === "reply") {
      return NextResponse.json({
        type: "reply",
        text: aiResult.text,
      });
    }

    // Flow 3: AI returned a word card. Check if this card's headword was already saved
    const normalizedAiWord = normaliseWord(aiResult.card.word);
    const { data: matchedSavedWord } = await supabase
      .from("words")
      .select("*")
      .eq("word", normalizedAiWord)
      .maybeSingle();

    if (matchedSavedWord) {
      const rule = applyRepeatLookupRule({
        lookupCount: matchedSavedWord.lookup_count,
        lastLookedUpAt: matchedSavedWord.last_looked_up_at,
        box: matchedSavedWord.box,
      });

      const updatePayload: {
        lookup_count: number;
        last_looked_up_at: string;
        box: number;
        next_review_at?: string;
      } = {
        lookup_count: rule.lookupCount,
        last_looked_up_at: rule.lastLookedUpAt,
        box: rule.box,
      };
      if (rule.nextReviewAt) {
        updatePayload.next_review_at = rule.nextReviewAt;
      }

      await supabase
        .from("words")
        .update(updatePayload)
        .eq("id", matchedSavedWord.id);

      return NextResponse.json({
        type: "word",
        card: matchedSavedWord.card as unknown as WordCard,
        source: "saved",
        saved: {
          id: matchedSavedWord.id,
          lookupCount: rule.lookupCount,
          box: rule.box,
          createdAt: matchedSavedWord.created_at,
        },
        repeatCounted: rule.repeatCounted,
      });
    }

    // New word looked up
    return NextResponse.json({
      type: "word",
      card: aiResult.card,
      source: "ai",
      saved: null,
      repeatCounted: false,
    });
  } catch (err: unknown) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    if (err instanceof AiError) {
      return NextResponse.json(
        { error: "ai_unavailable", detail: err.message },
        { status: 502 }
      );
    }
    console.error("Unhandled error in /api/lookup:", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
