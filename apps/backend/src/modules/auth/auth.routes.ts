import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { authMiddleware } from "../../middleware/auth.js";
import { ok, err } from "../../types/api.js";
import * as authRepo from "./auth.repository.js";
import * as authService from "./auth.service.js";
import {
  callbackSchema,
  refreshSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "./auth.schema.js";

export const authRoutes = new Hono();

// ── Public routes (no auth required) ────────────────────────────────────

// POST /api/v1/auth/callback - Exchange auth code for tokens via Logto OIDC
authRoutes.post(
  "/callback",
  zValidator("json", callbackSchema),
  async (c) => {
    const input = c.req.valid("json");

    try {
      const tokens = await authService.exchangeCodeForTokens(input);
      return c.json(ok(tokens));
    } catch (e) {
      const message = e instanceof Error ? e.message : "Token exchange failed";
      return c.json(err(message), 400);
    }
  },
);

// POST /api/v1/auth/refresh - Refresh access token
authRoutes.post(
  "/refresh",
  zValidator("json", refreshSchema),
  async (c) => {
    const { refreshToken } = c.req.valid("json");

    try {
      const tokens = await authService.refreshAccessToken(refreshToken);
      return c.json(ok(tokens));
    } catch (e) {
      const message = e instanceof Error ? e.message : "Token refresh failed";
      return c.json(err(message), 401);
    }
  },
);

// POST /api/v1/auth/forgot-password - Request password reset email
authRoutes.post(
  "/forgot-password",
  zValidator("json", forgotPasswordSchema),
  async (c) => {
    const { email } = c.req.valid("json");

    // Always return success to prevent email enumeration
    await authService.requestPasswordReset(email);
    return c.json(ok({ sent: true }));
  },
);

// POST /api/v1/auth/reset-password - Reset password with token
authRoutes.post(
  "/reset-password",
  zValidator("json", resetPasswordSchema),
  async (c) => {
    const input = c.req.valid("json");

    try {
      await authService.resetPassword(input.token, input.password);
      return c.json(ok({ reset: true }));
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "Password reset failed";
      return c.json(err(message), 400);
    }
  },
);

// ── Protected routes ────────────────────────────────────────────────────

authRoutes.use("/me", authMiddleware);
authRoutes.use("/logout", authMiddleware);

// GET /api/v1/auth/me - Get profile for current user
authRoutes.get("/me", async (c) => {
  const auth = c.get("auth");
  const profile = await authRepo.findProfileById(auth.profileId);

  return c.json(ok(profile));
});

// POST /api/v1/auth/logout - Revoke refresh token and clear session
authRoutes.post("/logout", async (c) => {
  const auth = c.get("auth");

  try {
    await authService.revokeSession(auth.sub);
    return c.json(ok({ loggedOut: true }));
  } catch (e) {
    // Logout should always succeed from the client's perspective
    return c.json(ok({ loggedOut: true }));
  }
});
