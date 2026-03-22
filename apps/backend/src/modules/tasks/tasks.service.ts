import type { Task, NewTask } from "../../db/schema/index.js";
import type {
  CreateTaskInput,
  UpdateTaskInput,
  TaskQuery,
  CursorQuery,
} from "./tasks.schema.js";
import * as taskRepo from "./tasks.repository.js";
import * as calendarService from "../calendar/calendar.service.js";

// ── Calendar Sync Helpers ────────────────────────────────────────────
// Calendar sync is fire-and-forget: failures NEVER break task operations.

async function syncCalendarCreate(
  userId: string,
  task: Task,
): Promise<void> {
  if (!task.dueDate) return;

  try {
    await calendarService.createCalendarEvent(userId, {
      taskId: task.id,
      title: task.title,
      dueDate: task.dueDate,
      description: task.description ?? undefined,
    });
  } catch {
    // Calendar sync failure must never break task operations
  }
}

async function syncCalendarUpdate(
  userId: string,
  taskId: string,
  input: UpdateTaskInput,
): Promise<void> {
  try {
    await calendarService.updateCalendarEvent(userId, taskId, {
      title: input.title,
      dueDate: input.dueDate ?? undefined,
      description: input.description,
    });
  } catch {
    // Calendar sync failure must never break task operations
  }
}

async function syncCalendarDelete(
  userId: string,
  taskId: string,
): Promise<void> {
  try {
    await calendarService.deleteCalendarEvent(userId, taskId);
  } catch {
    // Calendar sync failure must never break task operations
  }
}

async function syncCalendarComplete(
  userId: string,
  taskId: string,
): Promise<void> {
  try {
    await calendarService.updateCalendarEvent(userId, taskId, {
      description: `[Completed] Task marked done at ${new Date().toISOString()}`,
    });
  } catch {
    // Calendar sync failure must never break task operations
  }
}

// ── CRUD ─────────────────────────────────────────────────────────────

export async function createTask(
  userId: string,
  input: CreateTaskInput,
): Promise<Task> {
  const newTask: NewTask = {
    userId,
    title: input.title,
    description: input.description,
    projectId: input.projectId,
    priority: input.priority,
    dueDate: input.dueDate,
    rrule: input.rrule,
  };

  const task = await taskRepo.insertTask(newTask);

  // Fire-and-forget: sync to Google Calendar if task has a due date
  void syncCalendarCreate(userId, task);

  return task;
}

export async function getTasks(
  userId: string,
  query: TaskQuery,
): Promise<{ items: Task[]; total: number }> {
  const offset = (query.page - 1) * query.limit;

  return taskRepo.findTasks(
    userId,
    {
      status: query.status,
      priority: query.priority,
      projectId: query.projectId,
    },
    query.limit,
    offset,
  );
}

export async function getTaskById(
  userId: string,
  taskId: string,
): Promise<Task | undefined> {
  return taskRepo.findTaskById(userId, taskId);
}

export async function updateTask(
  userId: string,
  taskId: string,
  input: UpdateTaskInput,
): Promise<Task | undefined> {
  const updates: Partial<NewTask> & { updatedAt: Date } = {
    ...input,
    updatedAt: new Date(),
  };

  // Business logic: auto-set completedAt based on status
  if (input.status === "completed") {
    updates.completedAt = new Date();
  } else if (input.status) {
    updates.completedAt = null;
  }

  const task = await taskRepo.updateTaskById(userId, taskId, updates);

  // Fire-and-forget: sync changes to Google Calendar
  if (task && (input.title || input.dueDate !== undefined || input.description !== undefined)) {
    void syncCalendarUpdate(userId, taskId, input);
  }

  return task;
}

export async function deleteTask(
  userId: string,
  taskId: string,
): Promise<boolean> {
  const deleted = await taskRepo.deleteTaskById(userId, taskId);

  // Fire-and-forget: remove from Google Calendar
  if (deleted) {
    void syncCalendarDelete(userId, taskId);
  }

  return deleted;
}

// ── Task Actions ───────────────────────────────────────────────────────

export async function completeTask(
  userId: string,
  taskId: string,
): Promise<Task | undefined> {
  const task = await taskRepo.updateTaskById(userId, taskId, {
    status: "completed",
    completedAt: new Date(),
    updatedAt: new Date(),
  });

  // Fire-and-forget: mark event as completed on Google Calendar
  if (task) {
    void syncCalendarComplete(userId, taskId);
  }

  return task;
}

export async function uncompleteTask(
  userId: string,
  taskId: string,
): Promise<Task | undefined> {
  return taskRepo.updateTaskById(userId, taskId, {
    status: "pending",
    completedAt: null,
    updatedAt: new Date(),
  });
}

export async function snoozeTask(
  userId: string,
  taskId: string,
  minutes: number,
): Promise<Task | undefined> {
  const task = await taskRepo.findTaskById(userId, taskId);

  if (!task) {
    return undefined;
  }

  const baseDate = task.dueDate ?? new Date();
  const newDueDate = new Date(baseDate.getTime() + minutes * 60 * 1000);

  return taskRepo.updateTaskById(userId, taskId, {
    dueDate: newDueDate,
    updatedAt: new Date(),
  });
}

export async function moveTask(
  userId: string,
  taskId: string,
  projectId: string | null,
): Promise<Task | undefined> {
  return taskRepo.updateTaskById(userId, taskId, {
    projectId,
    updatedAt: new Date(),
  });
}

export async function duplicateTask(
  userId: string,
  taskId: string,
): Promise<Task | undefined> {
  return taskRepo.duplicateTask(userId, taskId);
}

// ── Calendar View ─────────────────────────────────────────────────────

export async function getTasksForCalendar(
  userId: string,
  start: Date,
  end: Date,
): Promise<taskRepo.CalendarTask[]> {
  return taskRepo.findTasksForCalendar(userId, start, end);
}

// ── Bulk Operations ────────────────────────────────────────────────────

export async function bulkCreateTasks(
  userId: string,
  inputs: readonly CreateTaskInput[],
): Promise<Task[]> {
  const newTasks: NewTask[] = inputs.map((input) => ({
    userId,
    title: input.title,
    description: input.description,
    projectId: input.projectId,
    priority: input.priority,
    dueDate: input.dueDate,
    rrule: input.rrule,
  }));

  return taskRepo.bulkInsertTasks(newTasks);
}

export async function bulkUpdateTasks(
  userId: string,
  inputs: ReadonlyArray<{
    readonly id: string;
    readonly title?: string;
    readonly description?: string | null;
    readonly projectId?: string | null;
    readonly status?: "pending" | "in_progress" | "completed" | "cancelled";
    readonly priority?: "none" | "low" | "medium" | "high" | "urgent";
    readonly dueDate?: Date | null;
    readonly rrule?: string | null;
    readonly sortOrder?: number;
  }>,
): Promise<Task[]> {
  const updates = inputs.map(({ id, ...rest }) => {
    const data: Partial<NewTask> & { updatedAt: Date } = {
      ...rest,
      updatedAt: new Date(),
    };

    // Business logic: auto-set completedAt based on status
    if (rest.status === "completed") {
      data.completedAt = new Date();
    } else if (rest.status) {
      data.completedAt = null;
    }

    return { id, data };
  });

  return taskRepo.bulkUpdateTasks(userId, updates);
}

export async function bulkDeleteTasks(
  userId: string,
  ids: readonly string[],
): Promise<number> {
  return taskRepo.bulkDeleteTasks(userId, ids);
}

// ── Cursor-Based Pagination ────────────────────────────────────────────

export async function getTasksWithCursor(
  userId: string,
  query: CursorQuery,
): Promise<taskRepo.CursorPaginationResult> {
  return taskRepo.findTasksWithCursor(
    userId,
    {
      status: query.status,
      priority: query.priority,
      projectId: query.projectId,
      search: query.search,
      dueBefore: query.dueBefore,
      dueAfter: query.dueAfter,
    },
    query.sort,
    query.limit,
    query.cursor,
  );
}
