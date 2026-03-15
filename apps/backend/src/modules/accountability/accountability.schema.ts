import { z } from "zod";

export const createInviteSchema = z.object({
  partnerId: z.string().uuid().optional(),
});

export const sendNudgeSchema = z.object({
  message: z.string().min(1).max(500),
});

export const createSharedGoalSchema = z.object({
  title: z.string().min(1).max(200),
  targetValue: z.number().int().positive(),
  metric: z.enum(["tasks_completed", "streak_days", "focus_minutes"]),
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date(),
});

export type CreateInviteInput = z.infer<typeof createInviteSchema>;
export type SendNudgeInput = z.infer<typeof sendNudgeSchema>;
export type CreateSharedGoalInput = z.infer<typeof createSharedGoalSchema>;
