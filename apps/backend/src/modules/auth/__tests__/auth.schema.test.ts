import { describe, it, expect } from "vitest";
import {
  callbackSchema,
  refreshSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
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
});
