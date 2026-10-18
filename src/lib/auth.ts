import { createClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";
import { User, SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/types/database";
import { NextResponse } from "next/server";

export class AuthError extends Error {
  constructor(message = "unauthorized", public status = 401) {
    super(message);
    this.name = "AuthError";
  }
}

export interface AuthContext {
  user: User;
  supabase: SupabaseClient<Database>;
}

export async function requireOwner(): Promise<AuthContext> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user || !user.email) {
    throw new AuthError("unauthorized", 401);
  }

  const allowed = env.ALLOWED_EMAIL.trim().toLowerCase();
  if (user.email.trim().toLowerCase() !== allowed) {
    throw new AuthError("unauthorized", 401);
  }

  return { user, supabase };
}

export function unauthorizedResponse() {
  return NextResponse.json({ error: "unauthorized" }, { status: 401 });
}
