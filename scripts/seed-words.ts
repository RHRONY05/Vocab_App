import * as fs from "fs";
import * as path from "path";

if (typeof globalThis.WebSocket === "undefined") {
  // @ts-expect-error Node 20 polyfill
  globalThis.WebSocket = class DummyWebSocket {};
}

import { createClient } from "@supabase/supabase-js";
import { Database, Json } from "@/types/database";
import { normaliseWord } from "@/lib/words";
import { lookupWithAi, generateQuizWithAi } from "@/lib/ai";

function loadEnvLocal() {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) {
    throw new Error(".env.local not found");
  }
  const lines = fs.readFileSync(envPath, "utf8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx !== -1) {
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim();
      process.env[key] = val;
    }
  }
}

const SEED_WORDS = [
  "augmentation",
  "cohesive",
  "inference",
  "morph",
  "substantial",
  "substantive",
];

async function main() {
  loadEnvLocal();

  // Ensure AI_MOCK is off so we call real Gemini
  delete process.env.AI_MOCK;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const ownerEmail = process.env.ALLOWED_EMAIL;

  if (!url || !serviceKey || !ownerEmail) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, or ALLOWED_EMAIL"
    );
  }

  const supabase = createClient<Database>(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Find owner user
  const { data: usersData, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) throw listError;

  const owner = usersData.users.find(
    (u) => u.email?.toLowerCase() === ownerEmail.toLowerCase()
  );
  if (!owner) {
    throw new Error(`Owner user (${ownerEmail}) not found. Run scripts/create-user.ts first.`);
  }

  console.log(`Seeding words for owner: ${ownerEmail} (${owner.id})...`);

  for (const rawWord of SEED_WORDS) {
    const word = normaliseWord(rawWord);

    // Check if word already exists for owner
    const { data: existing, error: checkError } = await supabase
      .from("words")
      .select("id, word")
      .eq("user_id", owner.id)
      .eq("word", word)
      .maybeSingle();

    if (checkError) {
      console.warn(`Error checking "${word}":`, checkError);
    }

    if (existing) {
      console.log(`✓ "${word}" already exists (id: ${existing.id}), skipping.`);
      continue;
    }

    console.log(`Generating AI card for "${word}"...`);
    const lookupResult = await lookupWithAi({ input: word });
    if (lookupResult.type !== "word" || !lookupResult.card.isRealWord) {
      console.warn(`Failed to generate valid word card for "${word}"`);
      continue;
    }

    const card = lookupResult.card;

    console.log(`Generating AI quiz for "${word}"...`);
    let quiz: unknown[] = [];
    try {
      quiz = await generateQuizWithAi(card);
    } catch (err) {
      console.warn(`Quiz generation failed for "${word}", inserting with quiz = []:`, err);
      quiz = [];
    }

    const now = new Date().toISOString();
    const nextReview = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const { data: inserted, error: insertError } = await supabase
      .from("words")
      .insert({
        user_id: owner.id,
        word,
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
      console.error(`Error saving "${word}":`, insertError);
    } else {
      console.log(`✓ Seeded "${word}" (id: ${inserted.id}, quiz: ${quiz.length} questions).`);
    }

    // Small delay between words
    await new Promise((r) => setTimeout(r, 1200));
  }

  console.log("Seeding complete!");
}

main().catch((err) => {
  console.error("Seed script failed:", err);
  process.exit(1);
});
