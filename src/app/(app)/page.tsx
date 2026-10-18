"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowRight, ArrowUp, BookmarkCheck, Repeat2 } from "lucide-react";
import { Illustration } from "@/components/illustrations";
import { Switch, Kbd } from "@/components/ui";

export default function LearnPage() {
  const [banglaOn, setBanglaOn] = useState(true);
  const [input, setInput] = useState("");

  return (
    <div className="flex-1 flex flex-col justify-between">
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
        <div className="page flex flex-col items-center text-center gap-3.5 max-w-[560px]">
          <Illustration name="book-sprout" />
          <h1 className="serif text-[34px] leading-[42px] font-semibold tracking-[-0.015em]">
            Met a new word?
          </h1>
          <p className="muted text-base leading-[26px]">
            Type it below. You&apos;ll get the meaning, how people really use it, and real examples.
          </p>

          <div className="row gap-3 mt-5 flex-wrap justify-center">
            <div className="card row gap-3 px-4.5 py-3.5 text-left">
              <BookmarkCheck className="w-5 h-5 text-[var(--success)]" />
              <div>
                <div className="font-semibold">0 saved today</div>
                <div className="hint">0 words in total</div>
              </div>
            </div>

            <Link
              href="/review"
              className="card row gap-3 px-4.5 py-3.5 text-left hover:bg-[var(--surface-2)] transition-colors"
            >
              <Repeat2 className="w-5 h-5 text-[var(--accent-text)]" />
              <div>
                <div className="font-semibold">0 due for review</div>
                <div className="hint">All caught up</div>
              </div>
              <ArrowRight className="w-4 h-4 text-[var(--ink-3)] ml-1.5" />
            </Link>
          </div>
        </div>
      </div>

      <div className="composer-wrap">
        <div className="composer">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Look up a word, or ask about the current one…"
            aria-label="Look up a word"
          />
          <button
            className={`send ${input.trim() ? "" : "idle"}`}
            aria-label="Send"
            disabled={!input.trim()}
          >
            <ArrowUp className="w-5 h-5" />
          </button>
        </div>
        <div className="composer-meta">
          <Switch
            checked={banglaOn}
            onChange={setBanglaOn}
            label="Bangla"
          />
          <span className="hint hidden md:flex items-center gap-1.5">
            <Kbd>/</Kbd> focus <Kbd>Enter</Kbd> send <Kbd>Ctrl S</Kbd> save
          </span>
        </div>
      </div>
    </div>
  );
}
