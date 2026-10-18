"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

export interface WordStatsData {
  total: number;
  new: number;
  learning: number;
  mastered: number;
  dueNow: number;
  savedToday: number;
  reviewedToday: number;
  duePreview?: Array<{
    id: string;
    word: string;
    lookupCount: number;
    weaknessScore?: number;
  }>;
  nextDue?: { at: string; count: number } | null;
}

export interface ActiveReviewSession {
  current: number;
  total: number;
  progress: number;
  onEnd: () => void;
}

interface StatsContextType {
  stats: WordStatsData;
  refreshStats: () => Promise<void>;
  loading: boolean;
  activeSession: ActiveReviewSession | null;
  setActiveSession: (session: ActiveReviewSession | null) => void;
}

const defaultStats: WordStatsData = {
  total: 0,
  new: 0,
  learning: 0,
  mastered: 0,
  dueNow: 0,
  savedToday: 0,
  reviewedToday: 0,
};

const StatsContext = createContext<StatsContextType>({
  stats: defaultStats,
  refreshStats: async () => {},
  loading: false,
  activeSession: null,
  setActiveSession: () => {},
});

export function StatsProvider({ children }: { children: React.ReactNode }) {
  const [stats, setStats] = useState<WordStatsData>(defaultStats);
  const [loading, setLoading] = useState(false);
  const [activeSession, setActiveSession] = useState<ActiveReviewSession | null>(null);

  const refreshStats = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/words/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.warn("Failed to fetch stats:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadStats() {
      try {
        const res = await fetch("/api/words/stats");
        if (res.ok && !cancelled) {
          const data = await res.json();
          setStats(data);
        }
      } catch (err) {
        console.warn("Failed to fetch initial stats:", err);
      }
    }

    loadStats();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <StatsContext.Provider
      value={{
        stats,
        refreshStats,
        loading,
        activeSession,
        setActiveSession,
      }}
    >
      {children}
    </StatsContext.Provider>
  );
}

export function useStats() {
  return useContext(StatsContext);
}
