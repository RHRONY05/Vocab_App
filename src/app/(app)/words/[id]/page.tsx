"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function WordDetailPage() {
  return (
    <div className="flex-1 flex flex-col p-4 max-w-lg mx-auto w-full">
      <Link
        href="/words"
        className="inline-flex items-center gap-2 text-sm text-[var(--ink-2)] hover:text-[var(--ink)] mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Words
      </Link>
      <div className="card p-6">
        <h2 className="serif text-2xl font-semibold mb-2">Word detail</h2>
        <p className="hint">Details will load here.</p>
      </div>
    </div>
  );
}
