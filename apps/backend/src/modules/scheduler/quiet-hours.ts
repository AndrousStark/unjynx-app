// ── Quiet Hours ─────────────────────────────────────────────────────
// Pure functions for checking whether notifications should be
// suppressed based on user's quiet hours configuration.

/**
 * Parses an HH:MM time string into total minutes since midnight.
 */
export function parseTimeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return (hours ?? 0) * 60 + (minutes ?? 0);
}

/**
 * Gets the current time in a specific timezone as minutes since midnight.
 */
export function getCurrentMinutesInTimezone(
  timezone: string,
  now: Date = new Date(),
): number {
  try {
    const formatted = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      hour: "numeric",
      minute: "numeric",
      hour12: false,
    }).format(now);

    return parseTimeToMinutes(formatted);
  } catch {
    // Invalid timezone — fall back to UTC
    return now.getUTCHours() * 60 + now.getUTCMinutes();
  }
}

/**
 * Checks whether a given time (in minutes since midnight) falls within
 * a quiet window. Handles overnight ranges (e.g., 22:00 → 07:00).
 */
export function isWithinQuietWindow(
  currentMinutes: number,
  quietStartMinutes: number,
  quietEndMinutes: number,
): boolean {
  if (quietStartMinutes <= quietEndMinutes) {
    // Same-day range: e.g., 14:00 → 16:00
    return currentMinutes >= quietStartMinutes && currentMinutes < quietEndMinutes;
  }
  // Overnight range: e.g., 22:00 → 07:00
  return currentMinutes >= quietStartMinutes || currentMinutes < quietEndMinutes;
}

/**
 * Full quiet hours check: should a notification be suppressed right now?
 */
export function isQuietHoursActive(
  quietStart: string | null,
  quietEnd: string | null,
  timezone: string,
  overrideForUrgent: boolean,
  taskPriority: string,
  now: Date = new Date(),
): boolean {
  // No quiet hours configured
  if (!quietStart || !quietEnd) return false;

  // Urgent tasks bypass quiet hours if override is enabled
  if (overrideForUrgent && taskPriority === "urgent") return false;

  const currentMinutes = getCurrentMinutesInTimezone(timezone, now);
  const startMinutes = parseTimeToMinutes(quietStart);
  const endMinutes = parseTimeToMinutes(quietEnd);

  return isWithinQuietWindow(currentMinutes, startMinutes, endMinutes);
}

/**
 * Computes the next delivery time after quiet hours end.
 * Returns null if quiet hours are not active.
 */
export function nextDeliveryAfterQuietHours(
  quietEnd: string,
  timezone: string,
  now: Date = new Date(),
): Date {
  const endMinutes = parseTimeToMinutes(quietEnd);
  const endHours = Math.floor(endMinutes / 60);
  const endMins = endMinutes % 60;

  // Create a date for today at quiet hours end in the user's timezone
  const todayEnd = new Date(now);
  todayEnd.setHours(endHours, endMins, 0, 0);

  // If quiet end is already past today, push to tomorrow
  if (todayEnd <= now) {
    todayEnd.setDate(todayEnd.getDate() + 1);
  }

  return todayEnd;
}
