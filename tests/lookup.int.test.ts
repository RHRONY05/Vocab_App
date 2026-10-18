import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { NextRequest } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/types/database";
import { POST } from "@/app/api/lookup/route";
import * as serverModule from "@/lib/supabase/server";
import { resetE2EUser } from "./helpers/reset";

describe("POST /api/lookup integration", () => {
  let e2eUserId: string;
  let authenticatedClient: ReturnType<typeof createSupabaseClient<Database>>;

  beforeAll(async () => {
    // Reset test user data first
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

    // Spy on createClient in server.ts to return this authenticated client
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

  it("returns AI card for a new word", async () => {
    const req = new NextRequest("http://localhost:3000/api/lookup", {
      method: "POST",
      body: JSON.stringify({ input: "substantive" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.type).toBe("word");
    expect(data.source).toBe("ai");
    expect(data.card.word).toBe("substantive");
    expect(data.saved).toBeNull();
    expect(data.repeatCounted).toBe(false);
  });

  it("returns reply for follow-up question when currentWord is set", async () => {
    const req = new NextRequest("http://localhost:3000/api/lookup", {
      method: "POST",
      body: JSON.stringify({
        input: "is it formal?",
        currentWord: "substantive",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.type).toBe("reply");
    expect(data.text).toContain("formal");
  });

  it("returns saved card and applies repeat-lookup rule for already-saved word", async () => {
    // Insert a word into Supabase words table for this user
    const savedCard = {
      word: "cohesive",
      partOfSpeech: "adjective" as const,
      meaningEn: "Forming a united whole.",
      meaningBn: "সুসংহত",
      register: "neutral" as const,
      howUsed: "Used for teams and modules.",
      collocations: ["cohesive team"],
      patterns: ["be cohesive"],
      examples: [
        "Example 1",
        "Example 2",
        "Example 3",
        "Example 4",
      ],
      dontConfuse: [],
      isRealWord: true,
      suggestion: null,
    };

    // Set last_looked_up_at to 24 hours ago to verify repeatCounted: true
    const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data: insertedWord, error: insertError } = await authenticatedClient
      .from("words")
      .insert({
        user_id: e2eUserId,
        word: "cohesive",
        card: savedCard,
        quiz: [],
        box: 2,
        lookup_count: 1,
        last_looked_up_at: pastDate,
      })
      .select()
      .single();

    if (insertError) {
      throw new Error(`Failed to insert test word: ${insertError.message}`);
    }

    const req = new NextRequest("http://localhost:3000/api/lookup", {
      method: "POST",
      body: JSON.stringify({ input: "cohesive" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.type).toBe("word");
    expect(data.source).toBe("saved");
    expect(data.saved.id).toBe(insertedWord.id);
    expect(data.repeatCounted).toBe(true);
    expect(data.saved.lookupCount).toBe(2);
    expect(data.saved.box).toBe(1); // Downgraded from box 2 to 1 per SRS rule
  });

  it("returns 400 bad request for empty or invalid input", async () => {
    const req = new NextRequest("http://localhost:3000/api/lookup", {
      method: "POST",
      body: JSON.stringify({ input: "" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("bad_request");
  });
});
