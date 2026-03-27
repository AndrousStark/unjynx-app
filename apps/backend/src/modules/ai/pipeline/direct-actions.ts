// ── Direct Actions (No LLM Required) ───────────────────────────────
//
// Handles classified intents by performing DB operations directly.
// Saves ~100 tokens per query that would otherwise go to Claude.
//
// Pattern: Intent classifier extracts entities → direct action maps
// them to task/project CRUD → returns formatted response.

import { eq, and, like, desc, gte, sql } from "drizzle-orm";
import { db } from "../../../db/index.js";
import { tasks, progressSnapshots } from "../../../db/schema/index.js";
import type { ClassifiedIntent } from "./intent-classifier.js";
import { buildUserContext } from "./context-builder.js";

export interface DirectActionResult {
  readonly handled: boolean;
  readonly response: string;
  readonly data?: unknown;
}

const NOT_HANDLED: DirectActionResult = { handled: false, response: "" };

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
      return handleCreateTask(intent.entities, profileId);
    case "complete_task":
      return handleCompleteTask(intent.entities, profileId);
    case "list_tasks":
      return handleListTasks(intent.entities, profileId);
    case "show_progress":
      return handleShowProgress(intent.entities, profileId);
    case "show_schedule":
      return handleListTasks({ ...intent.entities, dateFilter: intent.entities.dateFilter ?? new Date().toISOString().slice(0, 10) }, profileId);
    case "greeting":
      return handleGreeting(profileId);
    case "help":
      return handleHelp();
    case "delete_task":
      // Deletion needs confirmation — pass to LLM for conversational flow
      return NOT_HANDLED;
    case "decompose_task":
      // Decomposition requires LLM
      return NOT_HANDLED;
    case "ai_schedule":
      // Scheduling requires LLM
      return NOT_HANDLED;
    default:
      return NOT_HANDLED;
  }
}

// ── Handlers ──────────────────────────────────────────────────────

async function handleCreateTask(
  entities: Record<string, string>,
  profileId: string,
): Promise<DirectActionResult> {
  const title = entities.title;
  if (!title) return NOT_HANDLED;

  const newTask: Record<string, unknown> = {
    userId: profileId,
    title,
    status: "pending",
    priority: entities.priority ?? "none",
  };

  if (entities.dueDate) {
    newTask.dueDate = new Date(entities.dueDate);
  }

  const [created] = await db.insert(tasks).values(newTask as never).returning();

  const parts = [`Task created: "${created.title}"`];
  if (created.dueDate) parts.push(`Due: ${new Date(created.dueDate).toLocaleDateString()}`);
  if (created.priority !== "none") parts.push(`Priority: ${created.priority}`);

  return {
    handled: true,
    response: parts.join(" | "),
    data: { taskId: created.id, title: created.title },
  };
}

async function handleCompleteTask(
  entities: Record<string, string>,
  profileId: string,
): Promise<DirectActionResult> {
  const query = entities.taskQuery;
  if (!query) return NOT_HANDLED;

  // Find task by fuzzy title match
  const [task] = await db
    .select()
    .from(tasks)
    .where(
      and(
        eq(tasks.userId, profileId),
        like(tasks.title, `%${query}%`),
        eq(tasks.status, "pending"),
      ),
    )
    .limit(1);

  if (!task) {
    return {
      handled: true,
      response: `No pending task found matching "${query}". Try listing your tasks first.`,
    };
  }

  await db
    .update(tasks)
    .set({ status: "completed", updatedAt: new Date() })
    .where(eq(tasks.id, task.id));

  return {
    handled: true,
    response: `Done! "${task.title}" marked as completed.`,
    data: { taskId: task.id },
  };
}

async function handleListTasks(
  entities: Record<string, string>,
  profileId: string,
): Promise<DirectActionResult> {
  const conditions = [eq(tasks.userId, profileId)];

  if (entities.status) {
    conditions.push(eq(tasks.status, entities.status as never));
  } else {
    // Default: show non-completed tasks
    conditions.push(
      sql`${tasks.status} IN ('pending', 'in_progress')` as never,
    );
  }

  if (entities.dateFilter) {
    const date = new Date(entities.dateFilter);
    conditions.push(gte(tasks.dueDate, date));
  }

  const userTasks = await db
    .select({
      id: tasks.id,
      title: tasks.title,
      status: tasks.status,
      priority: tasks.priority,
      dueDate: tasks.dueDate,
    })
    .from(tasks)
    .where(and(...conditions))
    .orderBy(desc(tasks.priority), tasks.dueDate)
    .limit(20);

  if (userTasks.length === 0) {
    return {
      handled: true,
      response: "No tasks found. You're all clear! Want to create one?",
    };
  }

  const priorityEmoji: Record<string, string> = {
    urgent: "[!!!]",
    high: "[!!]",
    medium: "[!]",
    low: "[-]",
    none: "[ ]",
  };

  const lines = userTasks.map((t, i) => {
    const emoji = priorityEmoji[t.priority] ?? "[ ]";
    const due = t.dueDate ? ` (due ${new Date(t.dueDate).toLocaleDateString()})` : "";
    return `${i + 1}. ${emoji} ${t.title}${due}`;
  });

  return {
    handled: true,
    response: `Your tasks (${userTasks.length}):\n${lines.join("\n")}`,
    data: userTasks,
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
    `Today: ${ctx.completedToday}/${ctx.tasksToday} tasks (${completionRate}%)`,
    `Pending: ${ctx.totalPending} tasks`,
    `Streak: ${ctx.streak} days`,
  ];

  if (ctx.streak >= 7) lines.push("You're on fire! Keep it up!");
  else if (ctx.streak >= 3) lines.push("Building momentum. Nice work!");
  else if (ctx.completedToday > 0) lines.push("Good start today!");
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

async function handleGreeting(profileId: string): Promise<DirectActionResult> {
  const ctx = await buildUserContext(profileId);
  const hour = ctx.currentHour;

  let greeting: string;
  if (hour < 12) greeting = "Good morning";
  else if (hour < 17) greeting = "Good afternoon";
  else greeting = "Good evening";

  const lines = [`${greeting}, ${ctx.name}!`];

  if (ctx.tasksToday > 0) {
    lines.push(`You have ${ctx.tasksToday - ctx.completedToday} tasks remaining today.`);
  } else {
    lines.push("No tasks scheduled yet. What would you like to work on?");
  }

  if (ctx.streak > 0) {
    lines.push(`Current streak: ${ctx.streak} days.`);
  }

  return { handled: true, response: lines.join(" ") };
}

function handleHelp(): DirectActionResult {
  return {
    handled: true,
    response: [
      "Here's what I can help with:",
      "",
      "**Tasks:** \"Create task buy groceries tomorrow\" | \"Mark task done\" | \"Show my tasks\"",
      "**Progress:** \"Show my progress\" | \"How am I doing?\"",
      "**Schedule:** \"Show my schedule\" | \"What's on my plate?\"",
      "**AI Features:** \"Break down project launch\" | \"Schedule my tasks\" | \"Show insights\"",
      "",
      "You can also just chat with me about productivity, planning, or anything task-related!",
    ].join("\n"),
  };
}
