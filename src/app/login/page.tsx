"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { CircleAlert } from "lucide-react";
import { Illustration, PageDecor } from "@/components/illustrations";
import { Button } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        setError("Wrong email or password. Try again.");
        setLoading(false);
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setError("Wrong email or password. Try again.");
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen flex items-center justify-center p-4 bg-[var(--bg)] text-[var(--ink)]">
      <PageDecor corners={["tr", "bl"]} />
      <form
        onSubmit={handleSubmit}
        className="card w-full max-w-[400px] p-6 md:p-[36px_32px_32px] relative z-10"
      >
        <div className="flex flex-col items-center gap-2 mb-6.5 text-center">
          <Illustration name="book-sprout" size="sm" />
          <h1 className="serif text-[30px] leading-[36px] tracking-[-0.01em]">
            Vocab
          </h1>
          <p className="hint">Sign in to continue</p>
        </div>

        <div className="flex flex-col gap-4">
          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              className="input"
              placeholder="you@example.com"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className="input"
              placeholder="••••••••••••"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <div className="banner banner-danger text-sm" role="alert">
              <CircleAlert className="i-sm w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            block
            className="mt-2"
            disabled={loading}
          >
            {loading ? "Signing in…" : "Sign in"}
          </Button>
        </div>
      </form>
    </main>
  );
}
