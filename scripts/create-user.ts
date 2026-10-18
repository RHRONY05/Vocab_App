import * as fs from "fs";
import * as path from "path";

if (typeof globalThis.WebSocket === "undefined") {
  // @ts-expect-error Node 20 polyfill
  globalThis.WebSocket = class DummyWebSocket {};
}
import { createClient } from "@supabase/supabase-js";

function loadEnvLocal() {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) {
    throw new Error(".env.local not found");
  }
  const lines = fs.readFileSync(envPath, "utf8").split("\n");
  const env: Record<string, string> = {};
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx !== -1) {
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim();
      env[key] = val;
    }
  }
  return env;
}

async function main() {
  const env = loadEnvLocal();
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  }

  const isE2E = process.argv.includes("--e2e");
  const email = isE2E ? env.E2E_EMAIL : env.ALLOWED_EMAIL;
  const password = isE2E ? env.E2E_PASSWORD : env.OWNER_PASSWORD;

  if (!email || !password) {
    throw new Error(`Missing email or password for ${isE2E ? "E2E user" : "Owner"} in .env.local`);
  }

  const supabase = createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  console.log(`Creating/updating ${isE2E ? "E2E user" : "Owner"} (${email})...`);

  // Check if user exists
  const { data: usersData, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) {
    throw listError;
  }

  const existing = usersData.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());

  if (existing) {
    console.log(`User ${email} already exists (${existing.id}), updating password...`);
    const { error: updateError } = await supabase.auth.admin.updateUserById(existing.id, {
      password,
      email_confirm: true,
    });
    if (updateError) throw updateError;
    console.log(`✅ User ${email} password updated.`);
  } else {
    const { data, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (createError) throw createError;
    console.log(`✅ User ${email} created with id ${data.user.id}.`);
  }
}

main().catch((err) => {
  console.error("Failed to create user:", err);
  process.exit(1);
});
