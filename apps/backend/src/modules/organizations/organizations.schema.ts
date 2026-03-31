import { z } from "zod";

const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{0,48}[a-z0-9])?$/;

export const createOrgSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z
    .string()
    .min(2)
    .max(50)
    .regex(SLUG_RE, "Slug must be lowercase alphanumeric with hyphens, 2-50 chars"),
  logoUrl: z.string().url().optional(),
  industryMode: z.string().max(50).optional(),
});

export const updateOrgSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  slug: z
    .string()
    .min(2)
    .max(50)
    .regex(SLUG_RE)
    .optional(),
  logoUrl: z.string().url().nullable().optional(),
  industryMode: z.string().max(50).nullable().optional(),
  settings: z
    .object({
      timezone: z.string().max(50).optional(),
      language: z.string().max(10).optional(),
      defaultProjectType: z.string().max(30).optional(),
      requireMfa: z.boolean().optional(),
    })
    .optional(),
});

export const inviteToOrgSchema = z.object({
  email: z.string().email(),
  role: z.enum(["admin", "manager", "member", "viewer", "guest"]).default("member"),
});

export const updateOrgMemberSchema = z.object({
  role: z.enum(["admin", "manager", "member", "viewer", "guest"]),
});

export const orgIdParamSchema = z.object({
  orgId: z.string().uuid(),
});

export const memberIdParamSchema = z.object({
  orgId: z.string().uuid(),
  userId: z.string().uuid(),
});

export type CreateOrgInput = z.infer<typeof createOrgSchema>;
export type UpdateOrgInput = z.infer<typeof updateOrgSchema>;
export type InviteToOrgInput = z.infer<typeof inviteToOrgSchema>;
export type UpdateOrgMemberInput = z.infer<typeof updateOrgMemberSchema>;
