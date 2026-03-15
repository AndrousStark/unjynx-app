import { z } from "zod";

export const createTeamSchema = z.object({
  name: z.string().min(1).max(100),
  logoUrl: z.string().url().optional(),
  maxMembers: z.number().int().min(2).max(500).default(50),
});

export const updateTeamSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  logoUrl: z.string().url().nullable().optional(),
  maxMembers: z.number().int().min(2).max(500).optional(),
});

export const inviteMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum(["admin", "member", "viewer"]).default("member"),
});

export const updateMemberRoleSchema = z.object({
  role: z.enum(["admin", "member", "viewer"]),
});

export const submitStandupSchema = z.object({
  doneYesterday: z.array(z.string().max(500)).max(20).default([]),
  plannedToday: z.array(z.string().max(500)).max(20).default([]),
  blockers: z.string().max(2000).nullable().optional(),
});

export const standupQuerySchema = z.object({
  date: z.coerce.date().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const teamReportsQuerySchema = z.object({
  period: z.enum(["week", "month"]).default("week"),
});

export type CreateTeamInput = z.infer<typeof createTeamSchema>;
export type UpdateTeamInput = z.infer<typeof updateTeamSchema>;
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;
export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>;
export type SubmitStandupInput = z.infer<typeof submitStandupSchema>;
export type StandupQuery = z.infer<typeof standupQuerySchema>;
export type TeamReportsQuery = z.infer<typeof teamReportsQuerySchema>;
