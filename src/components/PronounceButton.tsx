"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PronounceButtonProps {
  word: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  ariaLabel?: string;
}

export function PronounceButton({
  word,
  size = "md",
  className,
  ariaLabel,
}: PronounceButtonProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const activeUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setIsSupported(false);
    }
  }, []);

  const handleSpeak = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();

      if (typeof window === "undefined" || !window.speechSynthesis) {
        return;
      }

      // Cancel any ongoing speech so new click responds instantly
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = "en-US";
      // Slightly reduced rate (0.88) ensures non-native speakers hear every syllable crisply
      utterance.rate = 0.88;
      utterance.pitch = 1.0;

      // Select highest-quality available English voice
      const voices = window.speechSynthesis.getVoices();
      const naturalVoice =
        voices.find(
          (v) =>
            v.lang.startsWith("en") &&
            /natural|google|samantha|daniel|karen|moira|guy|jenny/i.test(v.name)
        ) ||
        voices.find((v) => v.lang === "en-US") ||
        voices.find((v) => v.lang === "en-GB") ||
        voices.find((v) => v.lang.startsWith("en-")) ||
        voices.find((v) => v.lang.startsWith("en"));

      if (naturalVoice) {
        utterance.voice = naturalVoice;
      }

      utterance.onstart = () => {
        setIsPlaying(true);
      };

      utterance.onend = () => {
        setIsPlaying(false);
        activeUtteranceRef.current = null;
      };

      utterance.onerror = () => {
        setIsPlaying(false);
        activeUtteranceRef.current = null;
      };

      activeUtteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    },
    [word]
  );

  if (!isSupported) {
    return null;
  }

  const sizeClasses = {
    sm: "w-7 h-7",
    md: "w-8 h-8",
    lg: "w-9 h-9",
  };

  const iconSizes = {
    sm: "w-3.5 h-3.5",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  return (
    <button
      type="button"
      className={cn(
        "pronounce-btn group inline-flex items-center justify-center rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--teal)] cursor-pointer select-none",
        sizeClasses[size],
        isPlaying
          ? "bg-[var(--teal-soft)] text-[var(--teal)] scale-105"
          : "text-[var(--ink-3)] hover:text-[var(--teal)] hover:bg-[var(--surface-2)]",
        className
      )}
      onClick={handleSpeak}
      aria-label={ariaLabel || `Listen to pronunciation of ${word}`}
      title={`Pronounce "${word}"`}
    >
      <Volume2
        className={cn(
          iconSizes[size],
          "transition-transform",
          isPlaying ? "animate-pulse" : "group-hover:scale-110"
        )}
      />
      {isPlaying && (
        <span
          className="absolute inset-0 rounded-full bg-[var(--teal)] opacity-25 animate-ping pointer-events-none"
          style={{ animationDuration: "1.2s" }}
        />
      )}
    </button>
  );
}
