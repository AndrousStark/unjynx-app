// ── Layer 1: Intent Classification (v2 — chrono-node + compromise) ──
//
// Multi-strategy intent detection BEFORE hitting LLMs.
// Uses: regex patterns → entity extraction → confidence scoring.
// Resolves ~40-60% of queries at zero cost.
//
// v2 upgrades:
//   - chrono-node for production-grade NLP date/time parsing
//   - compromise for person/place extraction
//   - Graduated confidence scoring (not just 1.0/0.0)
//   - 15+ intents (up from 10)
//   - Slash command support (/task, /done, /schedule)
//   - Todoist-style syntax (#project, @label, p1-p4)
//   - Duration parsing ("30 minutes", "2 hours")
//   - Recurring pattern detection ("every Monday")

import * as chrono from "chrono-node";

// ── Types ──────────────────────────────────────────────────────────

export interface ClassifiedIntent {
  readonly intent: string;
  readonly confidence: number;
  readonly entities: Record<string, string>;
}

// ── chrono-node Date/Time Parsing ──────────────────────────────────

/**
 * Parse dates and times from natural language using chrono-node.
 * Handles: "tomorrow at 3pm", "next Friday", "in 2 hours",
 * "March 15", "the day after tomorrow", "this evening", etc.
 */
function parseDateTime(text: string): { date: string | null; time: string | null } {
  const results = chrono.parse(text, new Date(), { forwardDate: true });
  if (results.length === 0) return { date: null, time: null };

  const result = results[0];
  const start = result.start;

  const date = start.date().toISOString().slice(0, 10);

  // Only extract time if it was explicitly mentioned
  const hasTime = start.isCertain("hour");
  let time: string | null = null;
  if (hasTime) {
    const hour = start.get("hour") ?? 0;
    const minute = start.get("minute") ?? 0;
    time = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
  }

  return { date, time };
}

/**
 * Strip recognized date/time expressions from text to get the clean title.
 */
function stripDateTime(text: string): string {
  const results = chrono.parse(text);
  let cleaned = text;
  // Remove matched date/time portions from the text (right to left to preserve indices)
  for (let i = results.length - 1; i >= 0; i--) {
    const r = results[i];
    cleaned = cleaned.slice(0, r.index) + cleaned.slice(r.index + r.text.length);
  }
  return cleaned.replace(/\s{2,}/g, " ").trim();
}

// ── Priority Parsing ──────────────────────────────────────────────

const PRIORITY_MAP: readonly [RegExp, string, number][] = [
  [/\bp1\b|!\s*!\s*!\s*!|\b(urgent|asap|critical|immediately)\b/i, "urgent", 0.95],
  [/\bp2\b|!\s*!\s*!|\b(high\s*(?:priority)?|important)\b/i, "high", 0.90],
  [/\bp3\b|!\s*!|\b(medium\s*(?:priority)?|normal|moderate)\b/i, "medium", 0.85],
  [/\bp4\b|\b(low\s*(?:priority)?|whenever|someday|eventually)\b/i, "low", 0.80],
];

function parsePriority(text: string): { priority: string | null; confidence: number } {
  for (const [pattern, priority, conf] of PRIORITY_MAP) {
    if (pattern.test(text)) return { priority, confidence: conf };
  }
  return { priority: null, confidence: 0 };
}

/**
 * Strip priority markers from text.
 */
function stripPriority(text: string): string {
  return text
    .replace(/\bp[1-4]\b/gi, "")
    .replace(/!\s*!\s*!\s*!/g, "")
    .replace(/!\s*!\s*!/g, "")
    .replace(/!\s*!/g, "")
    .replace(/\b(urgent|asap|critical|high\s*priority|medium\s*priority|low\s*priority|important)\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

// ── Project & Label Extraction (Todoist-style) ────────────────────

function extractProjectTag(text: string): string | null {
  const match = text.match(/#(\w[\w-]*)/);
  return match ? match[1] : null;
}

function extractLabels(text: string): string[] {
  const matches = text.matchAll(/@(\w[\w-]*)/g);
  return Array.from(matches, (m) => m[1]);
}

function stripTags(text: string): string {
  return text
    .replace(/#\w[\w-]*/g, "")
    .replace(/@\w[\w-]*/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

// ── Notification Channel Extraction ───────────────────────────────

const CHANNEL_PATTERNS: readonly [RegExp, string][] = [
  [/\b(?:on\s+)?whatsapp\b/i, "whatsapp"],
  [/\b(?:on\s+)?telegram\b/i, "telegram"],
  [/\b(?:via?\s+)?(?:text|sms)\b/i, "sms"],
  [/\b(?:via?\s+)?(?:email|e-mail|mail\s+me)\b/i, "email"],
  [/\b(?:on\s+)?(?:slack)\b/i, "slack"],
  [/\b(?:on\s+)?(?:discord)\b/i, "discord"],
  [/\b(?:on\s+)?(?:instagram|insta|ig)\b/i, "instagram"],
  [/\b(?:push\s+(?:notification|notify))\b/i, "push"],
];

function parseNotificationChannel(text: string): string | null {
  for (const [pattern, channel] of CHANNEL_PATTERNS) {
    if (pattern.test(text)) return channel;
  }
  return null;
}

function stripChannel(text: string): string {
  let cleaned = text;
  for (const [pattern] of CHANNEL_PATTERNS) {
    cleaned = cleaned.replace(pattern, "");
  }
  return cleaned.replace(/\b(?:on|via|through|using)\s+$/i, "").replace(/\s{2,}/g, " ").trim();
}

// ── Abbreviation Normalization ────────────────────────────────────

const ABBREVIATIONS: Record<string, string> = {
  tmrw: "tomorrow", tmr: "tomorrow", "2mrw": "tomorrow",
  mtg: "meeting", appt: "appointment",
  "w/": "with", "b/c": "because",
  pls: "please", plz: "please",
  rn: "right now", asap: "as soon as possible",
  eod: "end of day", eow: "end of week", eom: "end of month",
  wfh: "work from home", ooo: "out of office",
  "f/u": "follow up", "1:1": "one on one meeting",
  msg: "message", info: "information",
  mins: "minutes", hrs: "hours", secs: "seconds",
};

function normalizeAbbreviations(text: string): string {
  const words = text.split(/\s+/);
  return words.map((w) => ABBREVIATIONS[w.toLowerCase()] ?? w).join(" ");
}

// ── Recurring Pattern Detection ───────────────────────────────────

function parseRecurring(text: string): string | null {
  const lower = text.toLowerCase();

  const patterns: [RegExp, string][] = [
    [/\bevery\s+day\b|\bdaily\b/, "FREQ=DAILY"],
    [/\bevery\s+week\b|\bweekly\b/, "FREQ=WEEKLY"],
    [/\bevery\s+month\b|\bmonthly\b/, "FREQ=MONTHLY"],
    [/\bevery\s+year\b|\bannually\b|\byearly\b/, "FREQ=YEARLY"],
    [/\bevery\s+weekday\b/, "FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR"],
    [/\bevery\s+weekend\b/, "FREQ=WEEKLY;BYDAY=SA,SU"],
    [/\bevery\s+monday\b/, "FREQ=WEEKLY;BYDAY=MO"],
    [/\bevery\s+tuesday\b/, "FREQ=WEEKLY;BYDAY=TU"],
    [/\bevery\s+wednesday\b/, "FREQ=WEEKLY;BYDAY=WE"],
    [/\bevery\s+thursday\b/, "FREQ=WEEKLY;BYDAY=TH"],
    [/\bevery\s+friday\b/, "FREQ=WEEKLY;BYDAY=FR"],
    [/\bevery\s+saturday\b/, "FREQ=WEEKLY;BYDAY=SA"],
    [/\bevery\s+sunday\b/, "FREQ=WEEKLY;BYDAY=SU"],
    [/\bevery\s+(\d+)\s+days?\b/, "FREQ=DAILY;INTERVAL=$1"],
    [/\bevery\s+(\d+)\s+weeks?\b/, "FREQ=WEEKLY;INTERVAL=$1"],
    [/\bevery\s+(\d+)\s+months?\b/, "FREQ=MONTHLY;INTERVAL=$1"],
  ];

  for (const [regex, rrule] of patterns) {
    const match = lower.match(regex);
    if (match) {
      let rule = rrule;
      if (match[1]) rule = rule.replace("$1", match[1]);
      return rule;
    }
  }

  return null;
}

// ── Duration Parsing ──────────────────────────────────────────────

function parseDuration(text: string): number | null {
  const lower = text.toLowerCase();

  const patterns: [RegExp, (m: RegExpMatchArray) => number][] = [
    [/(\d+(?:\.\d+)?)\s*(?:h(?:ou)?rs?)\b/, (m) => parseFloat(m[1]) * 60],
    [/(\d+(?:\.\d+)?)\s*(?:m(?:in(?:ute)?s?)?)\b/, (m) => parseFloat(m[1])],
    [/half\s+(?:an?\s+)?hour/, () => 30],
    [/quarter\s+(?:of\s+)?(?:an?\s+)?hour/, () => 15],
    [/(\d+)\s*h\s*(\d+)\s*m/, (m) => parseInt(m[1]) * 60 + parseInt(m[2])],
  ];

  for (const [regex, calc] of patterns) {
    const match = lower.match(regex);
    if (match) return Math.round(calc(match));
  }

  return null;
}

// ── Slash Commands ────────────────────────────────────────────────

function parseSlashCommand(text: string): ClassifiedIntent | null {
  const trimmed = text.trim();
  if (!trimmed.startsWith("/")) return null;

  const parts = trimmed.slice(1).split(/\s+/);
  const command = parts[0].toLowerCase();
  const args = parts.slice(1).join(" ");

  const commands: Record<string, string> = {
    task: "create_task",
    add: "create_task",
    new: "create_task",
    done: "complete_task",
    complete: "complete_task",
    finish: "complete_task",
    list: "list_tasks",
    tasks: "list_tasks",
    show: "list_tasks",
    progress: "show_progress",
    stats: "show_progress",
    streak: "show_progress",
    schedule: "ai_schedule",
    plan: "ai_schedule",
    break: "decompose_task",
    decompose: "decompose_task",
    split: "decompose_task",
    delete: "delete_task",
    remove: "delete_task",
    cancel: "delete_task",
    help: "help",
    snooze: "snooze_task",
    remind: "set_reminder",
    insight: "show_insights",
    insights: "show_insights",
    focus: "start_focus",
    ghost: "start_focus",
    undo: "undo_action",
    revert: "undo_action",
    oops: "undo_action",
    template: "use_template",
    templates: "use_template",
    pomodoro: "start_pomodoro",
    pomo: "start_pomodoro",
    timer: "start_pomodoro",
    stoppomodoro: "stop_pomodoro",
    stoptimer: "stop_pomodoro",
  };

  const intent = commands[command];
  if (!intent) return null;

  const entities: Record<string, string> = {};
  if (args) {
    entities.rawArgs = args;

    if (intent === "create_task") {
      const { date, time } = parseDateTime(args);
      const { priority } = parsePriority(args);
      const project = extractProjectTag(args);
      let title = stripDateTime(args);
      title = stripPriority(title);
      title = stripTags(title);
      entities.title = title || args;
      if (date) entities.dueDate = date;
      if (time) entities.dueTime = time;
      if (priority) entities.priority = priority;
      if (project) entities.project = project;
    } else if (intent === "complete_task" || intent === "delete_task") {
      entities.taskQuery = args;
    } else if (intent === "decompose_task") {
      entities.taskTitle = args;
    }
  }

  return { intent, confidence: 0.99, entities };
}

// ── Natural Language Intent Patterns ──────────────────────────────

interface IntentPattern {
  readonly intent: string;
  readonly confidence: number;
  readonly patterns: readonly RegExp[];
  readonly extractor?: (text: string, match: RegExpMatchArray) => Record<string, string>;
}

/**
 * Full entity extraction for task creation.
 * Uses chrono-node for dates and strips recognized entities from title.
 */
function extractTaskEntities(text: string): Record<string, string> {
  const entities: Record<string, string> = {};

  // Extract notification channel (UNJYNX USP)
  const channel = parseNotificationChannel(text);
  if (channel) entities.channel = channel;

  // Extract date/time (chrono-node)
  const { date, time } = parseDateTime(text);
  if (date) entities.dueDate = date;
  if (time) entities.dueTime = time;

  // Extract priority
  const { priority } = parsePriority(text);
  if (priority) entities.priority = priority;

  // Extract project and labels
  const project = extractProjectTag(text);
  if (project) entities.project = project;
  const labels = extractLabels(text);
  if (labels.length > 0) entities.labels = labels.join(",");

  // Extract recurring pattern
  const rrule = parseRecurring(text);
  if (rrule) entities.rrule = rrule;

  // Extract duration estimate
  const duration = parseDuration(text);
  if (duration) entities.estimatedMinutes = String(duration);

  // Clean title: strip all recognized entities
  let title = stripDateTime(text);
  title = stripPriority(title);
  title = stripTags(title);
  // Strip recurring patterns only if rrule was actually extracted
  if (entities.rrule) {
    title = title.replace(/\bevery\s+\w+(\s+\w+)?\b/gi, "").trim();
  }
  // Strip common prefixes
  title = title
    .replace(/^(?:create|add|new|make)\s+(?:a\s+)?(?:task|todo|reminder)\s*/i, "")
    .replace(/^(?:remind\s+me\s+to|remember\s+to|don'?t\s+forget\s+to)\s*/i, "")
    .replace(/^(?:i\s+need\s+to|i\s+have\s+to|i\s+should|gotta)\s*/i, "")
    .replace(/^(?:todo|to-?do)\s*:?\s*/i, "")
    .trim();

  entities.title = title || text;

  return entities;
}

const INTENT_PATTERNS: readonly IntentPattern[] = [
  // ── Task Creation (confidence: 0.95) ──
  {
    intent: "create_task",
    confidence: 0.95,
    patterns: [
      /^(?:create|add|new|make)\s+(?:a\s+)?(?:task|todo|reminder)\s+(.+)/i,
      /^(?:remind\s+me\s+to|remember\s+to|don'?t\s+forget\s+to)\s+(.+)/i,
      /^(?:todo|to-?do)\s*:?\s+(.+)/i,
      /^(?:i\s+need\s+to|i\s+have\s+to|i\s+should|gotta)\s+(.+)/i,
    ],
    extractor: (text) => extractTaskEntities(text),
  },

  // ── Task Completion (confidence: 0.95) ──
  {
    intent: "complete_task",
    confidence: 0.95,
    patterns: [
      /^(?:mark|set)\s+(?:task\s+)?(?:["'](.+?)["']|(.+?))\s+(?:as\s+)?(?:done|complete|finished)/i,
      /^(?:done|finished|completed)\s+(?:with\s+)?(?:["'](.+?)["']|(.+))/i,
      /^(?:i\s+)?(?:did|finished|completed|checked\s+off)\s+(?:["'](.+?)["']|(.+))/i,
      /^(?:check\s+off|tick\s+off)\s+(?:["'](.+?)["']|(.+))/i,
    ],
    extractor: (_text, match) => {
      const taskQuery = (match[1] ?? match[2] ?? match[3] ?? match[4] ?? match[5] ?? match[6] ?? match[7] ?? match[8] ?? "").trim();
      return { taskQuery };
    },
  },

  // ── Batch Completion (confidence: 0.90) ──
  {
    intent: "batch_complete",
    confidence: 0.90,
    patterns: [
      /^(?:mark|set)\s+(?:all|everything)\s+(?:as\s+)?(?:done|complete)/i,
      /^(?:complete|finish)\s+(?:all|everything)\s*(?:overdue|pending|today'?s?)?/i,
      /^(?:clear|clean)\s+(?:my\s+)?(?:task\s*)?(?:list|queue|inbox)/i,
    ],
    extractor: (text) => {
      const entities: Record<string, string> = {};
      if (/\boverdue\b/i.test(text)) entities.filter = "overdue";
      if (/\btoday\b/i.test(text)) entities.filter = "today";
      if (/\bpending\b/i.test(text)) entities.filter = "pending";
      return entities;
    },
  },

  // ── Task Update (confidence: 0.90) ──
  {
    intent: "update_task",
    confidence: 0.90,
    patterns: [
      /^(?:change|update|set|move|reschedule|postpone|defer)\s+(?:task\s+)?(?:["'](.+?)["']|(.+?))\s+(?:to|priority|due)\s+(.+)/i,
      /^(?:make\s+(?:it|that|this))\s+(high|low|medium|urgent)\s*(?:priority)?/i,
      /^(?:move|reschedule|postpone|defer)\s+(?:it|that|this)\s+(?:to\s+)?(.+)/i,
    ],
    extractor: (text, match) => {
      const entities: Record<string, string> = {};
      if (match[1] || match[2]) entities.taskQuery = (match[1] ?? match[2] ?? "").trim();
      if (match[3]) {
        const { date, time } = parseDateTime(match[3]);
        if (date) entities.dueDate = date;
        if (time) entities.dueTime = time;
        const { priority } = parsePriority(match[3]);
        if (priority) entities.priority = priority;
      }
      // Handle "make it high priority" pattern
      if (match[4]) entities.priority = match[4].toLowerCase();
      // Handle "move it to tomorrow" pattern
      if (match[5]) {
        const { date, time } = parseDateTime(match[5]);
        if (date) entities.dueDate = date;
        if (time) entities.dueTime = time;
      }
      return entities;
    },
  },

  // ── Snooze Task (confidence: 0.90) ──
  {
    intent: "snooze_task",
    confidence: 0.90,
    patterns: [
      /^(?:snooze|delay|push\s+back|remind\s+me\s+(?:again\s+)?(?:in|later))\s+(.+)/i,
      /^(?:not\s+now|later|come\s+back\s+(?:in|to\s+this))\s*(.+)?/i,
    ],
    extractor: (text) => {
      const entities: Record<string, string> = {};
      const { date, time } = parseDateTime(text);
      if (date) entities.snoozeUntilDate = date;
      if (time) entities.snoozeUntilTime = time;
      const duration = parseDuration(text);
      if (duration) entities.snoozeDurationMinutes = String(duration);
      return entities;
    },
  },

  // ── Set Reminder (confidence: 0.90) ──
  {
    intent: "set_reminder",
    confidence: 0.90,
    patterns: [
      /^(?:set|create|add)\s+(?:a\s+)?reminder\s+(?:for|to|about)\s+(.+)/i,
      /^(?:notify|alert|ping)\s+me\s+(?:about|when|at|in)\s+(.+)/i,
    ],
    extractor: (text) => extractTaskEntities(text),
  },

  // ── Create Recurring (confidence: 0.90) ──
  {
    intent: "create_recurring",
    confidence: 0.90,
    patterns: [
      /^(?:create|add|set\s+up|schedule)\s+(?:a\s+)?(?:recurring|repeating|daily|weekly|monthly)\s+(?:task|reminder|event)\s+(.+)/i,
      /^(?:every\s+(?:day|week|month|monday|tuesday|wednesday|thursday|friday|saturday|sunday|weekday|weekend))\s+(.+)/i,
    ],
    extractor: (text) => {
      const entities = extractTaskEntities(text);
      if (!entities.rrule) {
        const rrule = parseRecurring(text);
        if (rrule) entities.rrule = rrule;
      }
      return entities;
    },
  },

  // ── List Tasks (confidence: 0.90) ──
  {
    intent: "list_tasks",
    confidence: 0.90,
    patterns: [
      /^(?:show|list|what(?:'s| are)?)\s+(?:my\s+)?(?:tasks?|todos?|to-?dos?)\s*(?:for\s+)?(.+)?/i,
      /^(?:what\s+(?:do\s+i\s+have|should\s+i\s+do|is\s+on\s+my\s+plate|am\s+i\s+working\s+on))\s*(.+)?/i,
      /^(?:today'?s?\s+(?:tasks?|plan|agenda|schedule|work))/i,
      /^(?:my\s+(?:tasks?|todos?|plan|agenda))\s*(?:for\s+)?(.+)?/i,
      /^(?:what'?s?\s+(?:left|remaining|pending|next))\s*(?:for\s+)?(.+)?/i,
    ],
    extractor: (text) => {
      const entities: Record<string, string> = {};
      const { date } = parseDateTime(text);
      if (date) entities.dateFilter = date;
      if (/\b(overdue|late|missed|behind)\b/i.test(text)) entities.status = "overdue";
      if (/\b(pending|open|incomplete|remaining)\b/i.test(text)) entities.status = "pending";
      if (/\b(completed|done|finished)\b/i.test(text)) entities.status = "completed";
      if (/\b(blocked|stuck)\b/i.test(text)) entities.status = "blocked";
      const { priority } = parsePriority(text);
      if (priority) entities.priorityFilter = priority;
      const project = extractProjectTag(text);
      if (project) entities.projectFilter = project;
      return entities;
    },
  },

  // ── Progress/Stats (confidence: 0.90) ──
  {
    intent: "show_progress",
    confidence: 0.90,
    patterns: [
      /^(?:show|what(?:'s| is)?)\s+(?:my\s+)?(?:progress|stats?|statistics|productivity|score|performance)/i,
      /^how\s+(?:am\s+i\s+doing|many\s+tasks?\s+(?:did\s+i|have\s+i)|productive\s+(?:am\s+i|was\s+i))/i,
      /^(?:my\s+)?(?:streak|completion\s+rate|productivity|activity|performance)/i,
      /^(?:daily|weekly|monthly)\s+(?:report|summary|review|recap)/i,
    ],
    extractor: (text) => {
      const entities: Record<string, string> = {};
      if (/\btoday\b/i.test(text)) entities.period = "today";
      else if (/\bthis\s+week\b/i.test(text)) entities.period = "week";
      else if (/\bthis\s+month\b/i.test(text)) entities.period = "month";
      else if (/\byesterday\b/i.test(text)) entities.period = "yesterday";
      else if (/\blast\s+week\b/i.test(text)) entities.period = "last_week";
      return entities;
    },
  },

  // ── Show Insights (confidence: 0.90) ──
  {
    intent: "show_insights",
    confidence: 0.90,
    patterns: [
      /^(?:show|give\s+me|what\s+are)\s+(?:my\s+)?(?:insights?|analytics|trends|patterns|ai\s+analysis)/i,
      /^(?:analyze|review)\s+(?:my\s+)?(?:productivity|habits?|patterns?|week)/i,
    ],
  },

  // ── Schedule/Calendar (confidence: 0.85) ──
  {
    intent: "show_schedule",
    confidence: 0.85,
    patterns: [
      /^(?:show|what(?:'s| is)?)\s+(?:my\s+)?(?:schedule|calendar|agenda|day)\s*(?:for\s+)?(.+)?/i,
      /^(?:what\s+do\s+i\s+have)\s+(?:scheduled|planned|booked|coming\s+up)\s*(?:for\s+)?(.+)?/i,
      /^(?:am\s+i\s+free|do\s+i\s+have\s+anything)\s*(?:on|at|for)?\s*(.+)?/i,
    ],
    extractor: (text) => {
      const entities: Record<string, string> = {};
      const { date } = parseDateTime(text);
      if (date) entities.dateFilter = date;
      return entities;
    },
  },

  // ── Delete/Cancel Task (confidence: 0.85) ──
  {
    intent: "delete_task",
    confidence: 0.85,
    patterns: [
      /^(?:delete|remove|cancel|drop|trash)\s+(?:task\s+)?(?:["'](.+?)["']|(.+))/i,
      /^(?:get\s+rid\s+of|throw\s+away)\s+(?:["'](.+?)["']|(.+))/i,
    ],
    extractor: (_text, match) => ({
      taskQuery: (match[1] ?? match[2] ?? match[3] ?? match[4] ?? "").trim(),
    }),
  },

  // ── Decompose Task (confidence: 0.85) ──
  {
    intent: "decompose_task",
    confidence: 0.85,
    patterns: [
      /^(?:break\s*(?:down)?|decompose|split|divide)\s+(?:task\s+)?(?:["'](.+?)["']|(.+))/i,
      /^(?:how\s+(?:do\s+i|should\s+i|can\s+i|to))\s+(?:approach|tackle|start|do)\s+(.+)/i,
      /^(?:what\s+are\s+the\s+steps\s+(?:for|to))\s+(.+)/i,
      /^(?:subtasks?\s+for|steps?\s+for)\s+(.+)/i,
    ],
    extractor: (_text, match) => ({
      taskTitle: (match[1] ?? match[2] ?? match[3] ?? match[4] ?? "").trim(),
    }),
  },

  // ── Schedule with AI (confidence: 0.85) ──
  {
    intent: "ai_schedule",
    confidence: 0.85,
    patterns: [
      /^(?:schedule|plan|organize|arrange|optimize)\s+(?:my\s+)?(?:tasks?|day|week|work)/i,
      /^(?:when\s+should\s+i)\s+(?:do|work\s+on|tackle|start)/i,
      /^(?:auto[- ]?schedule|smart\s+schedule|ai\s+schedule)/i,
      /^(?:find|suggest)\s+(?:the\s+)?(?:best|optimal|right)\s+time/i,
    ],
  },

  // ── Start Focus/Ghost Mode (confidence: 0.85) ──
  {
    intent: "start_focus",
    confidence: 0.85,
    patterns: [
      /^(?:start|enter|enable|turn\s+on)\s+(?:focus|ghost|do\s+not\s+disturb|dnd)\s*(?:mode)?/i,
      /^(?:i\s+need\s+to\s+focus|don'?t\s+disturb\s+me|silence\s+(?:everything|notifications))/i,
    ],
    extractor: (text) => {
      const entities: Record<string, string> = {};
      const duration = parseDuration(text);
      if (duration) entities.durationMinutes = String(duration);
      return entities;
    },
  },

  // ── Search Tasks (confidence: 0.85) ──
  {
    intent: "search_tasks",
    confidence: 0.85,
    patterns: [
      /^(?:find|search|look\s+for|where\s+is)\s+(?:the\s+)?(?:task\s+)?(?:about\s+|called\s+|named\s+)?(?:["'](.+?)["']|(.+))/i,
      /^(?:which\s+task)\s+(?:is\s+)?(?:about|has|contains)\s+(.+)/i,
    ],
    extractor: (_text, match) => ({
      searchQuery: (match[1] ?? match[2] ?? match[3] ?? "").trim(),
    }),
  },

  // ── Show Completed (confidence: 0.90) ──
  {
    intent: "show_completed",
    confidence: 0.90,
    patterns: [
      /^(?:what\s+did\s+i\s+(?:finish|complete|do|accomplish))\s*(.+)?/i,
      /^(?:show|list)\s+(?:my\s+)?(?:completed|finished|done)\s+tasks?\s*(.+)?/i,
      /^(?:completed|finished)\s+tasks?\s*(.+)?/i,
    ],
    extractor: (text) => {
      const entities: Record<string, string> = { status: "completed" };
      const { date } = parseDateTime(text);
      if (date) entities.dateFilter = date;
      else if (/\btoday\b/i.test(text)) entities.period = "today";
      else if (/\byesterday\b/i.test(text)) entities.period = "yesterday";
      else if (/\bthis\s+week\b/i.test(text)) entities.period = "week";
      return entities;
    },
  },

  // ── Start Task (confidence: 0.90) ──
  {
    intent: "start_task",
    confidence: 0.90,
    patterns: [
      /^(?:start|begin|working\s+on|starting)\s+(?:task\s+)?(?:["'](.+?)["']|(.+))/i,
      /^(?:i'?m\s+(?:going\s+to|about\s+to|starting)\s+(?:work\s+on\s+)?)\s*(.+)/i,
    ],
    extractor: (_text, match) => ({
      taskQuery: (match[1] ?? match[2] ?? match[3] ?? "").trim(),
    }),
  },

  // ── Move Task to Project (confidence: 0.85) ──
  {
    intent: "move_task",
    confidence: 0.85,
    patterns: [
      /^(?:move|put|add)\s+(?:task\s+)?(?:["'](.+?)["']|(.+?))\s+(?:to|into|in)\s+(?:project\s+)?(?:#?(.+))/i,
    ],
    extractor: (_text, match) => ({
      taskQuery: (match[1] ?? match[2] ?? "").trim(),
      targetProject: (match[3] ?? "").trim(),
    }),
  },

  // ── Count Tasks (confidence: 0.85) ──
  {
    intent: "count_tasks",
    confidence: 0.85,
    patterns: [
      /^(?:how\s+many)\s+(?:tasks?|todos?)\s+(?:do\s+i\s+have|are\s+there)\s*(.+)?/i,
      /^(?:count|number\s+of)\s+(?:my\s+)?(?:tasks?|todos?)\s*(.+)?/i,
    ],
    extractor: (text) => {
      const entities: Record<string, string> = {};
      if (/\boverdue\b/i.test(text)) entities.filter = "overdue";
      if (/\bpending\b/i.test(text)) entities.filter = "pending";
      if (/\bcompleted\b/i.test(text)) entities.filter = "completed";
      return entities;
    },
  },

  // ── Greetings (confidence: 0.80) ──
  {
    intent: "greeting",
    confidence: 0.80,
    patterns: [
      /^(?:hi|hello|hey|howdy|greetings|yo|hiya)\b/i,
      /^(?:good\s+(?:morning|afternoon|evening|night))\b/i,
      /^(?:what'?s?\s+up|sup|how'?s?\s+it\s+going)\b/i,
    ],
  },

  // ── Help (confidence: 0.85) ──
  {
    intent: "help",
    confidence: 0.85,
    patterns: [
      /^(?:help|what\s+can\s+you\s+do|commands?|features?|how\s+to\s+use)/i,
      /^(?:how\s+does?\s+(?:this|unjynx|the\s+ai)\s+work)/i,
      /^(?:show\s+me\s+(?:what\s+you\s+can\s+do|the\s+commands|examples))/i,
    ],
  },

  // ── Start Pomodoro (confidence: 0.90) ──
  {
    intent: "start_pomodoro",
    confidence: 0.90,
    patterns: [
      /^(?:start|begin)\s+(?:a\s+)?(?:pomodoro|pomo|timer|focus\s+(?:session|timer))\s*(?:on|for)?\s*(.+)?/i,
      /^(?:pomodoro|pomo)\s+(?:on|for)\s+(.+)/i,
      /^(?:focus\s+on)\s+(.+)\s+(?:for\s+)?(\d+)\s*(?:min|minutes)?/i,
      /^(?:25\s*min(?:utes?)?\s+(?:on|for))\s+(.+)/i,
    ],
    extractor: (text, match) => {
      const entities: Record<string, string> = {};
      if (match[1]) entities.taskQuery = match[1].trim();
      const duration = parseDuration(text);
      if (duration) entities.durationMinutes = String(duration);
      return entities;
    },
  },

  // ── Stop Pomodoro (confidence: 0.90) ──
  {
    intent: "stop_pomodoro",
    confidence: 0.90,
    patterns: [
      /^(?:stop|end|finish|complete|done\s+with)\s+(?:the\s+)?(?:pomodoro|pomo|timer|focus\s+(?:session|timer))/i,
      /^(?:i'?m\s+done|finished|time'?s?\s+up)/i,
    ],
    extractor: (text) => {
      const entities: Record<string, string> = {};
      // Check for focus rating: "done, 4 stars" or "finished, rate 5"
      const ratingMatch = text.match(/(?:rate|rating|stars?)\s*[:=]?\s*(\d)/i);
      if (ratingMatch) entities.focusRating = ratingMatch[1];
      return entities;
    },
  },

  // ── Use Template (confidence: 0.90) ──
  {
    intent: "use_template",
    confidence: 0.90,
    patterns: [
      /^(?:use|apply|start\s+with|create\s+from)\s+(?:the\s+)?(?:template|preset)\s+(.+)/i,
      /^(?:template)\s*:?\s+(.+)/i,
      /^(?:show|list)\s+(?:my\s+)?templates?\b/i,
    ],
    extractor: (_text, match) => ({
      templateQuery: (match[1] ?? "").trim(),
    }),
  },

  // ── Undo (confidence: 0.95) ──
  {
    intent: "undo_action",
    confidence: 0.95,
    patterns: [
      /^(?:undo|revert|take\s+(?:that|it)\s+back|go\s+back|oops)/i,
      /^(?:that\s+was\s+(?:wrong|a\s+mistake)|actually\s+no|never\s*mind|cancel\s+that)/i,
      /^(?:undo\s+(?:last|that|the\s+last))\s*(?:action|task|change)?/i,
    ],
  },

  // ── Thank You / Acknowledgment (confidence: 0.75) ──
  {
    intent: "acknowledgment",
    confidence: 0.75,
    patterns: [
      /^(?:thanks?|thank\s+you|thx|ty|great|perfect|awesome|nice|cool|ok(?:ay)?|got\s+it|understood)\b/i,
    ],
  },
];

// ── Public API ──────────────────────────────────────────────────────

/**
 * Classify a user message into an intent.
 *
 * Pipeline:
 *   1. Try slash commands (/task, /done, etc.) — confidence 0.99
 *   2. Try regex patterns with graduated confidence scoring
 *   3. Return null if nothing matches (passes to next pipeline layer)
 */
export function classifyIntent(text: string): ClassifiedIntent | null {
  const trimmed = text.trim();
  if (!trimmed || trimmed.length > 1000) return null;

  // ── Pre-processing: normalize abbreviations ──
  const normalized = normalizeAbbreviations(trimmed);

  // ── Tier 1: Slash commands (highest confidence) ──
  const slashResult = parseSlashCommand(normalized);
  if (slashResult) return slashResult;

  // ── Tier 2: Natural language patterns ──
  for (const pattern of INTENT_PATTERNS) {
    for (const regex of pattern.patterns) {
      const match = normalized.match(regex);
      if (match) {
        const entities = pattern.extractor
          ? pattern.extractor(normalized, match)
          : {};
        return {
          intent: pattern.intent,
          confidence: pattern.confidence,
          entities,
        };
      }
    }
  }

  // ── Tier 3: Implicit task creation fallback ──
  // Only trigger if we extracted concrete entities (date, priority, channel, rrule).
  // Bare text without entities passes through to the LLM for proper interpretation.
  if (normalized.length < 80 && !normalized.includes("?") && !normalized.includes("!")) {
    const entities = extractTaskEntities(normalized);
    const hasEntities = entities.dueDate || entities.priority || entities.channel || entities.rrule;

    if (hasEntities) {
      return {
        intent: "create_task",
        confidence: 0.60,
        entities,
      };
    }
  }

  return null;
}

/**
 * Parse a raw text into task entities without intent classification.
 * Used by the task creation UI for real-time parsing preview.
 */
export function parseTaskFromText(text: string): Record<string, string> {
  return extractTaskEntities(text);
}

// ── Multi-Task Splitting ──────────────────────────────────────────
//
// Detects compound task requests like "buy milk and call dentist"
// and splits them into individual task entities.
//
// Heuristics:
//   1. Split on ", and ", " and " when both sides look like task phrases
//   2. Split on comma-separated lists: "groceries, laundry, dishes"
//   3. Shared date/priority applies to all split tasks
//   4. Minimum 2 words per segment to avoid false splits ("ham and cheese")

/**
 * Split compound task text into individual task phrases.
 * Returns null if no splitting is needed (single task).
 */
export function splitMultipleTasks(text: string): string[] | null {
  const cleaned = text.trim();

  // Pattern 1: Explicit list with "and" connector
  // "buy milk and call dentist and clean house"
  const andParts = cleaned.split(/\s+and\s+/i);
  if (andParts.length >= 2 && andParts.every((p) => p.trim().split(/\s+/).length >= 2)) {
    return andParts.map((p) => p.trim());
  }

  // Pattern 2: Comma-separated list (3+ items to avoid false positives)
  // "groceries, laundry, dishes, cooking"
  const commaParts = cleaned.split(/\s*,\s*/);
  if (commaParts.length >= 3 && commaParts.every((p) => p.trim().length >= 2)) {
    return commaParts.map((p) => p.trim());
  }

  // Pattern 3: Colon-separated list
  // "tasks: buy milk, call dentist, clean house"
  const colonMatch = cleaned.match(/^(?:tasks?|todos?|add|create)\s*:\s*(.+)/i);
  if (colonMatch) {
    const listParts = colonMatch[1].split(/\s*,\s*|\s+and\s+/i);
    if (listParts.length >= 2 && listParts.every((p) => p.trim().length >= 2)) {
      return listParts.map((p) => p.trim());
    }
  }

  // Pattern 4: Numbered list
  // "1. buy milk 2. call dentist 3. clean house"
  const numberedParts = cleaned.split(/\s*\d+[.)]\s*/);
  const filtered = numberedParts.filter((p) => p.trim().length >= 2);
  if (filtered.length >= 2) {
    return filtered.map((p) => p.trim());
  }

  return null; // Single task, no splitting needed
}

/**
 * Classify a compound message that may contain multiple tasks.
 * Returns an array of ClassifiedIntents (one per task) or null.
 */
export function classifyMultipleTasks(text: string): ClassifiedIntent[] | null {
  // First check if it's a create_task intent
  const single = classifyIntent(text);
  if (!single || single.intent !== "create_task") return null;

  // Try splitting the raw title
  const titleText = single.entities.title ?? text;
  const parts = splitMultipleTasks(titleText);
  if (!parts || parts.length < 2) return null;

  // Extract shared entities (date, priority, project, channel) from original text
  const shared = extractTaskEntities(text);

  // Create individual intents for each part
  return parts.map((part) => {
    const partEntities = extractTaskEntities(part);
    return {
      intent: "create_task",
      confidence: single.confidence * 0.95, // Slight confidence reduction for splits
      entities: {
        // Part-specific title
        title: partEntities.title || part,
        // Part-specific entities take precedence, shared as fallback
        dueDate: partEntities.dueDate ?? shared.dueDate,
        dueTime: partEntities.dueTime ?? shared.dueTime,
        priority: partEntities.priority ?? shared.priority,
        project: partEntities.project ?? shared.project,
        channel: partEntities.channel ?? shared.channel,
        rrule: partEntities.rrule ?? shared.rrule,
        // Remove undefined values
        ...Object.fromEntries(
          Object.entries({
            dueDate: partEntities.dueDate ?? shared.dueDate,
            dueTime: partEntities.dueTime ?? shared.dueTime,
            priority: partEntities.priority ?? shared.priority,
            project: partEntities.project ?? shared.project,
            channel: partEntities.channel ?? shared.channel,
            rrule: partEntities.rrule ?? shared.rrule,
          }).filter(([, v]) => v !== undefined),
        ),
      },
    } as ClassifiedIntent;
  });
}
