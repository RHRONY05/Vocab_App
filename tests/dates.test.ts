import { describe, it, expect } from "vitest";
import {
  getTodayRange,
  getWeekRange,
  getMonthRange,
  formatWordRowDate,
  formatNextReviewDate,
  getDateGroupLabel,
} from "@/lib/dates";

describe("dates utilities", () => {
  const fixedNow = new Date("2026-10-19T10:00:00Z"); // 4:00 PM Dhaka (Monday)

  it("calculates today range in Asia/Dhaka", () => {
    const range = getTodayRange(fixedNow, "Asia/Dhaka");
    expect(range.start).toBeDefined();
    expect(range.end).toBeDefined();
    expect(new Date(range.start).getTime()).toBeLessThan(fixedNow.getTime());
    expect(new Date(range.end).getTime()).toBeGreaterThan(fixedNow.getTime());
  });

  it("calculates week and month ranges in Asia/Dhaka", () => {
    const week = getWeekRange(fixedNow, "Asia/Dhaka");
    const month = getMonthRange(fixedNow, "Asia/Dhaka");

    expect(new Date(week.start).getTime()).toBeLessThanOrEqual(fixedNow.getTime());
    expect(new Date(month.start).getTime()).toBeLessThanOrEqual(new Date(week.start).getTime());
  });

  it("formats word row dates according to relative freshness", () => {
    // Same day: should format as HH:mm e.g. "16:00"
    const todayFormatted = formatWordRowDate(fixedNow.toISOString(), fixedNow, "Asia/Dhaka");
    expect(todayFormatted).toMatch(/^\d{2}:\d{2}$/);

    // 2 days ago (Saturday): should format as short weekday "Sat"
    const twoDaysAgo = new Date(fixedNow.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString();
    const weekFormatted = formatWordRowDate(twoDaysAgo, fixedNow, "Asia/Dhaka");
    expect(weekFormatted).toBe("Sat");

    // 20 days ago: should format as "day month" e.g. "29 Sep"
    const twentyDaysAgo = new Date(fixedNow.getTime() - 20 * 24 * 60 * 60 * 1000).toISOString();
    const olderFormatted = formatWordRowDate(twentyDaysAgo, fixedNow, "Asia/Dhaka");
    expect(olderFormatted).toMatch(/\d{1,2}\s+[A-Za-z]{3}/);
  });

  it("formats next review dates", () => {
    // Past or today: "Today"
    expect(formatNextReviewDate(fixedNow.toISOString(), fixedNow, "Asia/Dhaka")).toBe("Today");

    // 2 days in future
    const futureDate = new Date(fixedNow.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString();
    const futureFormatted = formatNextReviewDate(futureDate, fixedNow, "Asia/Dhaka");
    expect(futureFormatted).toContain("Wed");
  });

  it("determines correct date group label", () => {
    expect(getDateGroupLabel(fixedNow.toISOString(), fixedNow, "Asia/Dhaka")).toBe("Today");

    const twoDaysAgo = new Date(fixedNow.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString();
    expect(getDateGroupLabel(twoDaysAgo, fixedNow, "Asia/Dhaka")).toBe("Earlier this week");
  });
});
