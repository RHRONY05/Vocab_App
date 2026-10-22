"use client";

import React from "react";
import { BookmarkPlus, Check, CircleAlert, Loader2, RotateCcw } from "lucide-react";
import { WordCard as WordCardType } from "@/lib/schemas";
import { cn } from "@/lib/utils";

export interface WordCardProps {
  card: WordCardType;
  showBangla?: boolean;
  saved?: {
    id: string;
    lookupCount: number;
    box: number;
    createdAt: string;
  } | null;
  repeatCounted?: boolean;
  isSaved?: boolean;
  saving?: boolean;
  saveStatus?: "created" | "updated" | null;
  onSave?: (card: WordCardType) => void;
  onLookupSuggestion?: (word: string) => void;
  compact?: boolean;
  className?: string;
  hideSaveButton?: boolean;
}

function highlightHeadword(text: string, headword: string): React.ReactNode {
  if (!headword) return text;
  // Match headword with optional suffixes like s, ed, ing, d, es, er, etc.
  const escaped = headword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`\\b(${escaped}(?:ing|ed|es|s|d|er)?)\\b`, "gi");
  const parts = text.split(regex);

  return parts.map((part, index) => {
    if (regex.test(part)) {
      regex.lastIndex = 0;
      return (
        <mark key={index} className="w">
          {part}
        </mark>
      );
    }
    return part;
  });
}

function formatSavedDate(dateStr?: string): string {
  if (!dateStr) return "today";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
    });
  } catch {
    return dateStr;
  }
}

export function WordCard({
  card,
  showBangla = true,
  saved,
  repeatCounted = false,
  isSaved = false,
  saving = false,
  saveStatus = null,
  onSave,
  onLookupSuggestion,
  compact = false,
  className,
  hideSaveButton = false,
}: WordCardProps) {
  const isAlreadySaved = isSaved || !!saved;

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* Banner 1: Typo / suggestion banner */}
      {!card.isRealWord && card.suggestion && (
        <div className="banner banner-warn" role="alert">
          <CircleAlert className="i-sm w-4 h-4 shrink-0" />
          <span>
            “{card.word}” isn&apos;t a word. Did you mean{" "}
            <button
              type="button"
              className="font-semibold underline cursor-pointer text-inherit"
              onClick={() => onLookupSuggestion?.(card.suggestion!)}
            >
              {card.suggestion}
            </button>
            ?
          </span>
        </div>
      )}

      {/* Banner 2: Repeat lookup counted banner */}
      {repeatCounted && saved && (
        <div className="banner banner-accent" role="status">
          <RotateCcw className="i-sm w-4 h-4 shrink-0" />
          <span>
            You&apos;ve looked this up <b>{saved.lookupCount} times</b>. It&apos;s
            back in today&apos;s review.
          </span>
        </div>
      )}

      {/* Banner 3: Saved card within 12 hours */}
      {!repeatCounted && saved && (
        <div className="banner banner-neutral" role="status">
          <span>
            Saved on {formatSavedDate(saved.createdAt)}. You looked it up
            earlier today.
          </span>
        </div>
      )}

      {/* The WordCard Article */}
      <article
        className={cn(
          "card wc",
          compact && "compact",
          className
        )}
      >
        <div className="wc-head">
          <div className="grow">
            <h2 className="headword">{card.word}</h2>
            <div className="wc-meta">
              <span className="chip">{card.partOfSpeech}</span>
              <span className="chip">{card.register}</span>
            </div>
          </div>

          {!hideSaveButton && card.isRealWord && (
            <div>
              {isAlreadySaved ? (
                <span className="btn btn-saved btn-sm" aria-label="Word saved">
                  <Check className="i-sm w-4 h-4" />
                  {saveStatus === "updated" ? "Updated" : "Saved"}
                </span>
              ) : (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => onSave?.(card)}
                  disabled={saving}
                  aria-label={`Save ${card.word}`}
                >
                  {saving ? (
                    <>
                      <Loader2 className="i-sm w-4 h-4 animate-spin" />
                      <span>
                        Saving
                        <span className="saving-dots">
                          <span>.</span>
                          <span>.</span>
                          <span>.</span>
                        </span>
                      </span>
                    </>
                  ) : (
                    <>
                      <BookmarkPlus className="i-sm w-4 h-4" />
                      Save <kbd className="kbd">Ctrl S</kbd>
                    </>
                  )}
                </button>
              )}
            </div>
          )}
        </div>

        <p className="meaning">{card.meaningEn}</p>

        {showBangla && card.meaningBn && (
          <p className="bangla">
            <span className="tag">বাংলা</span>
            {card.meaningBn}
          </p>
        )}

        <div className="wc-body">
          {card.howUsed && (
            <section className="wc-sec">
              <span className="label">How it&apos;s used</span>
              <p className="text">{card.howUsed}</p>
            </section>
          )}

          {card.collocations && card.collocations.length > 0 && (
            <section className="wc-sec">
              <span className="label">Collocations</span>
              <div className="collocs">
                {card.collocations.map((c) => (
                  <span key={c} className="chip">
                    {c}
                  </span>
                ))}
              </div>
            </section>
          )}

          {card.patterns && card.patterns.length > 0 && (
            <section className="wc-sec">
              <span className="label">Patterns</span>
              <ul className="patterns">
                {card.patterns.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </section>
          )}

          {card.examples && card.examples.length > 0 && (
            <section className="wc-sec">
              <span className="label">Examples</span>
              <ol className="examples">
                {card.examples.map((ex, i) => (
                  <li key={i}>
                    <span>{highlightHeadword(ex, card.word)}</span>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {card.dontConfuse && card.dontConfuse.length > 0 && (
            <section className="wc-sec">
              <span className="label">Don&apos;t confuse</span>
              <div className="confuse">
                {card.dontConfuse.map((item) => (
                  <p key={item.word} className="pair">
                    <b>{item.word}</b> — {item.difference}
                  </p>
                ))}
              </div>
            </section>
          )}
        </div>
      </article>
    </div>
  );
}
