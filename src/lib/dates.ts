import { env } from "./env";

export interface DateRange {
  start: string;
  end: string;
}

/**
 * Returns year, month, day, hours, minutes in the specified timezone
 */
export function getZonedDateParts(date: Date, timeZone = env.APP_TIMEZONE) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hour12: false,
    weekday: "short",
  });

  const parts = formatter.formatToParts(date);
  const map: Record<string, string> = {};
  for (const part of parts) {
    map[part.type] = part.value;
  }

  return {
    year: parseInt(map.year, 10),
    month: parseInt(map.month, 10), // 1-12
    day: parseInt(map.day, 10),
    hour: parseInt(map.hour === "24" ? "0" : map.hour, 10),
    minute: parseInt(map.minute, 10),
    second: parseInt(map.second, 10),
    weekday: map.weekday, // "Mon", "Tue", etc.
  };
}

/**
 * Get the ISO string for start of day (00:00:00.000) in the given timezone
 */
export function getStartOfDay(date: Date, timeZone = env.APP_TIMEZONE): Date {
  const parts = getZonedDateParts(date, timeZone);
  // Construct date string formatted for ISO parsing in the timezone offset
  // Format: YYYY-MM-DD
  const m = String(parts.month).padStart(2, "0");
  const d = String(parts.day).padStart(2, "0");
  const y = parts.year;

  // Dhaka is UTC+6
  // To get 00:00:00 in Asia/Dhaka, that is (previous day 18:00:00 UTC)
  // Let's compute offset dynamically:
  const tzDate = new Date(`${y}-${m}-${d}T00:00:00Z`);
  const invParts = getZonedDateParts(tzDate, timeZone);
  const diffHours = (invParts.hour || 0) + (invParts.day > parts.day ? 24 : invParts.day < parts.day ? -24 : 0);
  const offsetMs = diffHours * 60 * 60 * 1000 + (invParts.minute || 0) * 60 * 1000;

  return new Date(tzDate.getTime() - offsetMs);
}

export function getTodayRange(now = new Date(), timeZone = env.APP_TIMEZONE): DateRange {
  const start = getStartOfDay(now, timeZone);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1);
  return {
    start: start.toISOString(),
    end: end.toISOString(),
  };
}

export function getWeekRange(now = new Date(), timeZone = env.APP_TIMEZONE): DateRange {
  const startOfToday = getStartOfDay(now, timeZone);
  // Last 7 days starting 6 days before today's start
  const startOfWeek = new Date(startOfToday.getTime() - 6 * 24 * 60 * 60 * 1000);

  return {
    start: startOfWeek.toISOString(),
    end: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
  };
}

export function getMonthRange(now = new Date(), timeZone = env.APP_TIMEZONE): DateRange {
  const parts = getZonedDateParts(now, timeZone);
  const daysSinceFirst = parts.day - 1;
  const startOfToday = getStartOfDay(now, timeZone);
  const startOfMonth = new Date(
    startOfToday.getTime() - daysSinceFirst * 24 * 60 * 60 * 1000
  );

  return {
    start: startOfMonth.toISOString(),
    end: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
  };
}

/**
 * Row date formatter per 06-UI.md:
 * - today: 10:42
 * - this week: weekday Sun
 * - older: 12 Oct
 */
export function formatWordRowDate(
  dateStr: string,
  now = new Date(),
  timeZone = env.APP_TIMEZONE
): string {
  const date = new Date(dateStr);
  const todayRange = getTodayRange(now, timeZone);
  const weekRange = getWeekRange(now, timeZone);

  if (date >= new Date(todayRange.start)) {
    return new Intl.DateTimeFormat("en-GB", {
      timeZone,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(date);
  }

  if (date >= new Date(weekRange.start)) {
    return new Intl.DateTimeFormat("en-GB", {
      timeZone,
      weekday: "short",
    }).format(date);
  }

  return new Intl.DateTimeFormat("en-GB", {
    timeZone,
    day: "numeric",
    month: "short",
  }).format(date);
}

/**
 * Format next review date: "Today" when due or past, else "Tue, 21 Oct"
 */
export function formatNextReviewDate(
  dateStr?: string | null,
  now = new Date(),
  timeZone = env.APP_TIMEZONE
): string {
  if (!dateStr) return "Today";
  const date = new Date(dateStr);
  const todayEnd = new Date(getTodayRange(now, timeZone).end);

  if (date <= todayEnd) {
    return "Today";
  }

  return new Intl.DateTimeFormat("en-GB", {
    timeZone,
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(date);
}

/**
 * Group name for a given word item date:
 * - "Today"
 * - "Earlier this week"
 * - "Earlier this month"
 * - or "<MonthName> <Year>" for older
 */
export function getDateGroupLabel(
  dateStr: string,
  now = new Date(),
  timeZone = env.APP_TIMEZONE
): string {
  const date = new Date(dateStr);
  const todayStart = new Date(getTodayRange(now, timeZone).start);
  const weekStart = new Date(getWeekRange(now, timeZone).start);
  const monthStart = new Date(getMonthRange(now, timeZone).start);

  if (date >= todayStart) {
    return "Today";
  }
  if (date >= weekStart) {
    return "Earlier this week";
  }
  if (date >= monthStart) {
    return "Earlier this month";
  }

  return new Intl.DateTimeFormat("en-GB", {
    timeZone,
    month: "long",
    year: "numeric",
  }).format(date);
}
