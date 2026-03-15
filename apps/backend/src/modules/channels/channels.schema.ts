import { z } from "zod";

// ── Channel Connection Schemas ───────────────────────────────────────

export const connectTelegramSchema = z.object({
  token: z.string().min(1, "Telegram token is required"),
});

export const connectPhoneSchema = z.object({
  phoneNumber: z
    .string()
    .min(4, "Phone number too short")
    .max(15, "Phone number too long")
    .regex(/^\d+$/, "Phone number must contain only digits"),
  countryCode: z
    .string()
    .min(1)
    .max(4)
    .regex(/^\+?\d+$/, "Invalid country code"),
});

export const verifyOtpSchema = z.object({
  phoneNumber: z
    .string()
    .min(4)
    .max(15)
    .regex(/^\d+$/, "Phone number must contain only digits"),
  code: z
    .string()
    .length(6, "OTP must be exactly 6 digits")
    .regex(/^\d{6}$/, "OTP must be 6 digits"),
});

export const connectInstagramSchema = z.object({
  username: z
    .string()
    .min(1, "Instagram username is required")
    .max(30, "Instagram username too long")
    .regex(
      /^[a-zA-Z0-9._]+$/,
      "Invalid Instagram username format",
    ),
});

export const sendTestSchema = z.object({
  channel: z.enum([
    "push",
    "telegram",
    "email",
    "whatsapp",
    "sms",
    "instagram",
    "slack",
    "discord",
  ]),
});

// ── Type Exports ─────────────────────────────────────────────────────

export type ConnectTelegramInput = z.infer<typeof connectTelegramSchema>;
export type ConnectPhoneInput = z.infer<typeof connectPhoneSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
export type ConnectInstagramInput = z.infer<typeof connectInstagramSchema>;
export type SendTestInput = z.infer<typeof sendTestSchema>;
