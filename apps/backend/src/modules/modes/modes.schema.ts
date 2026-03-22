import { z } from "zod";

export const setActiveModeSchema = z.object({
  slug: z.string().min(1).max(50),
});

export type SetActiveModeInput = z.infer<typeof setActiveModeSchema>;
