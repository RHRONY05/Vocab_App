import { createClient } from "@supabase/supabase-js";
import { Database } from "@/types/database";

if (typeof window === "undefined") {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const dns = require("node:dns");
    if (!dns._vocabDnsPatched) {
      dns._vocabDnsPatched = true;
      const originalLookup = dns.lookup;
      type DnsCb = (
        err: Error | null,
        address: string | Array<{ address: string; family: number }>,
        family?: number
      ) => void;
      dns.lookup = function (hostname: string, options: unknown, callback: unknown) {
        let cb = callback as DnsCb;
        let opts = options;
        if (typeof options === "function") {
          cb = options as DnsCb;
          opts = {};
        }
        if (hostname === "vnadntttnwylvarcqwhe.supabase.co") {
          if (opts && typeof opts === "object" && (opts as { all?: boolean }).all) {
            return cb(null, [{ address: "172.64.149.246", family: 4 }]);
          }
          return cb(null, "172.64.149.246", 4);
        }
        return originalLookup(hostname, options, callback);
      };
    }
  } catch {
    // Ignore in non-node environments
  }
}

if (typeof WebSocket === "undefined") {
  (globalThis as unknown as { WebSocket: unknown }).WebSocket = class DummyWebSocket {};
}

export async function resetE2EUser(): Promise<void> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const e2eEmail = process.env.E2E_EMAIL;

  if (!url || !serviceKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }

  if (!e2eEmail) {
    throw new Error("Missing E2E_EMAIL");
  }

  const supabase = createClient<Database>(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  // Find e2e user ID
  const { data: usersData, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) {
    throw new Error(`Failed to list users: ${listError.message}`);
  }

  const e2eUser = usersData.users.find(
    (u) => u.email?.toLowerCase() === e2eEmail.toLowerCase()
  );

  if (!e2eUser) {
    console.warn(`[resetE2EUser] No user found with email ${e2eEmail}. Nothing to reset.`);
    return;
  }

  // Delete all words for this user (cascades to quiz_attempts)
  const { error: deleteWordsError } = await supabase
    .from("words")
    .delete()
    .eq("user_id", e2eUser.id);

  if (deleteWordsError) {
    throw new Error(`Failed to delete words for e2e user: ${deleteWordsError.message}`);
  }

  // Also clean up any orphan quiz attempts if any exist
  const { error: deleteAttemptsError } = await supabase
    .from("quiz_attempts")
    .delete()
    .eq("user_id", e2eUser.id);

  if (deleteAttemptsError) {
    throw new Error(`Failed to delete quiz attempts for e2e user: ${deleteAttemptsError.message}`);
  }

  console.log(`[resetE2EUser] Successfully reset words & quiz attempts for ${e2eEmail}`);
}

export async function seedE2EWords(
  words: Array<{
    word: string;
    card: unknown;
    quiz?: unknown[];
    box?: number;
    dueNow?: boolean;
    lookup_count?: number;
    wrong_count?: number;
    correct_count?: number;
  }>
): Promise<string[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const e2eEmail = process.env.E2E_EMAIL;

  if (!url || !serviceKey || !e2eEmail) {
    throw new Error("Missing credentials in seedE2EWords");
  }

  const supabase = createClient<Database>(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: usersData, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) throw listError;

  const e2eUser = usersData.users.find(
    (u) => u.email?.toLowerCase() === e2eEmail.toLowerCase()
  );

  if (!e2eUser) {
    throw new Error(`e2e user ${e2eEmail} not found`);
  }

  const insertedIds: string[] = [];
  const now = Date.now();

  for (const item of words) {
    const nextReviewAt = item.dueNow
      ? new Date(now - 3600 * 1000).toISOString()
      : new Date(now + 24 * 3600 * 1000).toISOString();

    const { data, error } = await supabase
      .from("words")
      .insert({
        user_id: e2eUser.id,
        word: item.word,
        card: item.card as unknown as Database["public"]["Tables"]["words"]["Insert"]["card"],
        quiz: (item.quiz || []) as unknown as Database["public"]["Tables"]["words"]["Insert"]["quiz"],
        box: item.box ?? 0,
        next_review_at: nextReviewAt,
        lookup_count: item.lookup_count ?? 1,
        wrong_count: item.wrong_count ?? 0,
        correct_count: item.correct_count ?? 0,
      })
      .select("id")
      .single();

    if (error) throw error;
    if (data) insertedIds.push(data.id);
  }

  return insertedIds;
}

// Allow CLI execution
if (process.argv[1]?.includes("reset")) {
  resetE2EUser().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

