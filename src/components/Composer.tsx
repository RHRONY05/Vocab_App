"use client";

import React, { useRef, useEffect } from "react";
import { ArrowUp, SquarePen } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ComposerProps {
  value: string;
  onChange: (val: string) => void;
  onSubmit: () => void;
  loading?: boolean;
  showBangla: boolean;
  onToggleBangla: (show: boolean) => void;
  onNewChat: () => void;
  onSaveLatest?: () => void;
  inputPlaceholder?: string;
}

export function Composer({
  value,
  onChange,
  onSubmit,
  loading = false,
  showBangla,
  onToggleBangla,
  onNewChat,
  onSaveLatest,
  inputPlaceholder = "Look up a word, or ask about the current one…",
}: ComposerProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Don't trigger shortcuts if focus is in an input or textarea (unless Escape)
      const target = e.target as HTMLElement | null;
      const isInput =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable);

      if (e.key === "/" && !isInput) {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }

      if (e.key === "Escape") {
        if (isInput) {
          inputRef.current?.blur();
        }
      }

      if ((e.ctrlKey || e.metaKey) && (e.key === "s" || e.key === "S")) {
        e.preventDefault();
        onSaveLatest?.();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onSaveLatest]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!value.trim() || loading) return;
    onSubmit();
  }

  const isBlank = !value.trim();

  return (
    <div className="composer-wrap">
      <form onSubmit={handleSubmit} className="composer focus-within:ring-0">
        <input
          ref={inputRef}
          type="text"
          className="bg-transparent border-none outline-none grow text-inherit placeholder-[var(--ink-4)] focus:outline-none"
          placeholder={inputPlaceholder}
          aria-label="Look up a word"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={loading}
          autoFocus
        />
        <button
          type="submit"
          className={cn("send", (isBlank || loading) && "idle")}
          aria-label="Send"
          disabled={isBlank || loading}
        >
          <ArrowUp className="w-4 h-4" />
        </button>
      </form>

      <div className="composer-meta">
        <label
          className={cn("switch", showBangla && "on")}
          role="switch"
          aria-checked={showBangla}
          tabIndex={0}
          onClick={(e) => {
            e.preventDefault();
            onToggleBangla(!showBangla);
          }}
          onKeyDown={(e) => {
            if (e.key === " " || e.key === "Enter") {
              e.preventDefault();
              onToggleBangla(!showBangla);
            }
          }}
        >
          <i aria-hidden="true" />
          <span>Bangla</span>
        </label>

        <button
          type="button"
          className="btn btn-ghost btn-sm hidden md:inline-flex"
          onClick={onNewChat}
        >
          <SquarePen className="i-sm w-4 h-4" />
          New chat
        </button>

        <span className="hint hidden md:inline">
          <kbd>/</kbd> focus <kbd>Enter</kbd> send <kbd>Ctrl S</kbd> save
        </span>
      </div>
    </div>
  );
}
