"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import { CircleAlert } from "lucide-react";
import { WordCard } from "./WordCard";
import { WordCard as WordCardType } from "@/lib/schemas";
import { AiAvatar } from "./AiAvatar";

export type ChatMessage =
  | {
      id: string;
      role: "user";
      text: string;
    }
  | {
      id: string;
      role: "assistant";
      type: "word";
      card: WordCardType;
      source: "ai" | "saved";
      saved: {
        id: string;
        lookupCount: number;
        box: number;
        createdAt: string;
      } | null;
      repeatCounted: boolean;
      isSaved?: boolean;
      saving?: boolean;
      saveStatus?: "created" | "updated" | null;
    }
  | {
      id: string;
      role: "assistant";
      type: "reply";
      text: string;
      currentWord?: string;
    };

export interface MessageListProps {
  messages: ChatMessage[];
  showBangla: boolean;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  onSaveWord?: (card: WordCardType, messageId: string) => void;
  onLookup?: (word: string) => void;
}

export function MessageList({
  messages,
  showBangla,
  loading = false,
  error = null,
  onRetry,
  onSaveWord,
  onLookup,
}: MessageListProps) {
  return (
    <div className="page thread flex flex-col gap-4 w-full max-w-[760px] mx-auto pt-6 md:pt-10 pb-32">
      {messages.map((msg) => {
        if (msg.role === "user") {
          return (
            <div key={msg.id} className="bubble-user">
              {msg.text}
            </div>
          );
        }

        if (msg.type === "word") {
          return (
            <div key={msg.id} className="flex flex-col gap-1.5 w-full">
              <div className="flex items-center gap-2 text-xs font-semibold text-[var(--teal)] pl-1">
                <AiAvatar size="sm" />
                <span>Vocab AI</span>
              </div>
              <WordCard
                card={msg.card}
                showBangla={showBangla}
                saved={msg.saved}
                repeatCounted={msg.repeatCounted}
                isSaved={msg.isSaved}
                saving={msg.saving}
                saveStatus={msg.saveStatus}
                onSave={(card) => onSaveWord?.(card, msg.id)}
                onLookupSuggestion={onLookup}
              />
            </div>
          );
        }

        if (msg.type === "reply") {
          return (
            <div key={msg.id} className="bubble-reply">
              <div className="who">
                <AiAvatar size="sm" />
                <span>Reply {msg.currentWord ? `· ${msg.currentWord}` : ""}</span>
              </div>
              <div className="reply-content">
                <ReactMarkdown>{msg.text}</ReactMarkdown>
              </div>
            </div>
          );
        }

        return null;
      })}

      {loading && (
        <div className="flex flex-col gap-2 w-full animate-pulse" aria-label="Loading card">
          <div className="flex items-center gap-2 text-xs font-semibold text-[var(--teal)] pl-1">
            <AiAvatar size="sm" />
            <span>Vocab AI is thinking…</span>
          </div>
          <article className="card wc w-full">
            <div className="wc-head">
              <div className="grow flex flex-col gap-2">
                <div className="sk h-8 w-36 rounded-md" />
                <div className="flex gap-2">
                  <div className="sk h-5 w-16 rounded-full" />
                  <div className="sk h-5 w-14 rounded-full" />
                </div>
              </div>
              <div className="sk h-9 w-24 rounded-lg" />
            </div>
            <div className="sk h-5 w-4/5 rounded my-3" />
            <div className="sk h-5 w-1/2 rounded mb-5" />
            <div className="flex flex-col gap-4">
              <div className="sk h-16 w-full rounded-md" />
              <div className="sk h-12 w-full rounded-md" />
            </div>
          </article>
        </div>
      )}

      {error && (
        <div className="banner banner-danger flex items-center justify-between" role="alert">
          <div className="flex items-center gap-2">
            <CircleAlert className="i-sm w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          {onRetry && (
            <button
              type="button"
              className="btn btn-ghost btn-sm text-[var(--danger-text)] font-medium"
              onClick={onRetry}
            >
              Retry
            </button>
          )}
        </div>
      )}
    </div>
  );
}
