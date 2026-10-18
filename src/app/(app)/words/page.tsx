"use client";

import React, { useState, useEffect, useCallback, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, RotateCcw, ChevronRight } from "lucide-react";
import { ProgressStrip } from "@/components/ProgressStrip";
import { WordCard } from "@/components/WordCard";
import { WordStats } from "@/components/WordStats";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import { StatusDot } from "@/components/ui";
import { Illustration } from "@/components/illustrations";
import { useStats } from "@/lib/stats-context";
import { showDeletedToast } from "@/lib/toast";
import { formatWordRowDate, getDateGroupLabel } from "@/lib/dates";
import { WordCard as WordCardType } from "@/lib/schemas";

export interface WordRowItem {
  id: string;
  word: string;
  partOfSpeech: string;
  meaningEn: string;
  status: "new" | "learning" | "mastered";
  box: number;
  lookupCount: number;
  createdAt: string;
  nextReviewAt: string;
}

export interface WordDetailData {
  id: string;
  card: WordCardType;
  status: "new" | "learning" | "mastered";
  box: number;
  nextReviewAt: string;
  lookupCount: number;
  correctCount: number;
  wrongCount: number;
  createdAt: string;
  lastAttempts: Array<{
    kind: string;
    correct: boolean;
    answeredAt: string;
  }>;
}

function formatPos(pos?: string): string {
  if (!pos) return "";
  const p = pos.toLowerCase().trim();
  if (p.includes("adj")) return "adj";
  if (p.includes("noun")) return "noun";
  if (p.includes("verb")) return "verb";
  if (p.includes("adv")) return "adv";
  if (p.includes("prep")) return "prep";
  if (p.includes("conj")) return "conj";
  if (p.includes("interj")) return "interj";
  if (p.includes("pron")) return "pron";
  if (p.includes("phrase") || p.includes("idiom")) return "phrase";
  return p.slice(0, 4);
}

function WordsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { stats, refreshStats } = useStats();

  const [range, setRange] = useState<"today" | "week" | "month" | "all">("week");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [words, setWords] = useState<WordRowItem[]>([]);
  const [counts, setCounts] = useState({ today: 0, week: 0, month: 0, all: 0 });

  // Selected word for desktop detail pane
  const [userSelectedId, setUserSelectedId] = useState<string | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<WordDetailData | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Delete dialog state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Debounce search query (250ms per 06-UI.md)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch words for current tab & query
  const fetchWords = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        range,
        page: "1",
      });
      if (debouncedQuery.trim()) {
        params.set("q", debouncedQuery.trim());
      }

      const res = await fetch(`/api/words?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setWords(data.words || []);
        if (data.counts) {
          setCounts(data.counts);
        }
      }
    } catch (err) {
      console.warn("Failed to fetch words:", err);
    }
  }, [range, debouncedQuery]);

  useEffect(() => {
    let cancelled = false;
    async function loadWords() {
      try {
        const params = new URLSearchParams({
          range,
          page: "1",
        });
        if (debouncedQuery.trim()) {
          params.set("q", debouncedQuery.trim());
        }

        const res = await fetch(`/api/words?${params.toString()}`);
        if (res.ok && !cancelled) {
          const data = await res.json();
          setWords(data.words || []);
          if (data.counts) {
            setCounts(data.counts);
          }
        }
      } catch (err) {
        console.warn("Failed to fetch words:", err);
      }
    }

    loadWords();
    return () => {
      cancelled = true;
    };
  }, [range, debouncedQuery]);

  // Derive active selected word ID
  const paramId = searchParams.get("selected");
  const activeSelectedId = useMemo(() => {
    if (userSelectedId && words.some((w) => w.id === userSelectedId)) {
      return userSelectedId;
    }
    if (paramId && words.some((w) => w.id === paramId)) {
      return paramId;
    }
    return words[0]?.id || null;
  }, [userSelectedId, paramId, words]);

  // Fetch detail for active selected word
  useEffect(() => {
    if (!activeSelectedId) return;

    let isCurrent = true;
    async function fetchDetail() {
      try {
        setLoadingDetail(true);
        const res = await fetch(`/api/words/${activeSelectedId}`);
        if (res.ok && isCurrent) {
          const data = await res.json();
          setSelectedDetail(data);
        }
      } catch (err) {
        console.warn("Failed to fetch word detail:", err);
      } finally {
        if (isCurrent) {
          setLoadingDetail(false);
        }
      }
    }

    fetchDetail();
    return () => {
      isCurrent = false;
    };
  }, [activeSelectedId]);

  const currentDetail =
    activeSelectedId && selectedDetail?.id === activeSelectedId
      ? selectedDetail
      : null;

  // Group words by date group label
  const groupedWords = useMemo(() => {
    const groups: { [label: string]: WordRowItem[] } = {};
    for (const w of words) {
      const label = getDateGroupLabel(w.createdAt);
      if (!groups[label]) groups[label] = [];
      groups[label].push(w);
    }
    return groups;
  }, [words]);

  const handleDeleteWord = async () => {
    if (!activeSelectedId || !currentDetail) return;
    const wordToDelete = currentDetail.card.word;

    try {
      setIsDeleting(true);
      const res = await fetch(`/api/words/${activeSelectedId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        showDeletedToast(wordToDelete);
        setDeleteOpen(false);

        // Find index of deleted word to select next
        const currentIndex = words.findIndex((w) => w.id === activeSelectedId);
        const nextWords = words.filter((w) => w.id !== activeSelectedId);
        setWords(nextWords);

        if (nextWords.length > 0) {
          const nextIndex = Math.min(currentIndex, nextWords.length - 1);
          setUserSelectedId(nextWords[nextIndex].id);
        } else {
          setUserSelectedId(null);
        }

        refreshStats();
        // Also refresh counts
        fetchWords();
      }
    } catch (err) {
      console.error("Failed to delete word:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  const isGlobalEmpty = stats.total === 0 && !debouncedQuery;

  return (
    <div className="w-full max-w-[1440px] mx-auto p-4 md:p-[28px_32px_40px]">
      {/* ProgressStrip */}
      <ProgressStrip stats={stats} />

      {isGlobalEmpty ? (
        <div className="card flex flex-col items-center text-center p-12 gap-3 max-w-md mx-auto my-12">
          <Illustration name="book-sprout" size="xs" />
          <b className="text-base font-semibold">No words yet</b>
          <p className="hint text-sm">
            Look one up on the Learn tab and press Save.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-[var(--list-w)_1fr] gap-5 items-start">
          {/* List Pane */}
          <section className="card p-3">
            {/* Segmented Range Tabs */}
            <div className="seg full mb-2.5" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={range === "today"}
                className={range === "today" ? "on" : ""}
                onClick={() => setRange("today")}
              >
                Today <span className="num">{counts.today}</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={range === "week"}
                className={range === "week" ? "on" : ""}
                onClick={() => setRange("week")}
              >
                Week <span className="num">{counts.week}</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={range === "month"}
                className={range === "month" ? "on" : ""}
                onClick={() => setRange("month")}
              >
                Month <span className="num">{counts.month}</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={range === "all"}
                className={range === "all" ? "on" : ""}
                onClick={() => setRange("all")}
              >
                All <span className="num">{counts.all}</span>
              </button>
            </div>

            {/* Search Input */}
            <div className="input-icon mb-1.5">
              <Search className="w-4 h-4" />
              <input
                className="input"
                type="search"
                placeholder="Search words"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Word List Content */}
            {words.length === 0 ? (
              <div className="p-6 text-center text-[var(--ink-3)] text-sm">
                {debouncedQuery
                  ? "No words match your search."
                  : "No words in this period."}
              </div>
            ) : (
              <div className="flex flex-col gap-0.5">
                {Object.entries(groupedWords).map(([label, groupWords]) => (
                  <div key={label}>
                    <div className="label group-label">{label}</div>
                    {groupWords.map((item) => {
                      const isSelected = activeSelectedId === item.id;
                      return (
                        <div
                          key={item.id}
                          className={`wrow ${isSelected ? "on" : ""}`}
                          onClick={() => {
                            // On mobile (< 768px), navigate to /words/[id]
                            if (window.innerWidth < 768) {
                              router.push(`/words/${item.id}`);
                            } else {
                              setUserSelectedId(item.id);
                            }
                          }}
                        >
                          <StatusDot status={item.status} />
                          <div className="grow overflow-hidden">
                            <div className="w">
                              {item.word}
                              <span className="pos">
                                {formatPos(item.partOfSpeech)}
                              </span>
                              {item.lookupCount > 1 && (
                                <span className="xbadge md:hidden ml-1">
                                  ×{item.lookupCount}
                                </span>
                              )}
                            </div>
                            <div className="m truncate">{item.meaningEn}</div>
                          </div>

                          {/* Desktop Meta */}
                          <div className="meta hidden md:block">
                            {item.lookupCount > 1 ? (
                              <span className="xbadge">
                                <RotateCcw className="w-2.5 h-2.5 inline mr-1" />
                                {item.lookupCount}
                              </span>
                            ) : (
                              formatWordRowDate(item.createdAt)
                            )}
                          </div>

                          {/* Mobile Chevron */}
                          <ChevronRight className="i-sm md:hidden text-[var(--ink-3)]" />
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Desktop Detail Pane */}
          <div className="hidden md:block">
            {currentDetail ? (
              <div className="grid grid-cols-[1fr_280px] gap-5 items-start">
                <WordCard
                  card={currentDetail.card}
                  saved={{
                    id: currentDetail.id,
                    lookupCount: currentDetail.lookupCount,
                    box: currentDetail.box,
                    createdAt: currentDetail.createdAt,
                  }}
                  isSaved={true}
                  hideSaveButton={false}
                />

                <WordStats
                  status={currentDetail.status}
                  box={currentDetail.box}
                  nextReviewAt={currentDetail.nextReviewAt}
                  lookupCount={currentDetail.lookupCount}
                  correctCount={currentDetail.correctCount}
                  wrongCount={currentDetail.wrongCount}
                  createdAt={currentDetail.createdAt}
                  lastAttempts={currentDetail.lastAttempts}
                  onDelete={() => setDeleteOpen(true)}
                />
              </div>
            ) : loadingDetail ? (
              <div className="card p-8 flex items-center justify-center text-[var(--ink-3)]">
                Loading…
              </div>
            ) : (
              <div className="card p-8 flex items-center justify-center text-[var(--ink-3)]">
                Select a word to view details.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {currentDetail && (
        <DeleteConfirmDialog
          open={deleteOpen}
          word={currentDetail.card.word}
          isDeleting={isDeleting}
          onConfirm={handleDeleteWord}
          onCancel={() => setDeleteOpen(false)}
        />
      )}
    </div>
  );
}

export default function WordsPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full max-w-[1440px] mx-auto p-8 text-center text-[var(--ink-3)]">
          Loading…
        </div>
      }
    >
      <WordsPageContent />
    </Suspense>
  );
}
