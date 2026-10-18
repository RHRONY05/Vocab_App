"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Keyboard, LogOut } from "lucide-react";
import { Logo } from "./illustrations";
import { ShortcutsDialog } from "./ShortcutsDialog";
import { createClient } from "@/lib/supabase/client";
import { useStats } from "@/lib/stats-context";

export function AppHeader({
  dueNow = 0,
  onLogout,
}: {
  dueNow?: number;
  onLogout?: () => void;
}) {
  const { stats } = useStats();
  const effectiveDueNow = dueNow || stats?.dueNow || 0;
  const pathname = usePathname();
  const router = useRouter();
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    if (onLogout) {
      onLogout();
      return;
    }
    const supabase = createClient();
    await supabase.auth.signOut({ scope: "local" });
    router.push("/login");
    router.refresh();
  };

  const isLearn = pathname === "/" || pathname === "";
  const isWords = pathname?.startsWith("/words");
  const isReview = pathname?.startsWith("/review");

  return (
    <>
      <header className="topbar hidden md:flex">
        <div className="side">
          <Link href="/" className="brand">
            <Logo size={28} />
            <span>Vocab</span>
          </Link>
        </div>

        <nav className="tabs" aria-label="Main navigation">
          <Link href="/" className={`tab ${isLearn ? "on" : ""}`}>
            Learn
          </Link>
          <Link href="/words" className={`tab ${isWords ? "on" : ""}`}>
            Words
          </Link>
          <Link href="/review" className={`tab ${isReview ? "on" : ""}`}>
            Review
            {effectiveDueNow > 0 && <span className="count">{effectiveDueNow}</span>}
          </Link>
        </nav>

        <div className="side end relative">
          <button
            className="icon-btn"
            title="Keyboard shortcuts"
            aria-label="Keyboard shortcuts"
            onClick={() => setShortcutsOpen(true)}
          >
            <Keyboard className="w-5 h-5" />
          </button>

          <div className="relative">
            <button
              className="avatar"
              aria-label="User menu"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              R
            </button>

            {menuOpen && (
              <div
                className="absolute right-0 mt-2 w-36 py-1 bg-[var(--surface)] border border-[var(--line)] rounded-xl shadow-lg z-50"
                onClick={() => setMenuOpen(false)}
              >
                <button
                  className="w-full text-left px-3 py-2 text-sm text-[var(--danger-text)] hover:bg-[var(--surface-2)] flex items-center gap-2"
                  onClick={handleLogout}
                >
                  <LogOut className="w-4 h-4" />
                  Log out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <ShortcutsDialog
        open={shortcutsOpen}
        onClose={() => setShortcutsOpen(false)}
      />
    </>
  );
}
