import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { NextRequest } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/types/database";
import { POST as saveWord, GET as listWords } from "@/app/api/words/route";
import { GET as getStats } from "@/app/api/words/stats/route";
import { GET as getWord, DELETE as deleteWord } from "@/app/api/words/[id]/route";
import * as serverModule from "@/lib/supabase/server";
import { resetE2EUser } from "./helpers/reset";
import { WordCard } from "@/lib/schemas";

describe("Words API integration", () => {
  let e2eUserId: string;
  let authenticatedClient: ReturnType<typeof createSupabaseClient<Database>>;

  const sampleCard: WordCard = {
    word: "cohesive",
    partOfSpeech: "adjective",
    meaningEn: "Forming a united whole.",
    meaningBn: "সুসংহত",
    register: "neutral",
    howUsed: "Common in technical writing and teamwork.",
    collocations: ["cohesive team", "cohesive unit"],
    patterns: ["be cohesive"],
    examples: [
      "The team was cohesive.",
      "A cohesive design is effective.",
      "The paragraphs form a cohesive argument.",
      "Modules should be cohesive.",
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

    e2eUserId = authData.user.id;

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

  it("POST /api/words creates a new word and generates quiz", async () => {
    const req = new NextRequest("http://localhost:3000/api/words", {
      method: "POST",
      body: JSON.stringify({ card: sampleCard }),
    });

    const res = await saveWord(req);
    expect(res.status).toBe(201);

    const data = await res.json();
    expect(data.status).toBe("created");
    expect(data.id).toBeDefined();
    expect(data.quizReady).toBe(true);
    savedWordId = data.id;

    // Verify row in database has box 0 and 3 quiz questions
    const { data: dbRow } = await authenticatedClient
      .from("words")
      .select("*")
      .eq("id", savedWordId)
      .single();

    expect(dbRow?.box).toBe(0);
    expect(Array.isArray(dbRow?.quiz)).toBe(true);
    expect((dbRow?.quiz as unknown[]).length).toBe(3);
  });

  it("POST /api/words updates when word already exists and maintains 1 row", async () => {
    const updatedCard = {
      ...sampleCard,
      meaningEn: "Forming a tightly united whole.",
    };

    const req = new NextRequest("http://localhost:3000/api/words", {
      method: "POST",
      body: JSON.stringify({ card: updatedCard }),
    });

    const res = await saveWord(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.status).toBe("updated");
    expect(data.id).toBe(savedWordId);

    // Verify only 1 row exists
    const { count } = await authenticatedClient
      .from("words")
      .select("*", { count: "exact", head: true })
      .eq("word", "cohesive");

    expect(count).toBe(1);
  });

  it("GET /api/words returns list with ranges and counts", async () => {
    const req = new NextRequest("http://localhost:3000/api/words?range=today&page=1");
    const res = await listWords(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.words.length).toBeGreaterThanOrEqual(1);
    expect(data.words[0].word).toBe("cohesive");
    expect(data.words[0].status).toBe("new");
    expect(data.counts.today).toBeGreaterThanOrEqual(1);
    expect(data.counts.all).toBeGreaterThanOrEqual(1);
  });

  it("GET /api/words/stats returns accurate statistics", async () => {
    const res = await getStats();
    expect(res.status).toBe(200);

    const stats = await res.json();
    expect(stats.total).toBeGreaterThanOrEqual(1);
    expect(stats.new).toBeGreaterThanOrEqual(1);
    expect(stats.savedToday).toBeGreaterThanOrEqual(1);
  });

  it("GET /api/words/[id] returns detail with attempt history", async () => {
    // Insert an attempt for this word
    const { error: attemptInsertError } = await authenticatedClient
      .from("quiz_attempts")
      .insert({
        user_id: e2eUserId,
        word_id: savedWordId,
        kind: "fill_blank",
        correct: true,
        mode: "practice",
      });
    if (attemptInsertError) {
      throw new Error(`Failed to insert attempt: ${attemptInsertError.message}`);
    }

    const req = new NextRequest(`http://localhost:3000/api/words/${savedWordId}`);
    const res = await getWord(req, { params: Promise.resolve({ id: savedWordId }) });
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.id).toBe(savedWordId);
    expect(data.card.word).toBe("cohesive");
    expect(data.lastAttempts.length).toBe(1);
    expect(data.lastAttempts[0].kind).toBe("fill_blank");
    expect(data.lastAttempts[0].correct).toBe(true);
  });

  it("DELETE /api/words/[id] deletes the word and cascades attempts", async () => {
    const req = new NextRequest(`http://localhost:3000/api/words/${savedWordId}`, {
      method: "DELETE",
    });

    const res = await deleteWord(req, { params: Promise.resolve({ id: savedWordId }) });
    expect(res.status).toBe(204);

    // Verify word is deleted
    const { data: wordRow } = await authenticatedClient
      .from("words")
      .select("id")
      .eq("id", savedWordId)
      .maybeSingle();

    expect(wordRow).toBeNull();

    // Verify cascaded quiz attempt deletion
    const { count: attemptCount } = await authenticatedClient
      .from("quiz_attempts")
      .select("*", { count: "exact", head: true })
      .eq("word_id", savedWordId);

    expect(attemptCount).toBe(0);
  });
});
