import { z } from "zod";

export const createSubtaskSchema = z.object({
  title: z.string().min(1).max(500),
});

export const updateSubtaskSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  isCompleted: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

export const reorderSubtasksSchema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(100),
});

export const subtaskQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateSubtaskInput = z.infer<typeof createSubtaskSchema>;
export type UpdateSubtaskInput = z.infer<typeof updateSubtaskSchema>;
export type ReorderSubtasksInput = z.infer<typeof reorderSubtasksSchema>;
export type SubtaskQuery = z.infer<typeof subtaskQuerySchema>;
