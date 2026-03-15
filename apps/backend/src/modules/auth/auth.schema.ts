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

// ── Type Exports ────────────────────────────────────────────────────────
export type CallbackInput = z.infer<typeof callbackSchema>;
export type RefreshInput = z.infer<typeof refreshSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
