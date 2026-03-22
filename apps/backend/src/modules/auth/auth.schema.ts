import { z } from "zod";

// ── Auth Callback (exchange code for tokens) ────────────────────────────
export const callbackSchema = z.object({
  code: z.string().min(1),
  codeVerifier: z.string().min(43).max(128),
  redirectUri: z.string().url(),
});

// ── Token Refresh ───────────────────────────────────────────────────────
export const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

// ── Password Reset Request ──────────────────────────────────────────────
export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

// ── Password Reset Confirmation ─────────────────────────────────────────
export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8).max(128),
});

// ── Profile Update ──────────────────────────────────────────────────────
export const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  // Accept a valid URL or null to clear the avatar.
  avatarUrl: z.union([z.string().url(), z.null()]).optional(),
  timezone: z.string().min(1).max(50).optional(),
});

// ── Type Exports ────────────────────────────────────────────────────────
export type CallbackInput = z.infer<typeof callbackSchema>;
export type RefreshInput = z.infer<typeof refreshSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
