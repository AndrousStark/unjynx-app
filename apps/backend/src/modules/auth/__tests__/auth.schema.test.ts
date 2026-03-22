import { describe, it, expect } from "vitest";
import {
  callbackSchema,
  refreshSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  updateProfileSchema,
} from "../auth.schema.js";

describe("Auth Schemas", () => {
  // ── Callback Schema ──────────────────────────────────────────────────

  describe("callbackSchema", () => {
    it("accepts valid callback input", () => {
      const result = callbackSchema.safeParse({
        code: "auth_code_12345",
        codeVerifier: "a".repeat(43), // minimum 43 chars
        redirectUri: "https://example.com/callback",
      });
      expect(result.success).toBe(true);
    });

    it("rejects empty code", () => {
      const result = callbackSchema.safeParse({
        code: "",
        codeVerifier: "a".repeat(43),
        redirectUri: "https://example.com/callback",
      });
      expect(result.success).toBe(false);
    });

    it("rejects code_verifier shorter than 43 chars", () => {
      const result = callbackSchema.safeParse({
        code: "auth_code_12345",
        codeVerifier: "short",
        redirectUri: "https://example.com/callback",
      });
      expect(result.success).toBe(false);
    });

    it("rejects code_verifier longer than 128 chars", () => {
      const result = callbackSchema.safeParse({
        code: "auth_code_12345",
        codeVerifier: "a".repeat(129),
        redirectUri: "https://example.com/callback",
      });
      expect(result.success).toBe(false);
    });

    it("rejects invalid redirect URI", () => {
      const result = callbackSchema.safeParse({
        code: "auth_code_12345",
        codeVerifier: "a".repeat(43),
        redirectUri: "not-a-url",
      });
      expect(result.success).toBe(false);
    });
  });

  // ── Refresh Schema ───────────────────────────────────────────────────

  describe("refreshSchema", () => {
    it("accepts valid refresh token", () => {
      const result = refreshSchema.safeParse({
        refreshToken: "rt_valid_refresh_token_value",
      });
      expect(result.success).toBe(true);
    });

    it("rejects empty refresh token", () => {
      const result = refreshSchema.safeParse({
        refreshToken: "",
      });
      expect(result.success).toBe(false);
    });

    it("rejects missing refresh token", () => {
      const result = refreshSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  // ── Forgot Password Schema ──────────────────────────────────────────

  describe("forgotPasswordSchema", () => {
    it("accepts valid email", () => {
      const result = forgotPasswordSchema.safeParse({
        email: "user@example.com",
      });
      expect(result.success).toBe(true);
    });

    it("rejects invalid email", () => {
      const result = forgotPasswordSchema.safeParse({
        email: "not-an-email",
      });
      expect(result.success).toBe(false);
    });

    it("rejects empty email", () => {
      const result = forgotPasswordSchema.safeParse({
        email: "",
      });
      expect(result.success).toBe(false);
    });
  });

  // ── Reset Password Schema ──────────────────────────────────────────

  describe("resetPasswordSchema", () => {
    it("accepts valid reset input", () => {
      const result = resetPasswordSchema.safeParse({
        token: "reset_token_abc",
        password: "newPass123!",
      });
      expect(result.success).toBe(true);
    });

    it("rejects password shorter than 8 characters", () => {
      const result = resetPasswordSchema.safeParse({
        token: "reset_token_abc",
        password: "short",
      });
      expect(result.success).toBe(false);
    });

    it("rejects password longer than 128 characters", () => {
      const result = resetPasswordSchema.safeParse({
        token: "reset_token_abc",
        password: "a".repeat(129),
      });
      expect(result.success).toBe(false);
    });

    it("rejects empty token", () => {
      const result = resetPasswordSchema.safeParse({
        token: "",
        password: "validPass123",
      });
      expect(result.success).toBe(false);
    });

    it("rejects missing fields", () => {
      expect(resetPasswordSchema.safeParse({}).success).toBe(false);
      expect(
        resetPasswordSchema.safeParse({ token: "abc" }).success,
      ).toBe(false);
      expect(
        resetPasswordSchema.safeParse({ password: "abc12345" }).success,
      ).toBe(false);
    });
  });

  // ── Update Profile Schema ─────────────────────────────────────────

  describe("updateProfileSchema", () => {
    it("accepts valid name update", () => {
      const result = updateProfileSchema.safeParse({ name: "New Name" });
      expect(result.success).toBe(true);
    });

    it("accepts valid timezone update", () => {
      const result = updateProfileSchema.safeParse({
        timezone: "America/New_York",
      });
      expect(result.success).toBe(true);
    });

    it("accepts valid avatar URL update", () => {
      const result = updateProfileSchema.safeParse({
        avatarUrl: "https://cdn.example.com/avatars/123.jpg",
      });
      expect(result.success).toBe(true);
    });

    it("accepts null avatarUrl (removal)", () => {
      const result = updateProfileSchema.safeParse({ avatarUrl: null });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.avatarUrl).toBeNull();
      }
    });

    it("accepts all fields together", () => {
      const result = updateProfileSchema.safeParse({
        name: "Full Update",
        avatarUrl: "https://cdn.example.com/avatar.png",
        timezone: "Asia/Kolkata",
      });
      expect(result.success).toBe(true);
    });

    it("accepts empty object (all fields optional)", () => {
      const result = updateProfileSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it("rejects empty name", () => {
      const result = updateProfileSchema.safeParse({ name: "" });
      expect(result.success).toBe(false);
    });

    it("rejects name longer than 100 characters", () => {
      const result = updateProfileSchema.safeParse({
        name: "a".repeat(101),
      });
      expect(result.success).toBe(false);
    });

    it("rejects invalid avatar URL", () => {
      const result = updateProfileSchema.safeParse({
        avatarUrl: "not-a-url",
      });
      expect(result.success).toBe(false);
    });

    it("rejects empty timezone", () => {
      const result = updateProfileSchema.safeParse({ timezone: "" });
      expect(result.success).toBe(false);
    });

    it("rejects timezone longer than 50 characters", () => {
      const result = updateProfileSchema.safeParse({
        timezone: "a".repeat(51),
      });
      expect(result.success).toBe(false);
    });
  });
});
