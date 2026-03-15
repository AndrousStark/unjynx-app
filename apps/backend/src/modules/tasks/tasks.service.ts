import type { Task, NewTask } from "../../db/schema/index.js";
import type {
  CreateTaskInput,
  UpdateTaskInput,
  TaskQuery,
  CursorQuery,
} from "./tasks.schema.js";
import * as taskRepo from "./tasks.repository.js";

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

  return taskRepo.insertTask(newTask);
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

  return taskRepo.updateTaskById(userId, taskId, updates);
}

export async function deleteTask(
  userId: string,
  taskId: string,
): Promise<boolean> {
  return taskRepo.deleteTaskById(userId, taskId);
}

// ── Task Actions ───────────────────────────────────────────────────────

export async function completeTask(
  userId: string,
  taskId: string,
): Promise<Task | undefined> {
  return taskRepo.updateTaskById(userId, taskId, {
    status: "completed",
    completedAt: new Date(),
    updatedAt: new Date(),
  });
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
