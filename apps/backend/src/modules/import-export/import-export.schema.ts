import { z } from "zod";

export const importPreviewSchema = z.object({
  format: z.enum(["todoist", "ticktick", "generic"]).default("generic"),
  csvContent: z.string().min(1).max(5_000_000),
  delimiter: z.string().max(1).default(","),
});

export const importExecuteSchema = z.object({
  format: z.enum(["todoist", "ticktick", "generic"]).default("generic"),
  csvContent: z.string().min(1).max(5_000_000),
  delimiter: z.string().max(1).default(","),
  columnMapping: z
    .object({
      title: z.string().optional(),
      description: z.string().optional(),
      priority: z.string().optional(),
      dueDate: z.string().optional(),
      project: z.string().optional(),
      status: z.string().optional(),
    })
    .optional(),
  skipDuplicates: z.boolean().default(true),
});

export const exportQuerySchema = z.object({
  format: z.enum(["csv", "json", "ics"]).optional(),
  projectId: z.string().uuid().optional(),
  status: z
    .enum(["pending", "in_progress", "completed", "cancelled"])
    .optional(),
});

export type ImportPreviewInput = z.infer<typeof importPreviewSchema>;
export type ImportExecuteInput = z.infer<typeof importExecuteSchema>;
export type ExportQuery = z.infer<typeof exportQuerySchema>;
