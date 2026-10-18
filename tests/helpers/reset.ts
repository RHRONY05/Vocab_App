import { createClient } from "@supabase/supabase-js";
import { Database } from "@/types/database";

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

// Allow CLI execution
if (process.argv[1]?.includes("reset")) {
  resetE2EUser().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
