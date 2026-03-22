// ── Inbound Message Parser ──────────────────────────────────────────
// Parses raw text from user replies (WhatsApp, Telegram, SMS) into
// structured commands. Supports multiple aliases and human-friendly
// duration formats (e.g., "snooze 1h", "snooze 30m").
//
// All matching is case-insensitive and whitespace-trimmed.

// ── Types ──────────────────────────────────────────────────────────

export type InboundCommandType =
  | "done"
  | "snooze"
  | "stop"
  | "help"
  | "unknown";

export interface InboundCommand {
  readonly command: InboundCommandType;
  readonly snoozeDuration?: number; // minutes
  readonly rawText: string;
}

// ── Constants ──────────────────────────────────────────────────────

const DONE_ALIASES = new Set(["done", "complete", "completed", "finished", "finish"]);
const STOP_ALIASES = new Set(["stop", "unsubscribe", "unsub", "optout", "opt-out"]);
const HELP_ALIASES = new Set(["help", "?"]);

const DEFAULT_SNOOZE_MINUTES = 15;
const MIN_SNOOZE_MINUTES = 1;
const MAX_SNOOZE_MINUTES = 1440; // 24 hours

// ── Duration Parser ────────────────────────────────────────────────

/**
 * Parses a human-friendly duration string into minutes.
 *
 * Supported formats:
 *   "30"    → 30 minutes
 *   "30m"   → 30 minutes
 *   "1h"    → 60 minutes
 *   "1.5h"  → 90 minutes
 *   "2h30m" → 150 minutes
 *   "1h30"  → 90 minutes
 *
 * Returns null if the input cannot be parsed.
 */
export function parseDuration(input: string): number | null {
  const trimmed = input.trim().toLowerCase();

  if (trimmed === "") {
    return null;
  }

  // Match compound: "2h30m" or "2h30"
  const compoundMatch = trimmed.match(
    /^(\d+(?:\.\d+)?)\s*h\s*(?:(\d+)\s*m?)?$/,
  );
  if (compoundMatch) {
    const hours = parseFloat(compoundMatch[1]);
    const mins = compoundMatch[2] ? parseInt(compoundMatch[2], 10) : 0;
    const total = Math.round(hours * 60 + mins);
    return total >= MIN_SNOOZE_MINUTES && total <= MAX_SNOOZE_MINUTES
      ? total
      : null;
  }

  // Match minutes: "30m" or "30min"
  const minuteMatch = trimmed.match(/^(\d+)\s*(?:m|min|mins|minutes?)$/);
  if (minuteMatch) {
    const mins = parseInt(minuteMatch[1], 10);
    return mins >= MIN_SNOOZE_MINUTES && mins <= MAX_SNOOZE_MINUTES
      ? mins
      : null;
  }

  // Match plain number (treated as minutes): "30"
  const plainMatch = trimmed.match(/^(\d+)$/);
  if (plainMatch) {
    const mins = parseInt(plainMatch[1], 10);
    return mins >= MIN_SNOOZE_MINUTES && mins <= MAX_SNOOZE_MINUTES
      ? mins
      : null;
  }

  return null;
}

// ── Main Parser ────────────────────────────────────────────────────

/**
 * Parses a raw inbound message into a structured command.
 *
 * Examples:
 *   "DONE"       → { command: "done", rawText: "DONE" }
 *   "Complete"   → { command: "done", rawText: "Complete" }
 *   "snooze"     → { command: "snooze", snoozeDuration: 15, rawText: "snooze" }
 *   "SNOOZE 1h"  → { command: "snooze", snoozeDuration: 60, rawText: "SNOOZE 1h" }
 *   "SNOOZE 30m" → { command: "snooze", snoozeDuration: 30, rawText: "SNOOZE 30m" }
 *   "stop"       → { command: "stop", rawText: "stop" }
 *   "?"          → { command: "help", rawText: "?" }
 *   "gibberish"  → { command: "unknown", rawText: "gibberish" }
 */
export function parseInboundMessage(text: string): InboundCommand {
  const trimmed = text.trim();
  const normalized = trimmed.toLowerCase();

  // Single-word check for DONE aliases
  if (DONE_ALIASES.has(normalized)) {
    return { command: "done", rawText: trimmed };
  }

  // SNOOZE with optional duration argument
  if (normalized.startsWith("snooze")) {
    const rest = normalized.slice(6).trim();
    const duration =
      rest.length > 0 ? parseDuration(rest) : null;
    return {
      command: "snooze",
      snoozeDuration: duration ?? DEFAULT_SNOOZE_MINUTES,
      rawText: trimmed,
    };
  }

  // STOP aliases
  if (STOP_ALIASES.has(normalized)) {
    return { command: "stop", rawText: trimmed };
  }

  // HELP aliases
  if (HELP_ALIASES.has(normalized)) {
    return { command: "help", rawText: trimmed };
  }

  return { command: "unknown", rawText: trimmed };
}

// ── Help Text Generator ────────────────────────────────────────────

export function getHelpText(): string {
  return [
    "UNJYNX Commands:",
    "DONE - Complete your most recent task",
    "SNOOZE - Snooze for 15 min (or SNOOZE 30m, SNOOZE 1h)",
    "STOP - Disable notifications on this channel",
    "HELP - Show this message",
  ].join("\n");
}
