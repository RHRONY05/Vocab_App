"use client";

import React from "react";
import { Illustration } from "@/components/illustrations";
import { Button } from "@/components/ui";

export default function ReviewPage() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6">
      <div className="card flex flex-col items-center text-center p-7 gap-2 max-w-sm">
        <Illustration name="caught-up" size="xs" />
        <b className="text-base font-semibold">All caught up</b>
        <p className="hint">Nothing due right now.</p>
        <Button variant="secondary" size="sm" className="mt-2">
          Practice anyway
        </Button>
      </div>
    </div>
  );
}
