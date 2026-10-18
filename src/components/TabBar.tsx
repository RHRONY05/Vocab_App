"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Library, Repeat2 } from "lucide-react";
import { useStats } from "@/lib/stats-context";

export function TabBar({ dueNow = 0 }: { dueNow?: number }) {
  const { stats } = useStats();
  const effectiveDueNow = dueNow || stats?.dueNow || 0;
  const pathname = usePathname();

  // Hide the tab bar during an active review session
  const isReviewSession = pathname?.startsWith("/review/session");
  if (isReviewSession) return null;

  const isLearn = pathname === "/" || pathname === "";
  const isWords = pathname?.startsWith("/words");
  const isReview = pathname?.startsWith("/review");

  return (
    <nav className="tabbar md:hidden" aria-label="Main">
      <Link href="/" className={isLearn ? "on" : ""}>
        <BookOpen className="w-5 h-5" />
        Learn
      </Link>
      <Link href="/words" className={isWords ? "on" : ""}>
        <Library className="w-5 h-5" />
        Words
      </Link>
      <Link href="/review" className={isReview ? "on" : ""}>
        <Repeat2 className="w-5 h-5" />
        Review
        {effectiveDueNow > 0 && <span className="count">{effectiveDueNow}</span>}
      </Link>
    </nav>
  );
}
