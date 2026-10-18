import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Database } from "@/types/database";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
    // Trivial read query to keep the Supabase project active
    await supabase.from("words").select("id").limit(1);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Keepalive failed:", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
