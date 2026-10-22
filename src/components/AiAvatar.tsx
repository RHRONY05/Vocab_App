"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface AiAvatarProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  withGlow?: boolean;
}

export function AiAvatar({
  size = "sm",
  className,
  withGlow = true,
}: AiAvatarProps) {
  const sizePx = size === "sm" ? 20 : size === "md" ? 28 : 36;
  const iconPx = size === "sm" ? 18 : size === "md" ? 24 : 32;

  return (
    <div
      className={cn("ai-avatar", className)}
      style={{ width: sizePx, height: sizePx }}
      role="img"
      aria-label="Vocab AI Assistant"
    >
      {withGlow && <div className="ai-avatar-glow" />}
      <svg
        width={iconPx}
        height={iconPx}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="ai-icon-spin"
      >
        <defs>
          <linearGradient id="aiGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2FA8B0" />
            <stop offset="60%" stopColor="#1E6B70" />
            <stop offset="100%" stopColor="#E3A33B" />
          </linearGradient>
          <linearGradient id="aiSparkle" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F5C067" />
            <stop offset="100%" stopColor="#E3A33B" />
          </linearGradient>
        </defs>

        {/* Central 4-pointed radiant AI diamond / star */}
        <path
          d="M12 2C12.5 7.5 16.5 11.5 22 12C16.5 12.5 12.5 16.5 12 22C11.5 16.5 7.5 12.5 2 12C7.5 11.5 11.5 7.5 12 2Z"
          fill="url(#aiGrad)"
        />

        {/* Top-right accent starlet */}
        <path
          d="M19 3C19.2 4.8 20.8 6.2 22.5 6.5C20.8 6.8 19.2 8.2 19 10C18.8 8.2 17.2 6.8 15.5 6.5C17.2 6.2 18.8 4.8 19 3Z"
          fill="url(#aiSparkle)"
          className="ai-icon-sparkle-1"
        />

        {/* Bottom-left mini starlet */}
        <path
          d="M5 16C5.15 17.2 6.2 18.1 7.5 18.3C6.2 18.5 5.15 19.4 5 20.5C4.85 19.4 3.8 18.5 2.5 18.3C3.8 18.1 4.85 17.2 5 16Z"
          fill="url(#aiSparkle)"
          className="ai-icon-sparkle-2"
        />
      </svg>
    </div>
  );
}
