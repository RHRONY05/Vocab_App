"use client";

import React from "react";
import { StatusDot } from "./ui";
import { WordStatsData } from "@/lib/stats-context";

export function ProgressStrip({ stats }: { stats: WordStatsData }) {
  return (
    <div className="stats">
      <div className="stat">
        <div className="k">Total</div>
        <div className="v">{stats.total}</div>
      </div>
      <div className="stat">
        <div className="k">
          <StatusDot status="new" />
          New
        </div>
        <div className="v">{stats.new}</div>
      </div>
      <div className="stat">
        <div className="k">
          <StatusDot status="learning" />
          Learning
        </div>
        <div className="v">{stats.learning}</div>
      </div>
      <div className="stat">
        <div className="k">
          <StatusDot status="mastered" />
          Mastered
        </div>
        <div className="v">{stats.mastered}</div>
      </div>
      <div className="stat hl">
        <div className="k">Due now</div>
        <div className="v">{stats.dueNow}</div>
      </div>
      <div className="stat">
        <div className="k">
          <span className="hidden md:inline">Reviewed today</span>
          <span className="md:hidden">Reviewed</span>
        </div>
        <div className="v">{stats.reviewedToday}</div>
      </div>
    </div>
  );
}
