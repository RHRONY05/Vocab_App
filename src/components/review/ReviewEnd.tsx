"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Illustration } from "@/components/illustrations";
import { useStats } from "@/lib/stats-context";

export interface MissedWordItem {
  id: string;
  word: string;
  partOfSpeech: string;
  meaningEn: string;
}

interface ReviewEndProps {
  correctCount: number;
  totalInitialQuestions: number;
  promotedCount: number;
  masteredCount: number;
  missedWords: MissedWordItem[];
  remainingDue: number;
  onContinueReview?: () => void;
  onPracticeMore: () => void;
  onBackToLearn: () => void;
}

export function ReviewEnd({
  correctCount,
  totalInitialQuestions,
  promotedCount,
  masteredCount,
  missedWords,
  remainingDue,
  onContinueReview,
  onPracticeMore,
  onBackToLearn,
}: ReviewEndProps) {
  const { stats } = useStats();

  // Enter key triggers primary button
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Enter") {
        e.preventDefault();
        if (remainingDue > 0 && onContinueReview) {
          onContinueReview();
        } else {
          onPracticeMore();
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [remainingDue, onContinueReview, onPracticeMore]);

  const buildSummaryLine = () => {
    if (correctCount === 0 && totalInitialQuestions > 0) {
      return "Those were tough. They'll come back tomorrow.";
    }

    const parts: string[] = [];
    if (promotedCount > 0) {
      parts.push(`${promotedCount} ${promotedCount === 1 ? "word" : "words"} moved up`);
    }
    if (masteredCount > 0) {
      parts.push(`${masteredCount} reached Mastered`);
    }

    if (parts.length > 0) {
      return `Nice work. ${parts.join(", ")}.`;
    }

    return "Great session!";
  };

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

  return (
    <div className="w-full max-w-[560px] mx-auto flex flex-col items-center text-center gap-5.5 py-8 md:py-12 animate-fade-in">
      <Illustration name="caught-up" size="default" />

      <div>
        <div className="serif num text-[48px] md:text-[56px] leading-[54px] md:leading-[62px] font-semibold">
          {correctCount}{" "}
          <span className="text-[var(--ink-3)] font-medium text-[36px] md:text-[42px]">
            / {totalInitialQuestions}
          </span>
        </div>
        <p className="text-[var(--ink-2)] text-base mt-1.5 font-normal">
          {buildSummaryLine()}
        </p>
      </div>

      {/* Missed Words Card (if any) */}
      {missedWords.length > 0 && (
        <section className="card w-full p-2 text-left">
          <div className="label px-3.5 pt-2.5 pb-1 text-xs">
            Missed · back tomorrow
          </div>
          <div className="flex flex-col">
            {missedWords.map((item) => (
              <Link
                key={item.id}
                href={`/words?q=${encodeURIComponent(item.word)}`}
                className="wrow flex items-center gap-3 p-3 hover:bg-[var(--surface-2)] rounded-[var(--radius-md)] text-inherit no-underline transition-colors"
              >
                <span className="dot learning shrink-0" />
                <div className="grow min-w-0">
                  <div className="font-semibold text-sm flex items-center gap-1.5">
                    {item.word}
                    <span className="pos text-xs text-[var(--ink-3)] font-normal">
                      {item.partOfSpeech}
                    </span>
                  </div>
                  <div className="m text-xs text-[var(--ink-2)] truncate">
                    {item.meaningEn}
                  </div>
                </div>
                <ChevronRight className="i-sm w-4 h-4 text-[var(--ink-3)] shrink-0" />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Bottom Actions */}
      <div className="flex flex-col gap-2.5 w-full mt-2">
        {remainingDue > 0 ? (
          <>
            <button
              className="btn btn-primary btn-lg w-full"
              onClick={onContinueReview}
            >
              {remainingDue} more due · Continue{" "}
              <kbd className="hidden md:inline-flex">Enter</kbd>
            </button>
            <button
              className="btn btn-secondary btn-lg w-full"
              onClick={onBackToLearn}
            >
              Back to Learn
            </button>
          </>
        ) : (
          <>
            <p className="hint text-sm">
              All caught up for today. Next review: {formatNextDueText()}
            </p>
            <div className="flex flex-col sm:flex-row gap-2.5 w-full mt-1">
              <button
                className="btn btn-primary btn-lg grow"
                onClick={onPracticeMore}
              >
                Practice more <kbd className="hidden md:inline-flex">Enter</kbd>
              </button>
              <button
                className="btn btn-secondary btn-lg grow"
                onClick={onBackToLearn}
              >
                Back to Learn
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
