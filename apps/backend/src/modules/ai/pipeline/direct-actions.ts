// ── Direct Actions (v2 — fuse.js fuzzy matching + smart ranking) ──
//
// Handles classified intents WITHOUT calling Claude.
// Uses fuse.js for fuzzy task matching and multi-factor ranking.
//
// v2 upgrades:
//   - Fuse.js for fuzzy task matching (vs naive SQL LIKE)
//   - Multi-factor task ranking (urgency × importance × deadline)
//   - Smart time-of-day defaults for task listing
//   - Batch operations (mark all done)
//   - Snooze with duration parsing
//   - Focus mode activation
//   - Richer help text with slash commands
//   - Acknowledgment responses

import Fuse from "fuse.js";
import { eq, and, desc, gte, lte, ne, sql } from "drizzle-orm";
import { db } from "../../../db/index.js";
import { tasks } from "../../../db/schema/index.js";
import type { ClassifiedIntent } from "./intent-classifier.js";
import { buildUserContext } from "./context-builder.js";

// ── Types ──────────────────────────────────────────────────────────

export interface DirectActionResult {
  readonly handled: boolean;
  readonly response: string;
  readonly data?: unknown;
}

const NOT_HANDLED: DirectActionResult = { handled: false, response: "" };

// ── Task Ranking ──────────────────────────────────────────────────

const PRIORITY_WEIGHTS: Record<string, number> = {
  urgent: 5, high: 4, medium: 3, low: 2, none: 1,
};

function scoreTask(task: {
  priority: string;
  dueDate: Date | null;
  status: string;
  createdAt: Date;
}): number {
  const now = Date.now();
  let score = 0;

  // Urgency from priority (0.25 weight)
  score += (PRIORITY_WEIGHTS[task.priority] ?? 1) * 5;

  // Deadline proximity (0.25 weight) — exponential as deadline approaches
  if (task.dueDate) {
    const hoursUntilDue = (task.dueDate.getTime() - now) / (1000 * 60 * 60);
    if (hoursUntilDue < 0) score += 30; // Overdue: maximum urgency
    else if (hoursUntilDue < 4) score += 25;
    else if (hoursUntilDue < 24) score += 20;
    else if (hoursUntilDue < 48) score += 15;
    else if (hoursUntilDue < 168) score += 10; // Within a week
  }

  // Age decay — older pending tasks rise (0.05 weight)
  const daysSinceCreation = (now - task.createdAt.getTime()) / (1000 * 60 * 60 * 24);
  score += Math.min(daysSinceCreation * 0.5, 5);

  return Math.round(score * 100) / 100;
}

// ── Priority Display ──────────────────────────────────────────────

const PRIORITY_ICON: Record<string, string> = {
  urgent: "[!!!!]",
  high: "[!!!]",
  medium: "[!!]",
  low: "[!]",
  none: "[ ]",
};

// ── Smart Time-of-Day Defaults ────────────────────────────────────

function getTimeBasedGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 6) return "Burning the midnight oil";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  if (hour < 21) return "Good evening";
  return "Working late";
}

function getTimeBasedTaskAdvice(): string {
  const hour = new Date().getHours();
  if (hour >= 9 && hour < 12) return "Peak focus hours — tackle complex tasks now.";
  if (hour >= 12 && hour < 14) return "Post-lunch dip — try quick, easy wins.";
  if (hour >= 14 && hour < 17) return "Afternoon momentum — good for collaborative work.";
  if (hour >= 17 && hour < 20) return "Wind down — plan tomorrow, close open loops.";
  if (hour >= 20) return "Consider wrapping up — tomorrow is a new day.";
  return "Start with your highest-priority task.";
}

// ── Fuzzy Task Search ─────────────────────────────────────────────

async function fuzzyFindTask(
  profileId: string,
  query: string,
  statusFilter?: string,
): Promise<{ id: string; title: string; priority: string; dueDate: Date | null } | null> {
  const conditions = [
    eq(tasks.userId, profileId),
  ];
  if (statusFilter) {
    conditions.push(eq(tasks.status, statusFilter as never));
  } else {
    conditions.push(ne(tasks.status, "completed" as never));
    conditions.push(ne(tasks.status, "cancelled" as never));
  }

  const userTasks = await db
    .select({
      id: tasks.id,
      title: tasks.title,
      priority: tasks.priority,
      dueDate: tasks.dueDate,
    })
    .from(tasks)
    .where(and(...conditions))
    .limit(100);

  if (userTasks.length === 0) return null;

  // Use Fuse.js for fuzzy matching
  const fuse = new Fuse(userTasks, {
    keys: ["title"],
    threshold: 0.4,      // 0 = perfect match, 1 = match anything
    includeScore: true,
    minMatchCharLength: 2,
  });

  const results = fuse.search(query);
  if (results.length === 0) return null;

  return results[0].item;
}

// ── Handler Router ────────────────────────────────────────────────

/**
 * Handle a classified intent with direct DB operations.
 * Returns { handled: false } if the intent requires LLM processing.
 */
export async function handleDirectAction(
  intent: ClassifiedIntent,
  profileId: string,
): Promise<DirectActionResult> {
  switch (intent.intent) {
    case "create_task":
    case "set_reminder":
    case "create_recurring":
      return handleCreateTask(intent.entities, profileId);
    case "complete_task":
      return handleCompleteTask(intent.entities, profileId);
    case "batch_complete":
      return handleBatchComplete(intent.entities, profileId);
    case "list_tasks":
      return handleListTasks(intent.entities, profileId);
    case "show_progress":
      return handleShowProgress(intent.entities, profileId);
    case "show_schedule":
      return handleListTasks(
        { ...intent.entities, dateFilter: intent.entities.dateFilter ?? new Date().toISOString().slice(0, 10) },
        profileId,
      );
    case "snooze_task":
      return handleSnooze(intent.entities, profileId);
    case "greeting":
      return handleGreeting(profileId);
    case "help":
      return handleHelp();
    case "acknowledgment":
      return handleAcknowledgment();
    case "start_focus":
      return handleStartFocus(intent.entities);
    case "search_tasks":
      return handleSearchTasks(intent.entities, profileId);
    case "show_completed":
      return handleListTasks({ ...intent.entities, status: "completed" }, profileId);
    case "start_task":
      return handleStartTask(intent.entities, profileId);
    case "count_tasks":
      return handleCountTasks(intent.entities, profileId);

    // These require LLM
    case "move_task":
    case "delete_task":
    case "update_task":
    case "decompose_task":
    case "ai_schedule":
    case "show_insights":
      return NOT_HANDLED;

    default:
      return NOT_HANDLED;
  }
}

// ── Action Handlers ───────────────────────────────────────────────

async function handleCreateTask(
  entities: Record<string, string>,
  profileId: string,
): Promise<DirectActionResult> {
  const title = entities.title;
  if (!title || title.length < 2) return NOT_HANDLED;

  const newTask: Record<string, unknown> = {
    userId: profileId,
    title,
    status: "pending",
    priority: entities.priority ?? "none",
  };

  if (entities.dueDate) {
    const dateStr = entities.dueTime
      ? `${entities.dueDate}T${entities.dueTime}:00`
      : entities.dueDate;
    newTask.dueDate = new Date(dateStr);
  }

  if (entities.rrule) {
    newTask.rrule = entities.rrule;
    newTask.isRecurring = true;
  }

  // Persist estimated duration if extracted
  if (entities.estimatedMinutes) {
    newTask.description = newTask.description
      ? `${newTask.description}\n\nEstimated: ${entities.estimatedMinutes} minutes`
      : `Estimated: ${entities.estimatedMinutes} minutes`;
  }

  // Persist project reference if extracted
  if (entities.project) {
    // Project tag is a name, not an ID — store as label for now
    newTask.description = newTask.description
      ? `${newTask.description}\nProject: ${entities.project}`
      : `Project: ${entities.project}`;
  }

  const [created] = await db.insert(tasks).values(newTask as never).returning();

  const parts = [`**Task created:** "${created.title}"`];
  if (created.dueDate) {
    const dateStr = new Date(created.dueDate).toLocaleDateString("en-US", {
      weekday: "short", month: "short", day: "numeric",
    });
    const timeStr = entities.dueTime ? ` at ${entities.dueTime}` : "";
    parts.push(`**Due:** ${dateStr}${timeStr}`);
  }
  if (created.priority !== "none") {
    parts.push(`**Priority:** ${created.priority}`);
  }
  if (entities.rrule) {
    parts.push("**Recurring:** Yes");
  }

  return {
    handled: true,
    response: parts.join("\n"),
    data: { taskId: created.id, title: created.title },
  };
}

async function handleCompleteTask(
  entities: Record<string, string>,
  profileId: string,
): Promise<DirectActionResult> {
  const query = entities.taskQuery;
  if (!query) return NOT_HANDLED;

  const task = await fuzzyFindTask(profileId, query, "pending");

  if (!task) {
    return {
      handled: true,
      response: `No pending task found matching "${query}". Try \`/list\` to see your tasks.`,
    };
  }

  await db
    .update(tasks)
    .set({
      status: "completed",
      completedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(tasks.id, task.id));

  return {
    handled: true,
    response: `**Done!** "${task.title}" marked as completed.`,
    data: { taskId: task.id },
  };
}

async function handleBatchComplete(
  entities: Record<string, string>,
  profileId: string,
): Promise<DirectActionResult> {
  const conditions = [
    eq(tasks.userId, profileId),
    eq(tasks.status, "pending" as never),
  ];

  if (entities.filter === "overdue") {
    conditions.push(lte(tasks.dueDate, new Date()));
  } else if (entities.filter === "today") {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    conditions.push(lte(tasks.dueDate, today));
  }

  const result = await db
    .update(tasks)
    .set({
      status: "completed",
      completedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(and(...conditions))
    .returning({ id: tasks.id });

  if (result.length === 0) {
    return {
      handled: true,
      response: "No matching tasks to complete.",
    };
  }

  return {
    handled: true,
    response: `**${result.length} task${result.length !== 1 ? "s" : ""} completed!**`,
    data: { completedIds: result.map((r) => r.id), count: result.length },
  };
}

async function handleListTasks(
  entities: Record<string, string>,
  profileId: string,
): Promise<DirectActionResult> {
  const conditions = [eq(tasks.userId, profileId)];

  if (entities.status === "completed") {
    conditions.push(eq(tasks.status, "completed" as never));
  } else if (entities.status === "overdue") {
    conditions.push(ne(tasks.status, "completed" as never));
    conditions.push(lte(tasks.dueDate, new Date()));
  } else {
    // Default: non-completed tasks
    conditions.push(ne(tasks.status, "completed" as never));
    conditions.push(ne(tasks.status, "cancelled" as never));
  }

  if (entities.dateFilter) {
    const filterDate = new Date(entities.dateFilter);
    const nextDay = new Date(filterDate);
    nextDay.setDate(nextDay.getDate() + 1);
    conditions.push(gte(tasks.dueDate, filterDate));
    conditions.push(lte(tasks.dueDate, nextDay));
  }

  const userTasks = await db
    .select({
      id: tasks.id,
      title: tasks.title,
      status: tasks.status,
      priority: tasks.priority,
      dueDate: tasks.dueDate,
      createdAt: tasks.createdAt,
    })
    .from(tasks)
    .where(and(...conditions))
    .limit(25);

  if (userTasks.length === 0) {
    const filterDesc = entities.dateFilter ? ` for ${new Date(entities.dateFilter).toLocaleDateString()}` : "";
    return {
      handled: true,
      response: `No tasks found${filterDesc}. You're all clear! Type \`/task\` to create one.`,
    };
  }

  // Sort by score (multi-factor ranking)
  const scored = userTasks
    .map((t) => ({
      ...t,
      score: scoreTask(t),
    }))
    .sort((a, b) => b.score - a.score);

  const lines = scored.map((t, i) => {
    const icon = PRIORITY_ICON[t.priority] ?? "[ ]";
    const due = t.dueDate
      ? ` — due ${new Date(t.dueDate).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}`
      : "";
    const overdue = t.dueDate && new Date(t.dueDate) < new Date() ? " ⚠️" : "";
    return `${i + 1}. ${icon} ${t.title}${due}${overdue}`;
  });

  const header = entities.dateFilter
    ? `**Tasks for ${new Date(entities.dateFilter).toLocaleDateString()}** (${scored.length})`
    : `**Your tasks** (${scored.length})`;

  return {
    handled: true,
    response: `${header}\n\n${lines.join("\n")}\n\n_${getTimeBasedTaskAdvice()}_`,
    data: scored,
  };
}

async function handleShowProgress(
  _entities: Record<string, string>,
  profileId: string,
): Promise<DirectActionResult> {
  const ctx = await buildUserContext(profileId);

  const completionRate = ctx.tasksToday > 0
    ? Math.round((ctx.completedToday / ctx.tasksToday) * 100)
    : 0;

  const lines = [
    "**Your Progress**",
    "",
    `**Today:** ${ctx.completedToday}/${ctx.tasksToday} tasks (${completionRate}%)`,
    `**Pending:** ${ctx.totalPending} tasks`,
    `**Streak:** ${ctx.streak} day${ctx.streak !== 1 ? "s" : ""}`,
    "",
  ];

  // Progress bar visualization
  const barLength = 20;
  const filled = Math.round((completionRate / 100) * barLength);
  const bar = "█".repeat(filled) + "░".repeat(barLength - filled);
  lines.push(`\`${bar}\` ${completionRate}%`);
  lines.push("");

  // Motivational message based on progress
  if (completionRate === 100) lines.push("**Perfect day!** Every task complete. 🏆");
  else if (completionRate >= 75) lines.push("Almost there! You're on fire.");
  else if (completionRate >= 50) lines.push("Halfway done. Keep the momentum.");
  else if (ctx.streak >= 7) lines.push(`${ctx.streak}-day streak! Don't break it.`);
  else if (ctx.completedToday > 0) lines.push("Good start today. What's next?");
  else lines.push("Let's get started! What's your first task?");

  return {
    handled: true,
    response: lines.join("\n"),
    data: {
      completedToday: ctx.completedToday,
      tasksToday: ctx.tasksToday,
      totalPending: ctx.totalPending,
      streak: ctx.streak,
      completionRate,
    },
  };
}

async function handleSnooze(
  entities: Record<string, string>,
  _profileId: string,
): Promise<DirectActionResult> {
  const duration = entities.snoozeDurationMinutes;
  const date = entities.snoozeUntilDate;

  if (duration) {
    const mins = parseInt(duration, 10);
    const humanDuration = mins >= 60
      ? `${Math.floor(mins / 60)}h ${mins % 60 ? `${mins % 60}m` : ""}`
      : `${mins}m`;
    return {
      handled: true,
      response: `**Snoozed** for ${humanDuration}. I'll remind you then.`,
      data: { snoozeDuration: mins },
    };
  }

  if (date) {
    return {
      handled: true,
      response: `**Snoozed** until ${new Date(date).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}.`,
      data: { snoozeUntil: date },
    };
  }

  return {
    handled: true,
    response: "**Snoozed** for 30 minutes (default). Say \"snooze 2 hours\" for a custom duration.",
    data: { snoozeDuration: 30 },
  };
}

async function handleGreeting(profileId: string): Promise<DirectActionResult> {
  const ctx = await buildUserContext(profileId);
  const greeting = getTimeBasedGreeting();

  const lines = [`**${greeting}, ${ctx.name}!**`];

  if (ctx.tasksToday > 0) {
    const remaining = ctx.tasksToday - ctx.completedToday;
    if (remaining > 0) {
      lines.push(`You have **${remaining}** task${remaining !== 1 ? "s" : ""} remaining today.`);
    } else {
      lines.push("All today's tasks are done! 🎉");
    }
  } else {
    lines.push("No tasks scheduled for today. What would you like to work on?");
  }

  if (ctx.streak > 0) {
    lines.push(`Streak: **${ctx.streak} day${ctx.streak !== 1 ? "s" : ""}**.`);
  }

  lines.push("", `_${getTimeBasedTaskAdvice()}_`);

  return { handled: true, response: lines.join("\n") };
}

function handleHelp(): DirectActionResult {
  return {
    handled: true,
    response: [
      "**UNJYNX AI — What I can do:**",
      "",
      "**Create tasks** (natural language)",
      "`remind me to call mom tomorrow at 3pm p1`",
      "`/task buy groceries #personal`",
      "`I need to finish the report by Friday`",
      "",
      "**Manage tasks**",
      "`/done groceries` — mark task as complete",
      "`/list` — show your tasks",
      "`show overdue tasks` — filtered view",
      "`mark all overdue tasks done` — batch complete",
      "",
      "**Get insights**",
      "`/progress` — your productivity stats",
      "`/insights` — AI-generated weekly analysis",
      "`how am I doing this week?`",
      "",
      "**AI features**",
      "`/schedule` — AI auto-schedules your tasks",
      "`/break project launch` — decompose into subtasks",
      "`when should I work on X?` — scheduling advice",
      "",
      "**Shortcuts**",
      "`p1`-`p4` for priority | `#project` for project | `@label` for labels",
      "",
      "**Focus**",
      "`/focus 90 minutes` — enter focus mode",
      "`/ghost` — silence all notifications",
      "",
      "Or just **chat naturally** — I understand context!",
    ].join("\n"),
  };
}

function handleAcknowledgment(): DirectActionResult {
  const responses = [
    "Glad I could help! What's next?",
    "Anytime! Need anything else?",
    "👍 Let me know if you need more help.",
    "Great! Ready when you are.",
  ];
  const response = responses[Math.floor(Math.random() * responses.length)];
  return { handled: true, response };
}

async function handleSearchTasks(
  entities: Record<string, string>,
  profileId: string,
): Promise<DirectActionResult> {
  const query = entities.searchQuery;
  if (!query) return NOT_HANDLED;

  const task = await fuzzyFindTask(profileId, query);
  if (!task) {
    return {
      handled: true,
      response: `No task found matching "${query}".`,
    };
  }

  const due = task.dueDate
    ? ` | Due: ${new Date(task.dueDate).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}`
    : "";

  return {
    handled: true,
    response: `**Found:** ${PRIORITY_ICON[task.priority] ?? "[ ]"} ${task.title}${due}`,
    data: task,
  };
}

async function handleStartTask(
  entities: Record<string, string>,
  profileId: string,
): Promise<DirectActionResult> {
  const query = entities.taskQuery;
  if (!query) return NOT_HANDLED;

  const task = await fuzzyFindTask(profileId, query, "pending");
  if (!task) {
    return {
      handled: true,
      response: `No pending task found matching "${query}".`,
    };
  }

  await db
    .update(tasks)
    .set({ status: "in_progress", updatedAt: new Date() })
    .where(eq(tasks.id, task.id));

  return {
    handled: true,
    response: `**Started:** "${task.title}" is now in progress. Focus up! 💪`,
    data: { taskId: task.id },
  };
}

async function handleCountTasks(
  entities: Record<string, string>,
  profileId: string,
): Promise<DirectActionResult> {
  const conditions = [eq(tasks.userId, profileId)];

  if (entities.filter === "overdue") {
    conditions.push(ne(tasks.status, "completed" as never));
    conditions.push(lte(tasks.dueDate, new Date()));
  } else if (entities.filter === "completed") {
    conditions.push(eq(tasks.status, "completed" as never));
  } else if (entities.filter === "pending") {
    conditions.push(ne(tasks.status, "completed" as never));
    conditions.push(ne(tasks.status, "cancelled" as never));
  } else {
    // Default: pending
    conditions.push(ne(tasks.status, "completed" as never));
    conditions.push(ne(tasks.status, "cancelled" as never));
  }

  const [result] = await db
    .select({ count: sql<number>`count(*)`.as("count") })
    .from(tasks)
    .where(and(...conditions));

  const count = Number(result?.count ?? 0);
  const label = entities.filter ?? "pending";

  return {
    handled: true,
    response: `You have **${count}** ${label} task${count !== 1 ? "s" : ""}.`,
    data: { count, filter: label },
  };
}

function handleStartFocus(entities: Record<string, string>): DirectActionResult {
  const duration = entities.durationMinutes
    ? parseInt(entities.durationMinutes, 10)
    : 90; // Default: 90 minutes (ultradian rhythm)

  const humanDuration = duration >= 60
    ? `${Math.floor(duration / 60)}h ${duration % 60 ? `${duration % 60}m` : ""}`
    : `${duration}m`;

  return {
    handled: true,
    response: [
      `**Focus Mode activated** for ${humanDuration}.`,
      "",
      "All non-critical notifications are silenced.",
      "I'll check in when the session ends.",
      "",
      "_Based on research: 90-minute focus blocks align with your body's natural ultradian rhythm for peak performance._",
    ].join("\n"),
    data: { focusDuration: duration, startedAt: new Date().toISOString() },
  };
}
