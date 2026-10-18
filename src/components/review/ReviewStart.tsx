"use client";

import React, { useState, useEffect } from "react";
import { Illustration } from "@/components/illustrations";
import { useStats } from "@/lib/stats-context";

interface ReviewStartProps {
  onStartReview: () => void;
  onStartPractice: (scope: "week" | "month" | "all" | "weak", size: 5 | 10 | 20) => void;
  loading?: boolean;
}

export function ReviewStart({
  onStartReview,
  onStartPractice,
  loading = false,
}: ReviewStartProps) {
  const { stats } = useStats();

  const [scope, setScope] = useState<"week" | "month" | "all" | "weak">("week");
  const [size, setSize] = useState<5 | 10 | 20>(10);
  const [counts, setCounts] = useState<{
    today: number;
    week: number;
    month: number;
    all: number;
  }>({
    today: 0,
    week: 0,
    month: 0,
    all: 0,
  });

  useEffect(() => {
    let cancelled = false;
    async function fetchCounts() {
      try {
        const res = await fetch("/api/words?range=week");
        if (res.ok && !cancelled) {
          const data = await res.json();
          if (data.counts) {
            setCounts(data.counts);
          }
        }
      } catch (err) {
        console.warn("Failed to fetch word scope counts:", err);
      }
    }
    fetchCounts();
    return () => {
      cancelled = true;
    };
  }, []);

  const dueNow = stats.dueNow || 0;
  const reviewMinutes = Math.max(1, Math.ceil((Math.min(dueNow, 15) * 25) / 60));

  const getScopeCandidateCount = () => {
    if (scope === "week") return counts.week;
    if (scope === "month") return counts.month;
    if (scope === "weak") return Math.min(30, counts.all);
    return counts.all;
  };

  const candidateCount = getScopeCandidateCount();

  const formatNextDueText = () => {
    if (!stats.nextDue || !stats.nextDue.at) return "No upcoming reviews scheduled.";
    try {
      const dueDate = new Date(stats.nextDue.at);
      const count = stats.nextDue.count;
      const countText = `${count} ${count === 1 ? "word" : "words"}`;

      const now = new Date();
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const isTomorrow =
        dueDate.getDate() === tomorrow.getDate() &&
        dueDate.getMonth() === tomorrow.getMonth() &&
        dueDate.getFullYear() === tomorrow.getFullYear();

      if (isTomorrow) {
        return `tomorrow, ${countText}`;
      }

      const formatted = new Intl.DateTimeFormat("en-GB", {
        weekday: "short",
        day: "numeric",
        month: "short",
        timeZone: "Asia/Dhaka",
      }).format(dueDate);

      return `${formatted}, ${countText}`;
    } catch {
      return "soon";
    }
  };

  const getScopeHint = () => {
    if (candidateCount === 0) return "Save a few words first";
    if (scope === "week") return `${candidateCount} words this week`;
    if (scope === "month") return `${candidateCount} words this month`;
    if (scope === "weak") return `${candidateCount} weak words`;
    return `${candidateCount} words in total`;
  };

  const duePreview = stats.duePreview || [];
  const previewSlice = duePreview.slice(0, 4);
  const remainingPreviewCount = Math.max(0, dueNow - 4);

  return (
    <div className="w-full max-w-[640px] mx-auto flex flex-col gap-5 py-6 md:py-10 animate-fade-in">
      {/* Daily Review Card (D05 / M05) */}
      <section className="card p-6 md:p-8 relative overflow-hidden">
        {dueNow > 0 ? (
          <>
            <div className="absolute right-3 top-3 md:right-5 md:top-5.5 pointer-events-none">
              <Illustration name="book-sprout" size="sm" />
            </div>
            <span className="label">Daily review</span>
            <div className="flex items-center gap-3.5 md:gap-5 my-2.5 mb-4 md:mb-5.5">
              <span className="serif num text-[48px] md:text-[56px] leading-[52px] md:leading-[60px] font-semibold text-[var(--accent-text)]">
                {dueNow}
              </span>
              <div>
                <div className="text-lg md:text-xl font-semibold leading-tight">
                  words due today
                </div>
                <div className="hint text-sm mt-0.5">
                  <span className="hidden md:inline">
                    About {reviewMinutes} {reviewMinutes === 1 ? "minute" : "minutes"} · weakest words first
                  </span>
                  <span className="md:hidden">
                    About {reviewMinutes} {reviewMinutes === 1 ? "minute" : "minutes"}
                  </span>
                </div>
              </div>
            </div>

            {/* Desktop Preview Chips */}
            {previewSlice.length > 0 && (
              <div className="hidden md:flex flex-wrap items-center gap-1.5 mb-6">
                {previewSlice.map((item) => (
                  <span key={item.id} className="chip">
                    {item.word}
                    {item.lookupCount > 1 && (
                      <span className="xbadge ml-1 text-xs px-1">
                        ×{item.lookupCount}
                      </span>
                    )}
                  </span>
                ))}
                {remainingPreviewCount > 0 && (
                  <span className="chip chip-outline">
                    +{remainingPreviewCount} more
                  </span>
                )}
              </div>
            )}

            <button
              className="btn btn-primary btn-lg w-full md:w-auto"
              onClick={onStartReview}
              disabled={loading}
            >
              Start review <kbd className="hidden md:inline-flex">Enter</kbd>
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center text-center py-4 gap-2">
            <Illustration name="caught-up" size="xs" />
            <h2 className="text-xl font-semibold mt-2">All caught up</h2>
            <p className="hint text-sm">
              Next review: {formatNextDueText()}
            </p>
          </div>
        )}
      </section>

      {/* Practice Card */}
      <section className="card p-6 md:p-8">
        <h2 className="text-[17px] font-semibold">Practice</h2>
        <p className="hint text-sm mt-0.5 mb-5">
          Extra practice any time. Weaker words come up more often.
        </p>

        <div className="flex flex-col gap-4">
          {/* Words scope selector */}
          <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
            <span className="label md:w-20">Words</span>
            {/* Desktop Segmented */}
            <div className="hidden md:flex seg">
              <button
                type="button"
                className={scope === "week" ? "on" : ""}
                onClick={() => setScope("week")}
              >
                This week
              </button>
              <button
                type="button"
                className={scope === "month" ? "on" : ""}
                onClick={() => setScope("month")}
              >
                This month
              </button>
              <button
                type="button"
                className={scope === "all" ? "on" : ""}
                onClick={() => setScope("all")}
              >
                All words
              </button>
              <button
                type="button"
                className={scope === "weak" ? "on" : ""}
                onClick={() => setScope("weak")}
              >
                Weak words
              </button>
            </div>
            {/* Mobile Grid */}
            <div className="grid grid-cols-2 gap-1.5 md:hidden">
              <button
                type="button"
                className="btn btn-sm h-9"
                style={{
                  background: scope === "week" ? "var(--accent-soft)" : "var(--surface-2)",
                  color: scope === "week" ? "var(--accent-text)" : "var(--ink-2)",
                }}
                onClick={() => setScope("week")}
              >
                This week
              </button>
              <button
                type="button"
                className="btn btn-sm h-9"
                style={{
                  background: scope === "month" ? "var(--accent-soft)" : "var(--surface-2)",
                  color: scope === "month" ? "var(--accent-text)" : "var(--ink-2)",
                }}
                onClick={() => setScope("month")}
              >
                This month
              </button>
              <button
                type="button"
                className="btn btn-sm h-9"
                style={{
                  background: scope === "all" ? "var(--accent-soft)" : "var(--surface-2)",
                  color: scope === "all" ? "var(--accent-text)" : "var(--ink-2)",
                }}
                onClick={() => setScope("all")}
              >
                All words
              </button>
              <button
                type="button"
                className="btn btn-sm h-9"
                style={{
                  background: scope === "weak" ? "var(--accent-soft)" : "var(--surface-2)",
                  color: scope === "weak" ? "var(--accent-text)" : "var(--ink-2)",
                }}
                onClick={() => setScope("weak")}
              >
                Weak words
              </button>
            </div>
          </div>

          {/* Question count selector */}
          <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
            <span className="label md:w-20">Questions</span>
            <div className="seg w-full md:w-auto">
              <button
                type="button"
                className={size === 5 ? "on" : ""}
                onClick={() => setSize(5)}
              >
                5
              </button>
              <button
                type="button"
                className={size === 10 ? "on" : ""}
                onClick={() => setSize(10)}
              >
                10
              </button>
              <button
                type="button"
                className={size === 20 ? "on" : ""}
                onClick={() => setSize(20)}
              >
                20
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-3.5 mt-6">
          <button
            className="btn btn-secondary w-full md:w-auto"
            onClick={() => onStartPractice(scope, size)}
            disabled={candidateCount === 0 || loading}
          >
            Start practice
          </button>
          <span className="hint text-sm text-center md:text-left">{getScopeHint()}</span>
        </div>
      </section>

      {/* Footer statistics */}
      <div className="flex items-center justify-center gap-4 text-sm hint mt-2">
        <span className="flex items-center gap-1.5">
          <span className="dot new" />
          New {stats.new}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="dot learning" />
          Learning {stats.learning}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="dot mastered" />
          Mastered {stats.mastered}
        </span>
      </div>
    </div>
  );
}
