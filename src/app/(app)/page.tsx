"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  useSyncExternalStore,
  Suspense,
} from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowRight, BookmarkCheck, Repeat2 } from "lucide-react";
import { Illustration } from "@/components/illustrations";
import { MessageList, ChatMessage } from "@/components/MessageList";
import { Composer } from "@/components/Composer";
import { WordCard as WordCardType } from "@/lib/schemas";

function subscribe() {
  return () => {};
}

function LearnPageContent() {
  const searchParams = useSearchParams();
  const isClient = useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFailedInput, setLastFailedInput] = useState<string | null>(null);
  const [showBangla, setShowBangla] = useState<boolean>(true);

  useEffect(() => {
    try {
      const storedBangla = localStorage.getItem("vocab_bangla");
      if (storedBangla !== null) {
        setTimeout(() => {
          setShowBangla(storedBangla === "true");
        }, 0);
      }

      const storedChat = localStorage.getItem("vocab_chat");
      if (storedChat) {
        const parsed = JSON.parse(storedChat);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setTimeout(() => {
            setMessages(parsed);
          }, 0);
        }
      }
    } catch (e) {
      console.warn("Could not read from localStorage:", e);
    }
  }, []);

  const [stats, setStats] = useState<{
    savedToday: number;
    total: number;
    dueNow: number;
  }>({ savedToday: 0, total: 0, dueNow: 0 });
  const [recentWords, setRecentWords] = useState<string[]>([]);

  // Fetch quick stats and recently saved words (gracefully handled if V4 API not yet built)
  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/words/stats");
        if (res.ok) {
          const data = await res.json();
          setStats({
            savedToday: data.savedToday ?? 0,
            total: data.total ?? 0,
            dueNow: data.dueNow ?? 0,
          });
        }
      } catch {
        // Stats API will be fully functional in V4
      }

      try {
        const res = await fetch("/api/words?range=all&page=1");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.words)) {
            setRecentWords(data.words.slice(0, 4).map((w: { word: string }) => w.word));
          }
        }
      } catch {
        // Words API will be fully functional in V4
      }
    }

    fetchStats();
  }, []);

  // Sync chat to localStorage (limit to last 20 messages)
  const saveMessagesToStorage = useCallback((updated: ChatMessage[]) => {
    try {
      const trimmed = updated.slice(-20);
      localStorage.setItem("vocab_chat", JSON.stringify(trimmed));
    } catch (e) {
      console.warn("Could not write chat to localStorage:", e);
    }
  }, []);

  const handleToggleBangla = (val: boolean) => {
    setShowBangla(val);
    try {
      localStorage.setItem("vocab_bangla", String(val));
    } catch (e) {
      console.warn("Could not save bangla preference:", e);
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setError(null);
    try {
      localStorage.removeItem("vocab_chat");
    } catch (e) {
      console.warn("Could not clear chat:", e);
    }
  };

  // Derive latest word for context
  const currentWord = [...messages]
    .reverse()
    .find(
      (m): m is Extract<ChatMessage, { type: "word" }> =>
        m.role === "assistant" && m.type === "word"
    )?.card.word;

  const handleLookup = useCallback(
    async (textToLookup?: string) => {
      const query = (textToLookup || input).trim();
      if (!query || loading) return;

      setInput("");
      setError(null);
      setLastFailedInput(null);
      setLoading(true);

      const userMsg: ChatMessage = {
        id: `user-${Date.now()}-${Math.random()}`,
        role: "user",
        text: query,
      };

      const newMessages = [...messages, userMsg];
      setMessages(newMessages);

      try {
        const res = await fetch("/api/lookup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            input: query,
            currentWord,
          }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || "lookup_failed");
        }

        const data = await res.json();

        let assistantMsg: ChatMessage;
        if (data.type === "word") {
          assistantMsg = {
            id: `assistant-${Date.now()}-${Math.random()}`,
            role: "assistant",
            type: "word",
            card: data.card,
            source: data.source,
            saved: data.saved,
            repeatCounted: data.repeatCounted,
            isSaved: !!data.saved,
          };
        } else {
          assistantMsg = {
            id: `assistant-${Date.now()}-${Math.random()}`,
            role: "assistant",
            type: "reply",
            text: data.text,
            currentWord,
          };
        }

        const updated = [...newMessages, assistantMsg];
        setMessages(updated);
        saveMessagesToStorage(updated);
      } catch (err) {
        console.error("Lookup error:", err);
        setError("AI unavailable. Please try again.");
        setLastFailedInput(query);
      } finally {
        setLoading(false);
      }
    },
    [currentWord, input, loading, messages, saveMessagesToStorage]
  );

  // Handle URL query parameter `?q=` on mount
  useEffect(() => {
    const q = searchParams.get("q");
    if (q && q.trim()) {
      const timer = setTimeout(() => {
        handleLookup(q.trim());
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [searchParams, handleLookup]);

  const handleSaveWord = async (card: WordCardType, messageId: string) => {
    // Optimistically update message state
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId && msg.role === "assistant" && msg.type === "word"
          ? { ...msg, isSaved: true, saveStatus: "created" }
          : msg
      )
    );

    try {
      const res = await fetch("/api/words", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ card }),
      });
      if (res.ok) {
        const data = await res.json();
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === messageId && msg.role === "assistant" && msg.type === "word"
              ? {
                  ...msg,
                  isSaved: true,
                  saveStatus: data.status,
                  saved: {
                    id: data.id,
                    lookupCount: 1,
                    box: 0,
                    createdAt: new Date().toISOString(),
                  },
                }
              : msg
          )
        );
      }
    } catch {
      // V4 will wire the full API
    }
  };

  const handleRetry = () => {
    if (lastFailedInput) {
      handleLookup(lastFailedInput);
    }
  };

  const handleSaveLatest = () => {
    const latestWordMsg = [...messages]
      .reverse()
      .find(
        (m): m is Extract<ChatMessage, { type: "word" }> =>
          m.role === "assistant" && m.type === "word" && !m.isSaved
      );

    if (latestWordMsg) {
      handleSaveWord(latestWordMsg.card, latestWordMsg.id);
    }
  };

  // Minutes needed for due review: ceil(min(dueNow, 15) * 25s / 60)
  const reviewMinutes = Math.max(
    1,
    Math.ceil((Math.min(stats.dueNow, 15) * 25) / 60)
  );

  return (
    <div className="relative min-h-[calc(100vh-64px)] flex flex-col justify-between">
      {/* Thread content */}
      <div className="w-full grow flex flex-col items-center justify-center p-4 md:p-8">
        {messages.length === 0 ? (
          /* Empty State (D03 / M03) */
          <div className="page flex flex-col items-center text-center gap-3.5 max-w-[560px] py-12 md:py-20 animate-fade-in">
            <Illustration name="book-sprout" size="default" />
            <h1 className="serif text-[34px] leading-[42px] font-semibold tracking-[-0.015em]">
              Met a new word?
            </h1>
            <p className="hint text-[16px] leading-[26px]">
              Type it below. You&apos;ll get the meaning, how people really use
              it, and real examples.
            </p>

            {(stats.total > 0 || stats.dueNow > 0) && (
              <div className="flex flex-wrap items-center justify-center gap-3 mt-5">
                <div className="card flex items-center gap-3 px-4.5 py-3.5 text-left">
                  <BookmarkCheck
                    className="w-5 h-5 shrink-0"
                    style={{ color: "var(--success)" }}
                  />
                  <div>
                    <div className="font-semibold text-sm">
                      {stats.savedToday} saved today
                    </div>
                    <div className="hint text-xs">
                      {stats.total} words in total
                    </div>
                  </div>
                </div>

                {stats.dueNow > 0 && (
                  <Link
                    href="/review"
                    className="card flex items-center gap-3 px-4.5 py-3.5 text-left no-underline text-inherit hover:border-[var(--line-strong)]"
                  >
                    <Repeat2
                      className="w-5 h-5 shrink-0"
                      style={{ color: "var(--accent-text)" }}
                    />
                    <div>
                      <div className="font-semibold text-sm">
                        {stats.dueNow} due for review
                      </div>
                      <div className="hint text-xs">
                        About {reviewMinutes} {reviewMinutes === 1 ? "minute" : "minutes"}
                      </div>
                    </div>
                    <ArrowRight className="i-sm w-4 h-4 ml-1.5 text-[var(--ink-3)]" />
                  </Link>
                )}
              </div>
            )}

            {recentWords.length > 0 && (
              <div className="flex flex-col items-center gap-2 mt-4.5">
                <span className="label">Recently saved</span>
                <div className="flex flex-wrap items-center justify-center gap-1.5">
                  {recentWords.map((word) => (
                    <button
                      key={word}
                      type="button"
                      className="chip chip-outline cursor-pointer hover:bg-[var(--surface-2)]"
                      onClick={() => handleLookup(word)}
                    >
                      {word}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Conversation Thread (D02 / M02) */
          <MessageList
            messages={messages}
            showBangla={showBangla}
            loading={loading}
            error={error}
            onRetry={handleRetry}
            onSaveWord={handleSaveWord}
            onLookup={handleLookup}
          />
        )}
      </div>

      {/* Floating Composer */}
      {isClient && (
        <Composer
          value={input}
          onChange={setInput}
          onSubmit={() => handleLookup()}
          loading={loading}
          showBangla={showBangla}
          onToggleBangla={handleToggleBangla}
          onNewChat={handleNewChat}
          onSaveLatest={handleSaveLatest}
        />
      )}
    </div>
  );
}

export default function LearnPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <LearnPageContent />
    </Suspense>
  );
}
