"use client";

import React, { useEffect, useRef } from "react";
import { Button } from "./ui";

export interface DeleteConfirmDialogProps {
  open: boolean;
  word: string;
  isDeleting?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteConfirmDialog({
  open,
  word,
  isDeleting = false,
  onConfirm,
  onCancel,
}: DeleteConfirmDialogProps) {
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    cancelButtonRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onCancel();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-dialog-title"
    >
      <div className="dialog w-full max-w-sm p-6 flex flex-col gap-4">
        <h2 id="delete-dialog-title" className="text-[17px] font-semibold text-[var(--ink)] leading-snug">
          Delete <span className="font-bold">“{word}”</span>?
        </h2>
        <p className="text-[14px] leading-relaxed text-[var(--ink-2)]">
          Its review history is deleted too.
        </p>

        <div className="flex items-center justify-end gap-2.5 mt-2">
          <Button
            ref={cancelButtonRef}
            variant="secondary"
            size="sm"
            onClick={onCancel}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting…" : "Delete"}
          </Button>
        </div>
      </div>
    </div>
  );
}
