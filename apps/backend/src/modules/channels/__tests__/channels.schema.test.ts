import { describe, it, expect } from "vitest";
import {
  connectTelegramSchema,
  connectPhoneSchema,
  verifyOtpSchema,
  connectInstagramSchema,
  sendTestSchema,
} from "../channels.schema.js";

describe("Channel Schemas", () => {
  // ── connectTelegramSchema ────────────────────────────────────────────

  describe("connectTelegramSchema", () => {
    it("validates a valid token", () => {
      const result = connectTelegramSchema.safeParse({ token: "12345678" });
      expect(result.success).toBe(true);
    });

    it("rejects empty token", () => {
      const result = connectTelegramSchema.safeParse({ token: "" });
      expect(result.success).toBe(false);
    });

    it("rejects missing token", () => {
      const result = connectTelegramSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  // ── connectPhoneSchema ───────────────────────────────────────────────

  describe("connectPhoneSchema", () => {
    it("validates valid phone number", () => {
      const result = connectPhoneSchema.safeParse({
        phoneNumber: "9876543210",
        countryCode: "+91",
      });
      expect(result.success).toBe(true);
    });

    it("rejects non-digit phone number", () => {
      const result = connectPhoneSchema.safeParse({
        phoneNumber: "98-7654-3210",
        countryCode: "+91",
      });
      expect(result.success).toBe(false);
    });

    it("rejects phone number too short", () => {
      const result = connectPhoneSchema.safeParse({
        phoneNumber: "123",
        countryCode: "+1",
      });
      expect(result.success).toBe(false);
    });

    it("rejects phone number too long", () => {
      const result = connectPhoneSchema.safeParse({
        phoneNumber: "1234567890123456",
        countryCode: "+1",
      });
      expect(result.success).toBe(false);
    });

    it("rejects invalid country code", () => {
      const result = connectPhoneSchema.safeParse({
        phoneNumber: "9876543210",
        countryCode: "abc",
      });
      expect(result.success).toBe(false);
    });

    it("accepts country code without plus sign", () => {
      const result = connectPhoneSchema.safeParse({
        phoneNumber: "9876543210",
        countryCode: "91",
      });
      expect(result.success).toBe(true);
    });
  });

  // ── verifyOtpSchema ─────────────────────────────────────────────────

  describe("verifyOtpSchema", () => {
    it("validates valid OTP", () => {
      const result = verifyOtpSchema.safeParse({
        phoneNumber: "9876543210",
        code: "123456",
      });
      expect(result.success).toBe(true);
    });

    it("rejects OTP with fewer than 6 digits", () => {
      const result = verifyOtpSchema.safeParse({
        phoneNumber: "9876543210",
        code: "12345",
      });
      expect(result.success).toBe(false);
    });

    it("rejects OTP with more than 6 digits", () => {
      const result = verifyOtpSchema.safeParse({
        phoneNumber: "9876543210",
        code: "1234567",
      });
      expect(result.success).toBe(false);
    });

    it("rejects non-numeric OTP", () => {
      const result = verifyOtpSchema.safeParse({
        phoneNumber: "9876543210",
        code: "abcdef",
      });
      expect(result.success).toBe(false);
    });

    it("rejects OTP with spaces", () => {
      const result = verifyOtpSchema.safeParse({
        phoneNumber: "9876543210",
        code: "123 456",
      });
      expect(result.success).toBe(false);
    });
  });

  // ── connectInstagramSchema ───────────────────────────────────────────

  describe("connectInstagramSchema", () => {
    it("validates valid username", () => {
      const result = connectInstagramSchema.safeParse({
        username: "unjynx_app",
      });
      expect(result.success).toBe(true);
    });

    it("validates username with dots", () => {
      const result = connectInstagramSchema.safeParse({
        username: "user.name.123",
      });
      expect(result.success).toBe(true);
    });

    it("rejects empty username", () => {
      const result = connectInstagramSchema.safeParse({ username: "" });
      expect(result.success).toBe(false);
    });

    it("rejects username too long", () => {
      const result = connectInstagramSchema.safeParse({
        username: "a".repeat(31),
      });
      expect(result.success).toBe(false);
    });

    it("rejects username with special characters", () => {
      const result = connectInstagramSchema.safeParse({
        username: "user@name!",
      });
      expect(result.success).toBe(false);
    });

    it("rejects username with spaces", () => {
      const result = connectInstagramSchema.safeParse({
        username: "user name",
      });
      expect(result.success).toBe(false);
    });
  });

  // ── sendTestSchema ──────────────────────────────────────────────────

  describe("sendTestSchema", () => {
    const validChannels = [
      "push",
      "telegram",
      "email",
      "whatsapp",
      "sms",
      "instagram",
      "slack",
      "discord",
    ] as const;

    for (const channel of validChannels) {
      it(`accepts '${channel}'`, () => {
        const result = sendTestSchema.safeParse({ channel });
        expect(result.success).toBe(true);
      });
    }

    it("rejects unknown channel type", () => {
      const result = sendTestSchema.safeParse({ channel: "carrier_pigeon" });
      expect(result.success).toBe(false);
    });

    it("rejects missing channel", () => {
      const result = sendTestSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });
});
