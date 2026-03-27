// ── Layer 1: Intent Classification ────────────────────────────────
//
// Regex-based intent detection BEFORE hitting LLMs.
// Resolves ~40% of queries at zero cost.
//
// Inspired by BadhiyaAI's kirana store pattern matching,
// adapted for productivity/task management domain.

export interface ClassifiedIntent {
  readonly intent: string;
  readonly confidence: number;
  readonly entities: Record<string, string>;
}

// ── Date Parsing ──────────────────────────────────────────────────

const RELATIVE_DATES: Record<string, () => string> = {
  today: () => new Date().toISOString().slice(0, 10),
  tomorrow: () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  },
  yesterday: () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().slice(0, 10);
  },
  "next week": () => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().slice(0, 10);
  },
};

const DAY_NAMES: Record<string, number> = {
  monday: 1, tuesday: 2, wednesday: 3, thursday: 4,
  friday: 5, saturday: 6, sunday: 0,
  mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6, sun: 0,
};

function parseRelativeDate(text: string): string | null {
  const lower = text.toLowerCase();

  for (const [keyword, resolver] of Object.entries(RELATIVE_DATES)) {
    if (lower.includes(keyword)) return resolver();
  }

  // "next Monday", "this Friday", etc.
  for (const [dayName, dayNum] of Object.entries(DAY_NAMES)) {
    if (lower.includes(dayName)) {
      const now = new Date();
      const currentDay = now.getDay();
      let daysAhead = dayNum - currentDay;
      if (daysAhead <= 0) daysAhead += 7;
      now.setDate(now.getDate() + daysAhead);
      return now.toISOString().slice(0, 10);
    }
  }

  // "in X hours/days"
  const inMatch = lower.match(/in\s+(\d+)\s+(hour|day|week|minute)/);
  if (inMatch) {
    const amount = parseInt(inMatch[1], 10);
    const unit = inMatch[2];
    const d = new Date();
    switch (unit) {
      case "minute": d.setMinutes(d.getMinutes() + amount); break;
      case "hour": d.setHours(d.getHours() + amount); break;
      case "day": d.setDate(d.getDate() + amount); break;
      case "week": d.setDate(d.getDate() + amount * 7); break;
    }
    return d.toISOString().slice(0, 10);
  }

  return null;
}

// ── Time Parsing ──────────────────────────────────────────────────

function parseTime(text: string): string | null {
  const lower = text.toLowerCase();

  // "at 3pm", "at 3:30 pm", "at 15:00"
  const timeMatch = lower.match(
    /(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/,
  );
  if (timeMatch) {
    let hour = parseInt(timeMatch[1], 10);
    const min = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
    const period = timeMatch[3];

    if (period === "pm" && hour < 12) hour += 12;
    if (period === "am" && hour === 12) hour = 0;
    if (hour > 23) return null;

    return `${String(hour).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
  }

  return null;
}

// ── Priority Parsing ──────────────────────────────────────────────

function parsePriority(text: string): string | null {
  const lower = text.toLowerCase();
  if (/\b(urgent|asap|critical|immediately)\b/.test(lower)) return "urgent";
  if (/\b(high\s*priority|important|high)\b/.test(lower)) return "high";
  if (/\b(medium\s*priority|medium|normal)\b/.test(lower)) return "medium";
  if (/\b(low\s*priority|low|whenever|someday)\b/.test(lower)) return "low";
  return null;
}

// ── Intent Patterns ───────────────────────────────────────────────

interface IntentPattern {
  readonly intent: string;
  readonly patterns: readonly RegExp[];
  readonly extractor?: (text: string, match: RegExpMatchArray) => Record<string, string>;
}

const INTENT_PATTERNS: readonly IntentPattern[] = [
  // ── Task Creation ──
  {
    intent: "create_task",
    patterns: [
      /^(?:create|add|new|make)\s+(?:a\s+)?task\s+(.+)/i,
      /^(?:remind\s+me\s+to|remember\s+to|don'?t\s+forget\s+to)\s+(.+)/i,
      /^(?:todo|to-do|to do)\s*:?\s+(.+)/i,
      /^(?:i\s+need\s+to|i\s+have\s+to|i\s+should|gotta)\s+(.+)/i,
    ],
    extractor: (text, match) => {
      const title = (match[1] ?? text).trim();
      const entities: Record<string, string> = { title };
      const date = parseRelativeDate(text);
      if (date) entities.dueDate = date;
      const time = parseTime(text);
      if (time) entities.dueTime = time;
      const priority = parsePriority(text);
      if (priority) entities.priority = priority;
      return entities;
    },
  },

  // ── Task Completion ──
  {
    intent: "complete_task",
    patterns: [
      /^(?:mark|set)\s+(?:task\s+)?(?:["'](.+?)["']|(.+?))\s+(?:as\s+)?(?:done|complete|finished)/i,
      /^(?:done|finished|completed)\s+(?:with\s+)?(?:["'](.+?)["']|(.+))/i,
      /^(?:i\s+)?(?:did|finished|completed)\s+(?:["'](.+?)["']|(.+))/i,
    ],
    extractor: (_text, match) => ({
      taskQuery: (match[1] ?? match[2] ?? match[3] ?? match[4] ?? match[5] ?? match[6] ?? "").trim(),
    }),
  },

  // ── List Tasks ──
  {
    intent: "list_tasks",
    patterns: [
      /^(?:show|list|what(?:'s| are)?)\s+(?:my\s+)?(?:tasks?|todos?|to-?dos?)\s*(?:for\s+)?(.+)?/i,
      /^(?:what\s+(?:do\s+i\s+have|should\s+i\s+do|is\s+on\s+my\s+plate))\s*(.+)?/i,
      /^(?:today'?s?\s+(?:tasks?|plan|agenda|schedule))/i,
      /^(?:my\s+(?:tasks?|todos?|plan))\s*(?:for\s+)?(.+)?/i,
    ],
    extractor: (text) => {
      const entities: Record<string, string> = {};
      const date = parseRelativeDate(text);
      if (date) entities.dateFilter = date;
      if (/\b(overdue|late|missed)\b/i.test(text)) entities.status = "overdue";
      if (/\b(pending|open|incomplete)\b/i.test(text)) entities.status = "pending";
      if (/\b(completed|done|finished)\b/i.test(text)) entities.status = "completed";
      return entities;
    },
  },

  // ── Progress/Stats ──
  {
    intent: "show_progress",
    patterns: [
      /^(?:show|what(?:'s| is)?)\s+(?:my\s+)?(?:progress|stats?|statistics|productivity|score)/i,
      /^how\s+(?:am\s+i\s+doing|many\s+tasks?\s+(?:did\s+i|have\s+i))/i,
      /^(?:my\s+)?(?:streak|completion\s+rate|productivity)/i,
    ],
    extractor: (text) => {
      const entities: Record<string, string> = {};
      if (/\b(today|this\s+week|this\s+month)\b/i.test(text)) {
        entities.period = text.match(/\b(today|this\s+week|this\s+month)\b/i)?.[1] ?? "today";
      }
      return entities;
    },
  },

  // ── Schedule/Calendar ──
  {
    intent: "show_schedule",
    patterns: [
      /^(?:show|what(?:'s| is)?)\s+(?:my\s+)?(?:schedule|calendar|agenda)\s*(?:for\s+)?(.+)?/i,
      /^(?:what\s+do\s+i\s+have)\s+(?:scheduled|planned)\s*(?:for\s+)?(.+)?/i,
    ],
    extractor: (text) => {
      const entities: Record<string, string> = {};
      const date = parseRelativeDate(text);
      if (date) entities.dateFilter = date;
      return entities;
    },
  },

  // ── Delete/Cancel Task ──
  {
    intent: "delete_task",
    patterns: [
      /^(?:delete|remove|cancel)\s+(?:task\s+)?(?:["'](.+?)["']|(.+))/i,
    ],
    extractor: (_text, match) => ({
      taskQuery: (match[1] ?? match[2] ?? "").trim(),
    }),
  },

  // ── Decompose Task ──
  {
    intent: "decompose_task",
    patterns: [
      /^(?:break\s*(?:down)?|decompose|split)\s+(?:task\s+)?(?:["'](.+?)["']|(.+))/i,
      /^(?:how\s+(?:do\s+i|should\s+i|to))\s+(.+)/i,
    ],
    extractor: (_text, match) => ({
      taskTitle: (match[1] ?? match[2] ?? match[3] ?? "").trim(),
    }),
  },

  // ── Schedule with AI ──
  {
    intent: "ai_schedule",
    patterns: [
      /^(?:schedule|plan|organize)\s+(?:my\s+)?(?:tasks?|day|week)/i,
      /^(?:when\s+should\s+i)\s+(?:do|work\s+on|tackle)/i,
      /^(?:optimize|arrange)\s+(?:my\s+)?(?:schedule|tasks?|day)/i,
    ],
  },

  // ── Greetings ──
  {
    intent: "greeting",
    patterns: [
      /^(?:hi|hello|hey|howdy|greetings|good\s+(?:morning|afternoon|evening))\b/i,
      /^(?:what'?s?\s+up|sup)\b/i,
    ],
  },

  // ── Help ──
  {
    intent: "help",
    patterns: [
      /^(?:help|what\s+can\s+you\s+do|commands|features)/i,
      /^(?:how\s+does?\s+(?:this|unjynx)\s+work)/i,
    ],
  },
];

// ── Public API ──────────────────────────────────────────────────────

/**
 * Classify a user message into an intent using regex patterns.
 * Returns null if no pattern matches (passes to next pipeline layer).
 */
export function classifyIntent(text: string): ClassifiedIntent | null {
  const trimmed = text.trim();
  if (!trimmed || trimmed.length > 500) return null;

  for (const pattern of INTENT_PATTERNS) {
    for (const regex of pattern.patterns) {
      const match = trimmed.match(regex);
      if (match) {
        const entities = pattern.extractor
          ? pattern.extractor(trimmed, match)
          : {};
        return {
          intent: pattern.intent,
          confidence: 1.0,
          entities,
        };
      }
    }
  }

  return null;
}
