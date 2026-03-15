/**
 * Lightweight RFC 5545 RRULE parser.
 *
 * Supports: FREQ, INTERVAL, BYDAY, BYMONTHDAY, BYMONTH, COUNT, UNTIL.
 * This avoids a heavy dependency for basic recurrence generation.
 */

interface ParsedRRule {
  readonly freq: "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";
  readonly interval: number;
  readonly byDay: readonly string[];
  readonly byMonthDay: readonly number[];
  readonly byMonth: readonly number[];
  readonly count: number | null;
  readonly until: Date | null;
}

const VALID_FREQS = new Set(["DAILY", "WEEKLY", "MONTHLY", "YEARLY"]);
const VALID_DAYS = new Set(["MO", "TU", "WE", "TH", "FR", "SA", "SU"]);

const DAY_OFFSETS: Readonly<Record<string, number>> = {
  MO: 1,
  TU: 2,
  WE: 3,
  TH: 4,
  FR: 5,
  SA: 6,
  SU: 0,
};

/**
 * Parse an RRULE string into a structured object.
 * Returns null if the RRULE is invalid.
 */
export function parseRRule(rruleStr: string): ParsedRRule | null {
  // Strip optional "RRULE:" prefix
  const raw = rruleStr.startsWith("RRULE:")
    ? rruleStr.slice(6)
    : rruleStr;

  const parts = raw.split(";");
  const params = new Map<string, string>();

  for (const part of parts) {
    const eqIdx = part.indexOf("=");
    if (eqIdx === -1) return null;

    const key = part.slice(0, eqIdx).toUpperCase();
    const value = part.slice(eqIdx + 1);
    params.set(key, value);
  }

  const freqStr = params.get("FREQ");
  if (!freqStr || !VALID_FREQS.has(freqStr)) return null;

  const freq = freqStr as ParsedRRule["freq"];

  const intervalStr = params.get("INTERVAL");
  const interval = intervalStr ? parseInt(intervalStr, 10) : 1;
  if (isNaN(interval) || interval < 1) return null;

  const byDayStr = params.get("BYDAY");
  const byDay: string[] = [];
  if (byDayStr) {
    for (const d of byDayStr.split(",")) {
      const trimmed = d.trim().toUpperCase();
      if (!VALID_DAYS.has(trimmed)) return null;
      byDay.push(trimmed);
    }
  }

  const byMonthDayStr = params.get("BYMONTHDAY");
  const byMonthDay: number[] = [];
  if (byMonthDayStr) {
    for (const d of byMonthDayStr.split(",")) {
      const num = parseInt(d.trim(), 10);
      if (isNaN(num) || num < 1 || num > 31) return null;
      byMonthDay.push(num);
    }
  }

  const byMonthStr = params.get("BYMONTH");
  const byMonth: number[] = [];
  if (byMonthStr) {
    for (const m of byMonthStr.split(",")) {
      const num = parseInt(m.trim(), 10);
      if (isNaN(num) || num < 1 || num > 12) return null;
      byMonth.push(num);
    }
  }

  const countStr = params.get("COUNT");
  const count = countStr ? parseInt(countStr, 10) : null;
  if (count !== null && (isNaN(count) || count < 1)) return null;

  const untilStr = params.get("UNTIL");
  let until: Date | null = null;
  if (untilStr) {
    until = parseRRuleDate(untilStr);
    if (!until) return null;
  }

  return { freq, interval, byDay, byMonthDay, byMonth, count, until };
}

/**
 * Parse a date string from RRULE format (YYYYMMDD or YYYYMMDDTHHmmssZ).
 */
function parseRRuleDate(str: string): Date | null {
  if (str.length === 8) {
    const y = parseInt(str.slice(0, 4), 10);
    const m = parseInt(str.slice(4, 6), 10) - 1;
    const d = parseInt(str.slice(6, 8), 10);
    const date = new Date(Date.UTC(y, m, d));
    return isNaN(date.getTime()) ? null : date;
  }

  if (str.length >= 15 && str.includes("T")) {
    const y = parseInt(str.slice(0, 4), 10);
    const m = parseInt(str.slice(4, 6), 10) - 1;
    const d = parseInt(str.slice(6, 8), 10);
    const h = parseInt(str.slice(9, 11), 10);
    const min = parseInt(str.slice(11, 13), 10);
    const s = parseInt(str.slice(13, 15), 10);
    const date = new Date(Date.UTC(y, m, d, h, min, s));
    return isNaN(date.getTime()) ? null : date;
  }

  return null;
}

/**
 * Generate the next N occurrences from now based on an RRULE string.
 * Uses a simple forward-iteration approach with a hard limit of 1000 iterations
 * to prevent infinite loops.
 */
export function getNextOccurrences(
  rruleStr: string,
  count: number,
  after: Date = new Date(),
): Date[] {
  const parsed = parseRRule(rruleStr);
  if (!parsed) return [];

  const results: Date[] = [];
  const maxIterations = 1000;
  let iterations = 0;
  let candidate = new Date(after.getTime());

  // Start from the beginning of the next relevant period
  candidate = advanceToNextPeriodStart(candidate, parsed.freq);

  while (results.length < count && iterations < maxIterations) {
    iterations++;

    if (parsed.until && candidate > parsed.until) break;
    if (parsed.count !== null && results.length >= parsed.count) break;

    if (matchesRule(candidate, parsed)) {
      results.push(new Date(candidate.getTime()));
    }

    candidate = advanceCandidate(candidate, parsed);
  }

  return results;
}

function advanceToNextPeriodStart(date: Date, freq: string): Date {
  const result = new Date(date.getTime());

  switch (freq) {
    case "DAILY":
      // Start from the next day at midnight UTC
      result.setUTCDate(result.getUTCDate() + 1);
      result.setUTCHours(0, 0, 0, 0);
      break;
    case "WEEKLY":
      result.setUTCDate(result.getUTCDate() + 1);
      result.setUTCHours(0, 0, 0, 0);
      break;
    case "MONTHLY":
      result.setUTCDate(result.getUTCDate() + 1);
      result.setUTCHours(0, 0, 0, 0);
      break;
    case "YEARLY":
      result.setUTCDate(result.getUTCDate() + 1);
      result.setUTCHours(0, 0, 0, 0);
      break;
  }

  return result;
}

function matchesRule(date: Date, rule: ParsedRRule): boolean {
  if (rule.byDay.length > 0) {
    const dayOfWeek = date.getUTCDay();
    const dayNames = Object.entries(DAY_OFFSETS);
    const dayName = dayNames.find(([, offset]) => offset === dayOfWeek)?.[0];
    if (!dayName || !rule.byDay.includes(dayName)) return false;
  }

  if (rule.byMonthDay.length > 0) {
    if (!rule.byMonthDay.includes(date.getUTCDate())) return false;
  }

  if (rule.byMonth.length > 0) {
    if (!rule.byMonth.includes(date.getUTCMonth() + 1)) return false;
  }

  return true;
}

function advanceCandidate(date: Date, rule: ParsedRRule): Date {
  const result = new Date(date.getTime());

  // When BYDAY is specified for WEEKLY, advance day-by-day within the week
  if (rule.freq === "WEEKLY" && rule.byDay.length > 0) {
    result.setUTCDate(result.getUTCDate() + 1);

    // If we've gone past Sunday (wrapped around), apply the interval
    if (result.getUTCDay() === 1 && rule.interval > 1) {
      result.setUTCDate(result.getUTCDate() + (rule.interval - 1) * 7);
    }

    return result;
  }

  // When BYMONTHDAY is specified for MONTHLY, advance day-by-day
  if (rule.freq === "MONTHLY" && rule.byMonthDay.length > 0) {
    result.setUTCDate(result.getUTCDate() + 1);

    // If we've wrapped to the 1st of next month and interval > 1
    if (result.getUTCDate() === 1 && rule.interval > 1) {
      result.setUTCMonth(result.getUTCMonth() + (rule.interval - 1));
    }

    return result;
  }

  switch (rule.freq) {
    case "DAILY":
      result.setUTCDate(result.getUTCDate() + rule.interval);
      break;
    case "WEEKLY":
      result.setUTCDate(result.getUTCDate() + rule.interval * 7);
      break;
    case "MONTHLY":
      result.setUTCMonth(result.getUTCMonth() + rule.interval);
      break;
    case "YEARLY":
      result.setUTCFullYear(result.getUTCFullYear() + rule.interval);
      break;
  }

  return result;
}
