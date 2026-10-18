"use client";

import React, { useEffect } from "react";
import { X } from "lucide-react";
import { Kbd } from "./ui";

export function ShortcutsDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && open) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--overlay)]"
      onClick={onClose}
    >
      <div
        className="dialog w-full max-w-md p-6 bg-[var(--surface)]"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="shortcuts-title"
      >
        <div className="row justify-between mb-3">
          <h2 id="shortcuts-title" className="text-base font-semibold">
            Keyboard shortcuts
          </h2>
          <button
            className="icon-btn"
            aria-label="Close"
            onClick={onClose}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <table className="kbd-table">
          <tbody>
            <tr>
              <td>Focus the search box</td>
              <td>
                <Kbd>/</Kbd>
              </td>
            </tr>
            <tr>
              <td>Look up / send</td>
              <td>
                <Kbd>Enter</Kbd>
              </td>
            </tr>
            <tr>
              <td>Save the word</td>
              <td>
                <Kbd>Ctrl</Kbd> <Kbd>S</Kbd>
              </td>
            </tr>
            <tr>
              <td>Clear the input</td>
              <td>
                <Kbd>Esc</Kbd>
              </td>
            </tr>
            <tr>
              <td>Choose an answer</td>
              <td>
                <Kbd>1</Kbd>–<Kbd>4</Kbd>
              </td>
            </tr>
            <tr>
              <td>Show answer / next</td>
              <td>
                <Kbd>Space</Kbd> <Kbd>Enter</Kbd>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
