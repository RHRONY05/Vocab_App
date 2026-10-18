"use client";

import React, { useState, useEffect, useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useStats } from "@/lib/stats-context";
import { FormattedQuizQuestion } from "@/lib/quiz/select";
import { ReviewStart } from "@/components/review/ReviewStart";
import { ReviewQuestion } from "@/components/review/ReviewQuestion";
import { ReviewEnd, MissedWordItem } from "@/components/review/ReviewEnd";

type ReviewScreen = "start" | "question" | "end";

export default function ReviewPage() {
  const router = useRouter();
  const { stats, refreshStats, setActiveSession } = useStats();

  const [screen, setScreen] = useState<ReviewScreen>("start");
  const [mode, setMode] = useState<"review" | "practice">("review");
  const [practiceScope, setPracticeScope] = useState<"week" | "month" | "all" | "weak">("week");

  const [questions, setQuestions] = useState<FormattedQuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [initialTotal, setInitialTotal] = useState(0);

  // Statistics across the session
  const [firstPassCorrectCount, setFirstPassCorrectCount] = useState(0);
  const [promotedCount, setPromotedCount] = useState(0);
  const [masteredCount, setMasteredCount] = useState(0);
  const [missedWords, setMissedWords] = useState<MissedWordItem[]>([]);
  const [retryQueue, setRetryQueue] = useState<FormattedQuizQuestion[]>([]);
  const [remainingDue, setRemainingDue] = useState(0);

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [, startTransition] = useTransition();

  // Reset session active state when not on question screen
  useEffect(() => {
    if (screen !== "question") {
      setActiveSession(null);
    }
  }, [screen, setActiveSession]);

  // Sync mobile header active review session
  useEffect(() => {
    if (screen === "question" && questions.length > 0) {
      setActiveSession({
        current: currentIndex + 1,
        total: questions.length,
        progress: Math.min(100, Math.round(((currentIndex + 1) / questions.length) * 100)),
        onEnd: () => {
          setScreen("end");
          setActiveSession(null);
        },
      });
    }
  }, [screen, currentIndex, questions.length, setActiveSession]);

  const handleStartReview = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/quiz?mode=review");
      if (res.ok) {
        const data = await res.json();
        if (data.questions && data.questions.length > 0) {
          setMode("review");
          setQuestions(data.questions);
          setInitialTotal(data.questions.length);
          setCurrentIndex(0);
          setFirstPassCorrectCount(0);
          setPromotedCount(0);
          setMasteredCount(0);
          setMissedWords([]);
          setRetryQueue([]);
          setRemainingDue(data.remainingDue || 0);
          setScreen("question");
        }
      }
    } catch (err) {
      console.error("Failed to start review session:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleStartPractice = useCallback(
    async (scope: "week" | "month" | "all" | "weak", size: 5 | 10 | 20) => {
      try {
        setLoading(true);
        const res = await fetch(`/api/quiz?mode=practice&scope=${scope}&size=${size}`);
        if (res.ok) {
          const data = await res.json();
          if (data.questions && data.questions.length > 0) {
            setMode("practice");
            setPracticeScope(scope);
            setQuestions(data.questions);
            setInitialTotal(data.questions.length);
            setCurrentIndex(0);
            setFirstPassCorrectCount(0);
            setPromotedCount(0);
            setMasteredCount(0);
            setMissedWords([]);
            setRetryQueue([]);
            setRemainingDue(0);
            setScreen("question");
          }
        }
      } catch (err) {
        console.error("Failed to start practice session:", err);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Keyboard shortcut on start screen (Enter to start daily review)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (screen === "start" && e.key === "Enter") {
        if ((stats.dueNow || 0) > 0) {
          e.preventDefault();
          handleStartReview();
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [screen, stats.dueNow, handleStartReview]);

  const handleAnswer = useCallback(
    async (isCorrect: boolean) => {
      const currentQ = questions[currentIndex];
      if (!currentQ) return;

      try {
        setSubmitting(true);
        const res = await fetch("/api/quiz/answer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            wordId: currentQ.wordId,
            kind: currentQ.kind,
            mode,
            correct: isCorrect,
            isRepeat: !!currentQ.isRetry,
          }),
        });

        if (res.ok) {
          const body = await res.json();
          // Update session statistics for initial pass
          if (!currentQ.isRetry) {
            if (isCorrect) {
              setFirstPassCorrectCount((prev) => prev + 1);
              if (body.box > body.previousBox) {
                setPromotedCount((prev) => prev + 1);
              }
              if (body.status === "mastered" && body.previousBox < 4) {
                setMasteredCount((prev) => prev + 1);
              }
            } else {
              // Word was answered wrong -> add to missed words and retry queue
              setMissedWords((prev) => {
                if (prev.some((m) => m.id === currentQ.wordId)) return prev;
                return [
                  ...prev,
                  {
                    id: currentQ.wordId,
                    word: currentQ.word,
                    partOfSpeech: currentQ.recall?.partOfSpeech || "word",
                    meaningEn: currentQ.explanation,
                  },
                ];
              });

              setRetryQueue((prev) => [
                ...prev,
                {
                  ...currentQ,
                  isRetry: true,
                },
              ]);
            }
          }
          // Refresh global stats in background
          startTransition(() => {
            refreshStats();
          });
        }
      } catch (err) {
        console.error("Failed to submit quiz answer:", err);
      } finally {
        setSubmitting(false);
      }
    },
    [questions, currentIndex, mode, refreshStats]
  );

  const handleNextQuestion = useCallback(() => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1);
    } else if (retryQueue.length > 0) {
      // Append end-of-session retries
      setQuestions((prev) => [...prev, ...retryQueue]);
      setRetryQueue([]);
      setCurrentIndex((prev) => prev + 1);
    } else {
      // Session finished
      setScreen("end");
      setActiveSession(null);
    }
  }, [currentIndex, questions.length, retryQueue, setActiveSession]);

  const handleEndSession = useCallback(() => {
    setScreen("end");
    setActiveSession(null);
  }, [setActiveSession]);

  const currentQ = questions[currentIndex];

  const getSessionTitle = () => {
    if (mode === "review") return "Daily review";
    const scopeLabels: Record<string, string> = {
      week: "This week",
      month: "This month",
      all: "All words",
      weak: "Weak words",
    };
    return `Practice · ${scopeLabels[practiceScope] || "Custom"}`;
  };

  return (
    <div className="flex-1 w-full flex flex-col items-center justify-start px-4 md:px-6">
      {screen === "start" && (
        <ReviewStart
          onStartReview={handleStartReview}
          onStartPractice={handleStartPractice}
          loading={loading}
        />
      )}

      {screen === "question" && currentQ && (
        <ReviewQuestion
          key={`${currentQ.wordId}_${currentIndex}_${currentQ.isRetry ? "retry" : "orig"}`}
          question={currentQ}
          currentIndex={currentIndex}
          totalQuestions={questions.length}
          sessionTitle={getSessionTitle()}
          onAnswer={handleAnswer}
          onNext={handleNextQuestion}
          onEndSession={handleEndSession}
          submitting={submitting}
        />
      )}

      {screen === "end" && (
        <ReviewEnd
          correctCount={firstPassCorrectCount}
          totalInitialQuestions={initialTotal || questions.length}
          promotedCount={promotedCount}
          masteredCount={masteredCount}
          missedWords={missedWords}
          remainingDue={remainingDue}
          onContinueReview={handleStartReview}
          onPracticeMore={() => setScreen("start")}
          onBackToLearn={() => router.push("/")}
        />
      )}
    </div>
  );
}
