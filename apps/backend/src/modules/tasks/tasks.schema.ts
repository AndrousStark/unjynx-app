import { z } from "zod";

export const createTaskSchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().max(5000).optional(),
  projectId: z.string().uuid().optional(),
  priority: z.enum(["none", "low", "medium", "high", "urgent"]).default("none"),
  dueDate: z.coerce.date().optional(),
  rrule: z.string().max(500).optional(),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  description: z.string().max(5000).nullable().optional(),
  projectId: z.string().uuid().nullable().optional(),
  status: z
    .enum(["pending", "in_progress", "completed", "cancelled"])
    .optional(),
  priority: z.enum(["none", "low", "medium", "high", "urgent"]).optional(),
  dueDate: z.coerce.date().nullable().optional(),
  rrule: z.string().max(500).nullable().optional(),
  sortOrder: z.number().int().optional(),
});

export const taskQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z
    .enum(["pending", "in_progress", "completed", "cancelled"])
    .optional(),
  priority: z.enum(["none", "low", "medium", "high", "urgent"]).optional(),
  projectId: z.string().uuid().optional(),
});

// ── Bulk Operations ────────────────────────────────────────────────────

export const bulkCreateTasksSchema = z.object({
  tasks: z.array(createTaskSchema).min(1).max(50),
});

export const bulkUpdateTasksSchema = z.object({
  tasks: z
    .array(
      z.object({
        id: z.string().uuid(),
        title: z.string().min(1).max(500).optional(),
        description: z.string().max(5000).nullable().optional(),
        projectId: z.string().uuid().nullable().optional(),
        status: z
          .enum(["pending", "in_progress", "completed", "cancelled"])
          .optional(),
        priority: z
          .enum(["none", "low", "medium", "high", "urgent"])
          .optional(),
        dueDate: z.coerce.date().nullable().optional(),
        rrule: z.string().max(500).nullable().optional(),
        sortOrder: z.number().int().optional(),
      }),
    )
    .min(1)
    .max(50),
});

export const bulkDeleteTasksSchema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(50),
});

// ── Task Actions ───────────────────────────────────────────────────────

export const snoozeTaskSchema = z.object({
  minutes: z.number().int().min(1).max(10080),
});

export const moveTaskSchema = z.object({
  projectId: z.string().uuid().nullable(),
});

// ── Cursor-Based Pagination ────────────────────────────────────────────

export const cursorQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  status: z
    .enum(["pending", "in_progress", "completed", "cancelled"])
    .optional(),
  priority: z.enum(["none", "low", "medium", "high", "urgent"]).optional(),
  projectId: z.string().uuid().optional(),
  search: z.string().max(500).optional(),
  sort: z
    .enum([
      "due_at",
      "-due_at",
      "priority",
      "-priority",
      "created_at",
      "-created_at",
      "title",
      "-title",
    ])
    .default("-created_at"),
  dueBefore: z.coerce.date().optional(),
  dueAfter: z.coerce.date().optional(),
});

// ── Type Exports ───────────────────────────────────────────────────────

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type TaskQuery = z.infer<typeof taskQuerySchema>;
export type BulkCreateTasksInput = z.infer<typeof bulkCreateTasksSchema>;
export type BulkUpdateTasksInput = z.infer<typeof bulkUpdateTasksSchema>;
export type BulkDeleteTasksInput = z.infer<typeof bulkDeleteTasksSchema>;
export type SnoozeTaskInput = z.infer<typeof snoozeTaskSchema>;
export type MoveTaskInput = z.infer<typeof moveTaskSchema>;
export type CursorQuery = z.infer<typeof cursorQuerySchema>;
