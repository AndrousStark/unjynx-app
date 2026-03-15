import { z } from "zod";

export const createSectionSchema = z.object({
  name: z.string().min(1).max(200),
});

export const updateSectionSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  sortOrder: z.number().int().optional(),
});

export const reorderSectionsSchema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(50),
});

export type CreateSectionInput = z.infer<typeof createSectionSchema>;
export type UpdateSectionInput = z.infer<typeof updateSectionSchema>;
export type ReorderSectionsInput = z.infer<typeof reorderSectionsSchema>;
