"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Brain,
  Check,
  CheckCheck,
  ListChecks,
  TextCursorInput,
  X,
} from "lucide-react";
import { FormattedQuizQuestion } from "@/lib/quiz/select";
import { WordDetailModal } from "./WordDetailModal";
import { WordCard } from "@/lib/schemas";
import { PronounceButton } from "@/components/PronounceButton";

interface ReviewQuestionProps {
  question: FormattedQuizQuestion;
  currentIndex: number;
  totalQuestions: number;
  sessionTitle: string;
  onAnswer: (correct: boolean) => Promise<void>;
  onNext: () => void;
  onEndSession: () => void;
  submitting?: boolean;
}

export function ReviewQuestion({
  question,
  currentIndex,
  totalQuestions,
  sessionTitle,
  onAnswer,
  onNext,
  onEndSession,
  submitting = false,
}: ReviewQuestionProps) {
  // MCQ state
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);

  // Recall state
  const [revealed, setRevealed] = useState(false);

  // Modal state
  const [showWordModal, setShowWordModal] = useState(false);
  const [showBangla] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("vocab_show_bangla");
      return stored !== "false";
    }
    return true;
  });

  const handleSelectOption = useCallback(
    async (index: number) => {
      if (answered || submitting) return;
      setSelectedOption(index);
      setAnswered(true);
      const isCorrect = index === question.answerIndex;
      await onAnswer(isCorrect);
    },
    [answered, submitting, question.answerIndex, onAnswer]
  );

  const handleRecallAnswer = useCallback(
    async (knewIt: boolean) => {
      if (answered || submitting) return;
      setAnswered(true);
      await onAnswer(knewIt);
      onNext();
    },
    [answered, submitting, onAnswer, onNext]
  );

  // Keyboard shortcut listener
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Ignore if typing in an input or dialog is open
      if (showWordModal) return;

      if (question.kind === "recall") {
        if (!revealed) {
          if (e.code === "Space" || e.key === "Enter") {
            e.preventDefault();
            setRevealed(true);
          }
        } else {
          // Revealed
          if (e.key === "1") {
            e.preventDefault();
            handleRecallAnswer(false);
          } else if (e.key === "2") {
            e.preventDefault();
            handleRecallAnswer(true);
          }
        }
      } else {
        // MCQ
        if (!answered) {
          if (["1", "2", "3", "4"].includes(e.key)) {
            e.preventDefault();
            const idx = parseInt(e.key, 10) - 1;
            if (idx >= 0 && idx < question.options.length) {
              handleSelectOption(idx);
            }
          }
        } else {
          // Answered
          if (e.key === "Enter" || e.code === "Space") {
            e.preventDefault();
            onNext();
          }
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    showWordModal,
    question.kind,
    question.options.length,
    revealed,
    answered,
    handleSelectOption,
    handleRecallAnswer,
    onNext,
  ]);

  const progressPercent = Math.min(
    100,
    Math.round(((currentIndex + 1) / totalQuestions) * 100)
  );

  const renderKindIcon = () => {
    switch (question.kind) {
      case "meaning":
        return <ListChecks className="i-sm w-4 h-4 inline-block mr-1.5" />;
      case "fill_blank":
        return <TextCursorInput className="i-sm w-4 h-4 inline-block mr-1.5" />;
      case "usage":
        return <CheckCheck className="i-sm w-4 h-4 inline-block mr-1.5" />;
      case "recall":
        return <Brain className="i-sm w-4 h-4 inline-block mr-1.5" />;
    }
  };

  const renderKindTitle = () => {
    switch (question.kind) {
      case "meaning":
        return "Meaning";
      case "fill_blank":
        return "Fill in the blank";
      case "usage":
        return "Usage";
      case "recall":
        return "Recall";
    }
  };

  const renderPrompt = () => {
    if (question.kind === "fill_blank") {
      const parts = question.prompt.split(/_{2,}/);
      if (parts.length > 1) {
        return (
          <span>
            {parts.map((part, i) => (
              <React.Fragment key={i}>
                {part}
                {i < parts.length - 1 && <span className="blank" />}
              </React.Fragment>
            ))}
          </span>
        );
      }
    }
    return <span>{question.prompt}</span>;
  };

  return (
    <div className="w-full max-w-[680px] mx-auto flex flex-col gap-4.5 py-6 md:py-9 animate-fade-in">
      {/* Desktop Session Progress Header (D06 / D07) */}
      <div className="hidden md:flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2.5 text-sm font-semibold">
            {sessionTitle}{" "}
            <span className="hint num font-normal">
              {currentIndex + 1} of {totalQuestions}
            </span>
          </span>
          <button
            className="btn btn-ghost btn-sm"
            onClick={onEndSession}
          >
            <X className="i-sm w-4 h-4 mr-1" />
            End session
          </button>
        </div>
        <div className="bar">
          <i style={{ width: `${progressPercent}%` }} />
        </div>
      </div>

      {/* Main Question Card */}
      {question.kind === "recall" ? (
        /* Recall Card (D07 / M07) */
        <section className="card p-6 md:p-8 text-center flex flex-col items-center">
          <div className="w-full flex items-center justify-between mb-2">
            <span className="label qkind flex items-center">
              {renderKindIcon()}
              {renderKindTitle()}
            </span>
            {question.isRetry && (
              <span className="chip chip-outline text-xs px-2 py-0.5">Retry</span>
            )}
          </div>

          <div className="flex items-center justify-center gap-2.5 mt-3.5 mb-1">
            <h2 className="headword text-[40px] md:text-[48px] leading-[48px] md:leading-[56px] font-serif font-bold">
              {question.word}
            </h2>
            <PronounceButton word={question.word} size="lg" />
          </div>
          <div className="wc-meta justify-center mb-4">
            <span className="chip">{question.recall?.partOfSpeech || "word"}</span>
          </div>

          {!revealed ? (
            /* Unrevealed state */
            <div className="flex flex-col items-center gap-6 mt-4 w-full">
              <p className="hint text-[15px] max-w-[280px]">
                Say the meaning in your head, then check.
              </p>
              <button
                className="btn btn-primary btn-lg w-full md:w-auto min-w-[200px]"
                onClick={() => setRevealed(true)}
              >
                Show answer <kbd className="hidden md:inline-flex">Space</kbd>
              </button>
            </div>
          ) : (
            /* Revealed state */
            <div className="w-full flex flex-col text-left mt-6 pt-5 border-t border-[var(--line)] animate-fade-in">
              <p className="meaning text-[17px] leading-[26px] m-0 text-[var(--ink)]">
                {question.explanation}
              </p>
              {showBangla && question.recall?.meaningBn && (
                <p className="bangla text-[16px] leading-[24px] mt-2.5 text-[var(--bangla)]">
                  <span className="tag mr-2 text-xs font-semibold px-1.5 py-0.5 rounded bg-[var(--bangla-tag)] text-[var(--bangla)]">
                    বাংলা
                  </span>
                  {question.recall.meaningBn}
                </p>
              )}
              {question.recall?.example && (
                <p className="mt-3.5 text-[15px] leading-[22px] text-[var(--ink-2)] italic">
                  “{question.recall.example}”
                </p>
              )}

              <div className="flex flex-col items-center gap-3.5 mt-8 pt-4 border-t border-[var(--line)]">
                <span className="hint text-sm">Did you remember it?</span>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full">
                  <button
                    className="btn btn-danger-soft btn-lg w-full sm:min-w-[180px]"
                    onClick={() => handleRecallAnswer(false)}
                    disabled={submitting}
                  >
                    <X className="i-sm w-4 h-4 mr-1.5" />
                    I didn&apos;t know <kbd className="hidden md:inline-flex">1</kbd>
                  </button>
                  <button
                    className="btn btn-success-soft btn-lg w-full sm:min-w-[180px]"
                    onClick={() => handleRecallAnswer(true)}
                    disabled={submitting}
                  >
                    <Check className="i-sm w-4 h-4 mr-1.5" />
                    I knew it <kbd className="hidden md:inline-flex">2</kbd>
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>
      ) : (
        /* Multiple Choice Question Card (D06 / M06) */
        <section className="card p-6 md:p-8 flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <span className="label qkind flex items-center">
              {renderKindIcon()}
              {renderKindTitle()}
            </span>
            {question.isRetry && (
              <span className="chip chip-outline text-xs px-2 py-0.5">Retry</span>
            )}
          </div>

          <p className="prompt text-lg md:text-xl font-normal leading-relaxed my-3 mb-6">
            {renderPrompt()}
          </p>

          <div className="options flex flex-col gap-2 md:gap-2.5">
            {question.options.map((opt, i) => {
              let optionClass = "option";
              if (answered) {
                if (i === question.answerIndex) {
                  optionClass += " correct";
                } else if (i === selectedOption) {
                  optionClass += " wrong";
                } else {
                  optionClass += " dim";
                }
              }

              return (
                <button
                  key={i}
                  type="button"
                  className={optionClass}
                  onClick={() => handleSelectOption(i)}
                  disabled={answered || submitting}
                >
                  <span className="key">{i + 1}</span>
                  <span className="grow text-left">{opt}</span>
                  {answered && i === question.answerIndex && (
                    <Check className="mk w-5 h-5 ml-2 text-[var(--success)] shrink-0" />
                  )}
                  {answered && i === selectedOption && i !== question.answerIndex && (
                    <X className="mk w-5 h-5 ml-2 text-[var(--danger)] shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {answered && (
            <div className="explain mt-4.5 p-3.5 bg-[var(--surface-2)] border border-[var(--line)] rounded-[var(--radius-md)] text-sm leading-relaxed animate-fade-in flex items-center gap-2 flex-wrap">
              <div className="inline-flex items-center gap-1 font-bold">
                <span className="capitalize">{question.word}:</span>
                <PronounceButton word={question.word} size="sm" />
              </div>
              <span>{question.explanation}</span>
              <button
                type="button"
                onClick={() => setShowWordModal(true)}
                className="text-[var(--accent-text)] font-semibold hover:underline ml-1.5 inline-block cursor-pointer"
              >
                Open word →
              </button>
            </div>
          )}

          {/* Bottom Actions Row */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-[var(--line)]">
            {!answered ? (
              <span className="hint flex items-center gap-1.5 text-xs hidden md:flex">
                <kbd>1</kbd>–<kbd>4</kbd> choose answer
              </span>
            ) : (
              <div className="w-full flex justify-end">
                <button
                  className="btn btn-primary btn-lg w-full md:w-auto"
                  onClick={onNext}
                >
                  Next <kbd className="hidden md:inline-flex">Enter</kbd>
                </button>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Word Detail Modal */}
      {showWordModal && (
        <WordDetailModal
          wordId={question.wordId}
          initialCard={
            (question as unknown as { card?: WordCard }).card
          }
          showBangla={showBangla}
          onClose={() => setShowWordModal(false)}
        />
      )}
    </div>
  );
}
