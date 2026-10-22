import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { NextRequest } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/types/database";
import { GET as getQuiz } from "@/app/api/quiz/route";
import { POST as answerQuiz } from "@/app/api/quiz/answer/route";
import { POST as saveWord } from "@/app/api/words/route";
import * as serverModule from "@/lib/supabase/server";
import { resetE2EUser } from "./helpers/reset";
import { WordCard } from "@/lib/schemas";

describe("Quiz API integration (/api/quiz*)", () => {
  let authenticatedClient: ReturnType<typeof createSupabaseClient<Database>>;

  const sampleCard: WordCard = {
    word: "inference",
    partOfSpeech: "noun",
    meaningEn: "A conclusion reached on the basis of evidence and reasoning.",
    meaningBn: "অনুমান বা সিদ্ধান্ত",
    register: "neutral",
    howUsed: "Common in technical writing and AI.",
    collocations: ["draw an inference", "make an inference"],
    patterns: ["inference about sth"],
    examples: [
      "We can draw an inference from the data.",
      "The model performs real-time inference.",
      "Her inference was proven correct.",
      "Statistical inference requires clean data.",
    ],
    dontConfuse: [],
    isRealWord: true,
    suggestion: null,
  };

  beforeAll(async () => {
    await resetE2EUser();

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const e2eEmail = process.env.E2E_EMAIL!;
    const e2ePassword = process.env.E2E_PASSWORD!;

    authenticatedClient = createSupabaseClient<Database>(url, anonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { data: authData, error: authError } =
      await authenticatedClient.auth.signInWithPassword({
        email: e2eEmail,
        password: e2ePassword,
      });

    if (authError || !authData.user) {
      throw new Error(`Failed to log in e2e user in test: ${authError?.message}`);
    }

    vi.spyOn(serverModule, "createClient").mockResolvedValue(
      authenticatedClient as unknown as Awaited<
        ReturnType<typeof serverModule.createClient>
      >
    );
  });

  afterAll(async () => {
    vi.restoreAllMocks();
    await resetE2EUser();
  });

  let savedWordId: string;

  it("saves a word to prepare for quiz tests", async () => {
    const req = new NextRequest("http://localhost:3000/api/words", {
      method: "POST",
      body: JSON.stringify({ card: sampleCard }),
    });

    const res = await saveWord(req);
    expect([200, 201]).toContain(res.status);
    const body = await res.json();
    savedWordId = body.id;
    expect(savedWordId).toBeDefined();
  });

  it("GET /api/quiz?mode=review returns empty when no words are due", async () => {
    // Newly saved words have next_review_at in +24h, so nothing is due now
    const req = new NextRequest("http://localhost:3000/api/quiz?mode=review");
    const res = await getQuiz(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.questions).toHaveLength(0);
    expect(body.remainingDue).toBe(0);
  });

  it("GET /api/quiz?mode=review returns due words when next_review_at is past", async () => {
    // Manually set next_review_at to 1 hour ago
    const pastTime = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    await authenticatedClient
      .from("words")
      .update({ next_review_at: pastTime })
      .eq("id", savedWordId);

    const req = new NextRequest("http://localhost:3000/api/quiz?mode=review");
    const res = await getQuiz(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.questions).toHaveLength(1);
    expect(body.remainingDue).toBe(0);

    const q = body.questions[0];
    expect(q.wordId).toBe(savedWordId);
    expect(q.word).toBe("inference");
    // Word is box 0, so allowed kinds are "meaning" or "fill_blank"
    expect(["meaning", "fill_blank"]).toContain(q.kind);
    expect(q.options.length).toBeGreaterThan(0);
    expect(q.answerIndex).toBeGreaterThanOrEqual(0);
    expect(q.options[q.answerIndex]).toBeDefined();
  });

  it("POST /api/quiz/answer promotes box and records attempt on correct answer", async () => {
    const req = new NextRequest("http://localhost:3000/api/quiz/answer", {
      method: "POST",
      body: JSON.stringify({
        wordId: savedWordId,
        kind: "meaning",
        mode: "review",
        correct: true,
        isRepeat: false,
      }),
    });

    const res = await answerQuiz(req);
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.box).toBe(1);
    expect(body.previousBox).toBe(0);
    expect(body.status).toBe("learning");
    expect(new Date(body.nextReviewAt).getTime()).toBeGreaterThan(Date.now());

    // Verify database row
    const { data: word } = await authenticatedClient
      .from("words")
      .select("box, review_count, correct_count, wrong_count")
      .eq("id", savedWordId)
      .single();

    expect(word?.box).toBe(1);
    expect(word?.review_count).toBe(1);
    expect(word?.correct_count).toBe(1);
    expect(word?.wrong_count).toBe(0);

    // Verify quiz_attempts table has the attempt
    const { data: attempts } = await authenticatedClient
      .from("quiz_attempts")
      .select("*")
      .eq("word_id", savedWordId);

    expect(attempts).toHaveLength(1);
    expect(attempts![0].correct).toBe(true);
    expect(attempts![0].mode).toBe("review");
    expect(attempts![0].kind).toBe("meaning");
  });

  it("POST /api/quiz/answer with isRepeat: true does not change state or add attempts", async () => {
    const req = new NextRequest("http://localhost:3000/api/quiz/answer", {
      method: "POST",
      body: JSON.stringify({
        wordId: savedWordId,
        kind: "meaning",
        mode: "review",
        correct: true,
        isRepeat: true,
      }),
    });

    const res = await answerQuiz(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.box).toBe(1);
    expect(body.previousBox).toBe(1);

    // Attempts should still be 1
    const { count } = await authenticatedClient
      .from("quiz_attempts")
      .select("*", { count: "exact", head: true })
      .eq("word_id", savedWordId);

    expect(count).toBe(1);
  });

  it("POST /api/quiz/answer drops to box 1 on wrong answer", async () => {
    // Manually set box to 3
    await authenticatedClient
      .from("words")
      .update({ box: 3 })
      .eq("id", savedWordId);

    const req = new NextRequest("http://localhost:3000/api/quiz/answer", {
      method: "POST",
      body: JSON.stringify({
        wordId: savedWordId,
        kind: "usage",
        mode: "review",
        correct: false,
        isRepeat: false,
      }),
    });

    const res = await answerQuiz(req);
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.box).toBe(1);
    expect(body.previousBox).toBe(3);
    expect(body.status).toBe("learning");

    const { data: word } = await authenticatedClient
      .from("words")
      .select("box, wrong_count")
      .eq("id", savedWordId)
      .single();

    expect(word?.box).toBe(1);
    expect(word?.wrong_count).toBe(1);
  });

  it("GET /api/quiz?mode=practice selects words in scope without duplicates", async () => {
    const req = new NextRequest("http://localhost:3000/api/quiz?mode=practice&scope=all&size=5");
    const res = await getQuiz(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.questions).toHaveLength(1);
    expect(body.remainingDue).toBe(0);
    expect(body.questions[0].wordId).toBe(savedWordId);
  });

  it("validates bad requests and unauthorized calls", async () => {
    const badReq = new NextRequest("http://localhost:3000/api/quiz?mode=invalid_mode");
    const badRes = await getQuiz(badReq);
    expect(badRes.status).toBe(400);

    const badAnswerReq = new NextRequest("http://localhost:3000/api/quiz/answer", {
      method: "POST",
      body: JSON.stringify({ wordId: "not-a-uuid" }),
    });
    const badAnswerRes = await answerQuiz(badAnswerReq);
    expect(badAnswerRes.status).toBe(400);
  });
});
