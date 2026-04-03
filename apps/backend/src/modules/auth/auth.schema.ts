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

// ── User Registration ───────────────────────────────────────────────────
export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  name: z.string().min(1).max(100),
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

// ── Direct Login ───────────────────────────────────────────────────────
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  deviceInfo: z
    .object({
      deviceType: z.string().optional(),
      os: z.string().optional(),
      appVersion: z.string().optional(),
    })
    .optional(),
});

// ── Social Login (native ID-token flow) ────────────────────────────────
export const socialAuthSchema = z.object({
  provider: z.enum(["google", "apple"]),
  idToken: z.string().min(1),
  deviceInfo: z
    .object({
      deviceType: z.string().optional(),
      os: z.string().optional(),
      appVersion: z.string().optional(),
    })
    .optional(),
});

// ── Email Verification OTP ─────────────────────────────────────────────
export const verifyEmailSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
});

// ── Resend Verification OTP ────────────────────────────────────────────
export const resendVerificationSchema = z.object({
  email: z.string().email(),
});

// ── Type Exports ────────────────────────────────────────────────────────
export type CallbackInput = z.infer<typeof callbackSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type RefreshInput = z.infer<typeof refreshSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type SocialAuthInput = z.infer<typeof socialAuthSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type ResendVerificationInput = z.infer<typeof resendVerificationSchema>;
