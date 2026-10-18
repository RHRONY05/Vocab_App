"use client";

import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import { WordCard as WordCardType } from "@/lib/schemas";
import { WordCard } from "@/components/WordCard";

interface WordDetailModalProps {
  wordId: string;
  initialCard?: WordCardType;
  showBangla?: boolean;
  onClose: () => void;
}

export function WordDetailModal({
  wordId,
  initialCard,
  showBangla = true,
  onClose,
}: WordDetailModalProps) {
  const [card, setCard] = useState<WordCardType | null>(initialCard || null);
  const [loading, setLoading] = useState(!initialCard);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    if (initialCard) return;
    let cancelled = false;
    async function fetchDetail() {
      try {
        setLoading(true);
        const res = await fetch(`/api/words/${wordId}`);
        if (res.ok && !cancelled) {
          const data = await res.json();
          setCard(data.card);
        }
      } catch (err) {
        console.warn("Failed to load word detail in modal:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchDetail();
    return () => {
      cancelled = true;
    };
  }, [wordId, initialCard]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--overlay)] animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg max-h-[85vh] overflow-y-auto bg-[var(--surface)] border border-[var(--line)] rounded-[var(--radius-xl)] shadow-lg p-5 relative"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-word-title"
      >
        <div className="flex justify-between items-center mb-4">
          <span id="modal-word-title" className="label">
            Word details
          </span>
          <button
            className="icon-btn"
            aria-label="Close word dialog"
            onClick={onClose}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="py-12 text-center hint">Loading word card…</div>
        ) : card ? (
          <WordCard
            card={card}
            hideSaveButton={true}
            showBangla={showBangla}
            className="border-0 shadow-none p-0"
          />
        ) : (
          <div className="py-8 text-center hint">Word not found.</div>
        )}
      </div>
    </div>
  );
}
