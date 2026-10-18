"use client";

import React, { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, X } from "lucide-react";
import { Logo } from "./illustrations";
import { createClient } from "@/lib/supabase/client";
import { useStats } from "@/lib/stats-context";

export function MobileHeader({
  title,
  rightActions,
  onLogout,
}: {
  title?: string;
  rightActions?: React.ReactNode;
  onLogout?: () => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const { activeSession } = useStats();

  // Dedicated routes render their own specialized headers
  if (pathname !== "/words" && pathname?.startsWith("/words/")) return null;
  if (pathname?.startsWith("/review/session")) return null;

  if (activeSession) {
    return (
      <header className="m-header md:hidden" style={{ gap: 12 }}>
        <button
          className="icon-btn"
          aria-label="End session"
          onClick={activeSession.onEnd}
        >
          <X className="w-5 h-5" />
        </button>
        <div className="grow bar">
          <i style={{ width: `${activeSession.progress}%` }} />
        </div>
        <span className="hint num font-semibold">
          {activeSession.current} / {activeSession.total}
        </span>
      </header>
    );
  }

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

  let defaultTitle = "Learn";
  if (pathname?.startsWith("/words")) {
    defaultTitle = "Words";
  } else if (pathname?.startsWith("/review")) {
    defaultTitle = "Review";
  }

  return (
    <header className="m-header md:hidden">
      <Logo size={26} />
      <h1 className="grow">{title || defaultTitle}</h1>
      {rightActions}
      <div className="relative">
        <button
          className="icon-btn"
          aria-label="Account menu"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <span className="avatar" style={{ width: 28, height: 28, fontSize: 12 }}>
            R
          </span>
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
    </header>
  );
}
