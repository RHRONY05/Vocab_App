"use client";

import React from "react";
import { Illustration } from "@/components/illustrations";

export default function WordsPage() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6">
      <div className="card flex flex-col items-center text-center p-7 gap-2 max-w-sm">
        <Illustration name="book-sprout" size="xs" />
        <b className="text-base font-semibold">No words yet</b>
        <p className="hint">Look one up on the Learn tab and press Save.</p>
      </div>
    </div>
  );
}
