"use client";

import React, { useState, useEffect, use, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Trash2, Calendar } from "lucide-react";
import { WordCard } from "@/components/WordCard";
import { WordStats } from "@/components/WordStats";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import { useStats } from "@/lib/stats-context";
import { showDeletedToast } from "@/lib/toast";
import { WordDetailData } from "../page";

function formatSavedDate(dateStr?: string): string {
  if (!dateStr) return "recently";
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

function WordDetailContent({ id }: { id: string }) {
  const router = useRouter();
  const { refreshStats } = useStats();

  const [data, setData] = useState<WordDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let isCurrent = true;
    async function loadWord() {
      try {
        const res = await fetch(`/api/words/${id}`);
        if (!res.ok) {
          if (isCurrent) setError(true);
          return;
        }
        const json = await res.json();
        if (isCurrent) {
          setData(json);
        }
      } catch {
        if (isCurrent) setError(true);
      } finally {
        if (isCurrent) setLoading(false);
      }
    }

    loadWord();
    return () => {
      isCurrent = false;
    };
  }, [id]);

  const handleDelete = async () => {
    if (!data) return;
    const wordToDelete = data.card.word;

    try {
      setIsDeleting(true);
      const res = await fetch(`/api/words/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        showDeletedToast(wordToDelete);
        setDeleteOpen(false);
        refreshStats();
        router.push("/words");
      }
    } catch (err) {
      console.error("Failed to delete word:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-[var(--ink-3)]">
        Loading…
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 gap-3 text-center">
        <p className="text-[var(--ink-2)]">Word not found.</p>
        <Link href="/words" className="btn btn-secondary btn-sm">
          Back to words
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full">
      {/* Mobile Header (matches mobile/04-word-detail.html) */}
      <header className="m-header md:hidden" style={{ paddingLeft: 4 }}>
        <button
          type="button"
          className="icon-btn"
          aria-label="Back to words"
          onClick={() => router.push("/words")}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="grow">Words</h1>
        <button
          type="button"
          className="icon-btn"
          aria-label="Delete word"
          style={{ color: "var(--danger-text)" }}
          onClick={() => setDeleteOpen(true)}
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </header>

      {/* Desktop breadcrumb / back link */}
      <div className="hidden md:flex items-center gap-2 max-w-2xl mx-auto w-full pt-6 px-4">
        <Link
          href={`/words?selected=${id}`}
          className="btn btn-ghost btn-sm text-[var(--ink-2)] hover:text-[var(--ink)]"
        >
          <ChevronLeft className="w-4 h-4 mr-1 inline" />
          Back to words
        </Link>
      </div>

      {/* Main Content */}
      <main className="flex-1 p-[14px_12px_20px] md:p-6 flex flex-col max-w-2xl mx-auto w-full">
        {/* WordStats compact strip */}
        <WordStats
          status={data.status}
          box={data.box}
          nextReviewAt={data.nextReviewAt}
          lookupCount={data.lookupCount}
          correctCount={data.correctCount}
          wrongCount={data.wrongCount}
          createdAt={data.createdAt}
          compact={true}
        />

        {/* WordCard compact with footer */}
        <div className="relative">
          <WordCard
            card={data.card}
            saved={{
              id: data.id,
              lookupCount: data.lookupCount,
              box: data.box,
              createdAt: data.createdAt,
            }}
            isSaved={true}
            hideSaveButton={true}
            compact={true}
          />
          <div className="px-6 py-3 border-t border-[var(--line)] bg-[var(--surface)] rounded-b-2xl -mt-2 text-xs text-[var(--ink-3)] flex items-center gap-1.5">
            <Calendar className="i-sm w-3.5 h-3.5" />
            <span>Saved {formatSavedDate(data.createdAt)}</span>
          </div>
        </div>
      </main>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={deleteOpen}
        word={data.card.word}
        isDeleting={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
      />
    </div>
  );
}

function WordDetailWrapper({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <WordDetailContent id={id} />;
}

export default function WordDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center p-8 text-[var(--ink-3)]">
          Loading…
        </div>
      }
    >
      <WordDetailWrapper params={params} />
    </Suspense>
  );
}
