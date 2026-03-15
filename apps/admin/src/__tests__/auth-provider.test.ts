import { describe, it, expect, beforeEach, vi } from "vitest";
import { authProvider, getAccessToken } from "../providers/auth-provider";

describe("authProvider", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe("check", () => {
    it("should return not authenticated when no token", async () => {
      const result = await authProvider.check();
      expect(result.authenticated).toBe(false);
      expect(result.redirectTo).toBe("/login");
    });

    it("should return authenticated when token and user exist", async () => {
      localStorage.setItem("unjynx_admin_token", "test-token");
      localStorage.setItem(
        "unjynx_admin_user",
        JSON.stringify({
          id: "1",
          email: "admin@test.com",
          name: "Admin",
          role: "SUPER_ADMIN",
        }),
      );

      const result = await authProvider.check();
      expect(result.authenticated).toBe(true);
    });

    it("should return not authenticated when token exists but no user", async () => {
      localStorage.setItem("unjynx_admin_token", "test-token");

      const result = await authProvider.check();
      expect(result.authenticated).toBe(false);
    });
  });

  describe("getIdentity", () => {
    it("should return null when no user stored", async () => {
      const identity = await authProvider.getIdentity!();
      expect(identity).toBeNull();
    });

    it("should return user identity when stored", async () => {
      localStorage.setItem(
        "unjynx_admin_user",
        JSON.stringify({
          id: "user-1",
          email: "admin@unjynx.com",
          name: "Admin User",
          role: "SUPER_ADMIN",
          avatarUrl: "https://example.com/avatar.png",
        }),
      );

      const identity = await authProvider.getIdentity!();
      expect(identity).toEqual({
        id: "user-1",
        name: "Admin User",
        email: "admin@unjynx.com",
        avatar: "https://example.com/avatar.png",
        role: "SUPER_ADMIN",
      });
    });
  });

  describe("getPermissions", () => {
    it("should return VIEWER when no user stored", async () => {
      const permissions = await authProvider.getPermissions!();
      expect(permissions).toBe("VIEWER");
    });

    it("should return stored role", async () => {
      localStorage.setItem(
        "unjynx_admin_user",
        JSON.stringify({ role: "CONTENT_MANAGER" }),
      );

      const permissions = await authProvider.getPermissions!();
      expect(permissions).toBe("CONTENT_MANAGER");
    });
  });

  describe("logout", () => {
    it("should clear all auth data from localStorage", async () => {
      localStorage.setItem("unjynx_admin_token", "test-token");
      localStorage.setItem("unjynx_admin_refresh_token", "refresh-token");
      localStorage.setItem(
        "unjynx_admin_user",
        JSON.stringify({ id: "1" }),
      );

      // Mock fetch to prevent actual network call
      global.fetch = vi.fn().mockResolvedValue({ ok: true });

      const result = await authProvider.logout({});
      expect(result.success).toBe(true);
      expect(result.redirectTo).toBe("/login");
      expect(localStorage.getItem("unjynx_admin_token")).toBeNull();
      expect(localStorage.getItem("unjynx_admin_refresh_token")).toBeNull();
      expect(localStorage.getItem("unjynx_admin_user")).toBeNull();
    });
  });

  describe("onError", () => {
    it("should logout on 401 error", async () => {
      localStorage.setItem("unjynx_admin_token", "test-token");

      const result = await authProvider.onError!({ statusCode: 401 });
      expect(result.logout).toBe(true);
      expect(result.redirectTo).toBe("/login");
      expect(localStorage.getItem("unjynx_admin_token")).toBeNull();
    });

    it("should not logout on other errors", async () => {
      const result = await authProvider.onError!({ statusCode: 500 });
      expect(result.logout).toBeUndefined();
    });
  });

  describe("getAccessToken", () => {
    it("should return null when no token", () => {
      expect(getAccessToken()).toBeNull();
    });

    it("should return stored token", () => {
      localStorage.setItem("unjynx_admin_token", "my-jwt-token");
      expect(getAccessToken()).toBe("my-jwt-token");
    });
  });
});
