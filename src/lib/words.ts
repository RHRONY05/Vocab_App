export function normaliseWord(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/^["'“‘(]+/, "")
    .replace(/["'”’)]+$/, "");
}

export function isPotentialWordLookup(input: string): boolean {
  const trimmed = input.trim();
  if (!trimmed) return false;
  if (trimmed.includes("?")) return false;
  if (trimmed.endsWith(".")) return false;
  const words = trimmed.split(/\s+/);
  return words.length <= 4;
}

export interface RepeatLookupInput {
  lookupCount: number;
  lastLookedUpAt: string | Date;
  box: number;
  now?: Date;
}

export interface RepeatLookupResult {
  lookupCount: number;
  lastLookedUpAt: string;
  box: number;
  nextReviewAt?: string;
  repeatCounted: boolean;
}

export function applyRepeatLookupRule(input: RepeatLookupInput): RepeatLookupResult {
  const now = input.now ?? new Date();
  const last = new Date(input.lastLookedUpAt);
  const diffMs = now.getTime() - last.getTime();
  const twelveHoursMs = 12 * 60 * 60 * 1000;

  if (diffMs > twelveHoursMs) {
    return {
      lookupCount: input.lookupCount + 1,
      lastLookedUpAt: now.toISOString(),
      box: input.box > 1 ? 1 : input.box,
      nextReviewAt: now.toISOString(),
      repeatCounted: true,
    };
  }

  return {
    lookupCount: input.lookupCount,
    lastLookedUpAt: now.toISOString(),
    box: input.box,
    repeatCounted: false,
  };
}
