import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  GEMINI_API_KEY: z.string().min(1).optional(),
  GEMINI_MODEL: z.string().default("gemini-2.5-flash"),
  ALLOWED_EMAIL: z.string().email().default("muhammadrony147@gmail.com"),
  OWNER_PASSWORD: z.string().optional(),
  CRON_SECRET: z.string().optional(),
  APP_TIMEZONE: z.string().default("Asia/Dhaka"),
  E2E_EMAIL: z.string().email().optional(),
  E2E_PASSWORD: z.string().optional(),
  AI_MOCK: z.string().optional(),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  VERCEL_ENV: z.string().optional(),
});

export function validateEnv() {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error("❌ Invalid environment variables:", parsed.error.format());
    throw new Error("Invalid environment variables");
  }

  // Refuse to start if AI_MOCK=1 in production on Vercel
  if (parsed.data.VERCEL_ENV === "production" && parsed.data.AI_MOCK === "1") {
    throw new Error("AI_MOCK cannot be enabled in production on Vercel");
  }

  return parsed.data;
}

export const env = validateEnv();
