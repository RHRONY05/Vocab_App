"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, RotateCcw, ChevronRight, X, Loader2 } from "lucide-react";
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

  // Pagination & infinite feed state
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingWords, setLoadingWords] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const observerTarget = useRef<HTMLDivElement>(null);

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

  // Fetch initial batch of words when tab or debounced query changes
  useEffect(() => {
    let cancelled = false;
    async function loadInitialWords() {
      try {
        setLoadingWords(true);
        setPage(1);
        const params = new URLSearchParams({
          range,
          page: "1",
          limit: "10",
        });
        if (debouncedQuery.trim()) {
          params.set("q", debouncedQuery.trim());
        }

        const res = await fetch(`/api/words?${params.toString()}`);
        if (res.ok && !cancelled) {
          const data = await res.json();
          setWords(data.words || []);
          setHasMore(!!data.hasMore);
          if (data.counts) {
            setCounts(data.counts);
          }
        }
      } catch (err) {
        console.warn("Failed to fetch words:", err);
      } finally {
        if (!cancelled) {
          setLoadingWords(false);
        }
      }
    }

    loadInitialWords();
    return () => {
      cancelled = true;
    };
  }, [range, debouncedQuery]);

  // Infinite scroll load more
  const loadMoreWords = useCallback(async () => {
    if (loadingMore || !hasMore || loadingWords) return;
    try {
      setLoadingMore(true);
      const nextPage = page + 1;
      const params = new URLSearchParams({
        range,
        page: String(nextPage),
        limit: "10",
      });
      if (debouncedQuery.trim()) {
        params.set("q", debouncedQuery.trim());
      }

      const res = await fetch(`/api/words?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        const incoming = data.words || [];
        setWords((prev) => {
          const existingIds = new Set(prev.map((w) => w.id));
          const fresh = incoming.filter((w: WordRowItem) => !existingIds.has(w.id));
          return [...prev, ...fresh];
        });
        setPage(nextPage);
        setHasMore(!!data.hasMore);
      }
    } catch (err) {
      console.warn("Failed to load more words:", err);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, loadingWords, page, range, debouncedQuery]);

  // IntersectionObserver for feed infinite scroll
  useEffect(() => {
    const target = observerTarget.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loadingWords) {
          loadMoreWords();
        }
      },
      { threshold: 0.1, rootMargin: "100px" }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, loadingWords, loadMoreWords]);

  // Refresh words (e.g. after deletion)
  const fetchWords = useCallback(async () => {
    try {
      setLoadingWords(true);
      const params = new URLSearchParams({
        range,
        page: "1",
        limit: "10",
      });
      if (debouncedQuery.trim()) {
        params.set("q", debouncedQuery.trim());
      }

      const res = await fetch(`/api/words?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setWords(data.words || []);
        setHasMore(!!data.hasMore);
        setPage(1);
        if (data.counts) {
          setCounts(data.counts);
        }
      }
    } catch (err) {
      console.warn("Failed to fetch words:", err);
    } finally {
      setLoadingWords(false);
    }
  }, [range, debouncedQuery]);

  // Instant in-memory search filtering on loaded words
  const displayedWords = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return words;
    return words.filter(
      (w) =>
        w.word.toLowerCase().includes(q) ||
        w.meaningEn.toLowerCase().includes(q)
    );
  }, [words, searchQuery]);

  // Derive active selected word ID
  const paramId = searchParams.get("selected");
  const activeSelectedId = useMemo(() => {
    if (userSelectedId && displayedWords.some((w) => w.id === userSelectedId)) {
      return userSelectedId;
    }
    if (paramId && displayedWords.some((w) => w.id === paramId)) {
      return paramId;
    }
    return displayedWords[0]?.id || null;
  }, [userSelectedId, paramId, displayedWords]);

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

  // Group words by date group label using instantly filtered words
  const groupedWords = useMemo(() => {
    const groups: { [label: string]: WordRowItem[] } = {};
    for (const w of displayedWords) {
      const label = getDateGroupLabel(w.createdAt);
      if (!groups[label]) groups[label] = [];
      groups[label].push(w);
    }
    return groups;
  }, [displayedWords]);

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
            {/* Segmented Range Tabs with bracketed counts */}
            <div className="seg full mb-2.5" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={range === "today"}
                className={range === "today" ? "on" : ""}
                onClick={() => setRange("today")}
              >
                Today <span className="num">({counts.today})</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={range === "week"}
                className={range === "week" ? "on" : ""}
                onClick={() => setRange("week")}
              >
                Week <span className="num">({counts.week})</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={range === "month"}
                className={range === "month" ? "on" : ""}
                onClick={() => setRange("month")}
              >
                Month <span className="num">({counts.month})</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={range === "all"}
                className={range === "all" ? "on" : ""}
                onClick={() => setRange("all")}
              >
                All <span className="num">({counts.all})</span>
              </button>
            </div>

            {/* Search Input with Instant Typing & Clear Button */}
            <div className="input-icon mb-1.5 relative">
              <Search className="w-4 h-4" />
              <input
                className="input pr-8"
                type="search"
                placeholder="Search words"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  type="button"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--ink-3)] hover:text-[var(--ink)] cursor-pointer"
                  onClick={() => setSearchQuery("")}
                  aria-label="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Word List Content with Loading State & Infinite Scroll */}
            {loadingWords ? (
              <div className="flex flex-col gap-2 p-2" aria-label="Loading words">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 p-3 rounded-lg bg-[var(--surface-2)]/40 animate-pulse"
                  >
                    <div className="w-2.5 h-2.5 rounded-full bg-[var(--line-strong)]" />
                    <div className="flex flex-col gap-2 grow">
                      <div className="h-4 w-28 rounded bg-[var(--line)]" />
                      <div className="h-3 w-44 rounded bg-[var(--line)]/70" />
                    </div>
                  </div>
                ))}
              </div>
            ) : displayedWords.length === 0 ? (
              <div className="p-6 text-center text-[var(--ink-3)] text-sm">
                {searchQuery
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

                {/* Infinite scroll sentinel & loader */}
                <div ref={observerTarget} className="h-4 w-full" />
                {loadingMore && (
                  <div className="flex items-center justify-center p-3 text-xs text-[var(--ink-3)] gap-2 animate-pulse">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--teal)]" />
                    <span>Loading more words…</span>
                  </div>
                )}
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
