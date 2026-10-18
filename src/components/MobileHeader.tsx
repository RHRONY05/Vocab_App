"use client";

import React, { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Logo } from "./illustrations";

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
              onClick={() => {
                if (onLogout) {
                  onLogout();
                } else {
                  router.push("/login");
                }
              }}
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
