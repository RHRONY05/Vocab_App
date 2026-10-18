"use client";

import React from "react";
import { Check, X, Trash2 } from "lucide-react";
import { StatusDot, BoxMeter } from "./ui";
import { formatNextReviewDate } from "@/lib/dates";

export interface WordStatsProps {
  status: "new" | "learning" | "mastered";
  box: number;
  nextReviewAt?: string | null;
  lookupCount: number;
  correctCount: number;
  wrongCount: number;
  createdAt: string;
  lastAttempts?: Array<{
    kind: string;
    correct: boolean;
    answeredAt: string;
  }>;
  compact?: boolean;
  onDelete?: () => void;
}

function formatKind(kind: string): string {
  switch (kind) {
    case "meaning":
      return "Meaning";
    case "fill_blank":
      return "Fill in the blank";
    case "usage":
      return "Usage";
    case "recall":
      return "Recall";
    default:
      return kind;
  }
}

function formatSavedDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(d);
  } catch {
    return dateStr;
  }
}

function formatAttemptDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "short",
    }).format(d);
  } catch {
    return dateStr;
  }
}

export function WordStats({
  status,
  box,
  nextReviewAt,
  lookupCount,
  correctCount,
  wrongCount,
  createdAt,
  lastAttempts = [],
  compact = false,
  onDelete,
}: WordStatsProps) {
  if (compact) {
    return (
      <section className="card p-[14px_16px] mb-3">
        <div className="row justify-between mb-2">
          <span className="row gap-2 font-semibold text-[14px]">
            <StatusDot status={status} />
            <span className="capitalize">{status}</span> · box {box} of 5
          </span>
          <span className="xbadge">×{lookupCount} looked up</span>
        </div>
        <BoxMeter box={box} className="mb-2.5" />
        <div className="row hint justify-between text-[13px]">
          <span>
            Next review{" "}
            <b style={{ color: "var(--ink)" }}>
              {formatNextReviewDate(nextReviewAt)}
            </b>
          </span>
          <span className="num">
            <span style={{ color: "var(--success-text)", fontWeight: 600 }}>
              {correctCount}
            </span>{" "}
            right ·{" "}
            <span style={{ color: "var(--danger-text)", fontWeight: 600 }}>
              {wrongCount}
            </span>{" "}
            wrong
          </span>
        </div>
      </section>
    );
  }

  return (
    <aside className="card p-5">
      <div className="label mb-3">Progress</div>
      <div className="row justify-between mb-1.5">
        <span className="row gap-2 font-semibold">
          <StatusDot status={status} />
          <span className="capitalize">{status}</span>
        </span>
        <span className="hint">Box {box} of 5</span>
      </div>
      <BoxMeter box={box} className="mb-4.5" />

      <dl className="col gap-3 m-0 text-[14px]">
        <div className="row justify-between">
          <dt className="muted">Next review</dt>
          <dd className="m-0 font-semibold">{formatNextReviewDate(nextReviewAt)}</dd>
        </div>
        <div className="row justify-between">
          <dt className="muted">Looked up</dt>
          <dd className="m-0">
            <span className="xbadge">{lookupCount} times</span>
          </dd>
        </div>
        <div className="row justify-between">
          <dt className="muted">Answers</dt>
          <dd className="m-0 num">
            <span style={{ color: "var(--success-text)", fontWeight: 600 }}>
              {correctCount}
            </span>{" "}
            right ·{" "}
            <span style={{ color: "var(--danger-text)", fontWeight: 600 }}>
              {wrongCount}
            </span>{" "}
            wrong
          </dd>
        </div>
        <div className="row justify-between">
          <dt className="muted">Saved</dt>
          <dd className="m-0">{formatSavedDate(createdAt)}</dd>
        </div>
      </dl>

      <div className="label mt-5.5 mb-2">Recent answers</div>
      {lastAttempts.length === 0 ? (
        <p className="hint text-[13px] my-1">No quiz answers yet.</p>
      ) : (
        <ul className="col list-none gap-2 text-[13.5px]">
          {lastAttempts.map((attempt, i) => (
            <li key={i} className="row gap-2">
              {attempt.correct ? (
                <Check
                  className="i-sm shrink-0 w-4 h-4"
                  style={{ color: "var(--success)" }}
                />
              ) : (
                <X
                  className="i-sm shrink-0 w-4 h-4"
                  style={{ color: "var(--danger)" }}
                />
              )}
              <span className="grow">{formatKind(attempt.kind)}</span>
              <span className="hint">{formatAttemptDate(attempt.answeredAt)}</span>
            </li>
          ))}
        </ul>
      )}

      {onDelete && (
        <div className="border-t border-[var(--line)] mt-4.5 pt-3.5">
          <button
            type="button"
            className="btn btn-danger btn-sm pl-2"
            onClick={onDelete}
          >
            <Trash2 className="i-sm w-4 h-4" />
            Delete word
          </button>
        </div>
      )}
    </aside>
  );
}
