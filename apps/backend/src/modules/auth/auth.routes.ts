import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { HTTPException } from "hono/http-exception";
import { eq } from "drizzle-orm";
import { authMiddleware } from "../../middleware/auth.js";
import { ok, err } from "../../types/api.js";
import { db } from "../../db/index.js";
import { profiles } from "../../db/schema/index.js";
import * as authRepo from "./auth.repository.js";
import * as authService from "./auth.service.js";
import { uploadFile } from "../../services/storage.js";
import {
  callbackSchema,
  refreshSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  updateProfileSchema,
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

// POST /api/v1/auth/register - Create new account via Logto Management API
authRoutes.post(
  "/register",
  zValidator("json", registerSchema),
  async (c) => {
    const input = c.req.valid("json");

    try {
      const result = await authService.registerUser(input);
      return c.json(ok(result), 201);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Registration failed";
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
authRoutes.use("/me/*", authMiddleware);
authRoutes.use("/entitlements", authMiddleware);
authRoutes.use("/logout", authMiddleware);

// GET /api/v1/auth/entitlements - Get feature access for current user
// Returns all features with allowed/denied status + upgrade prompts
authRoutes.get("/entitlements", async (c) => {
  const auth = c.get("auth");
  const { getUserEntitlements } = await import("../../middleware/access-gate.js");
  const role = (auth.adminRole ?? "member") as "owner" | "admin" | "member" | "viewer" | "guest";
  const entitlements = await getUserEntitlements(auth.profileId, role);
  return c.json(ok(entitlements));
});

// GET /api/v1/auth/me - Get profile for current user
authRoutes.get("/me", async (c) => {
  const auth = c.get("auth");
  const profile = await authRepo.findProfileById(auth.profileId);

  return c.json(ok(profile));
});

// PATCH /api/v1/auth/me - Update profile fields
authRoutes.patch(
  "/me",
  zValidator("json", updateProfileSchema),
  async (c) => {
    const auth = c.get("auth");
    const input = c.req.valid("json");

    // Reject empty updates
    if (Object.keys(input).length === 0) {
      return c.json(err("No fields to update"), 400);
    }

    try {
      const [updated] = await db
        .update(profiles)
        .set({
          ...input,
          updatedAt: new Date(),
        })
        .where(eq(profiles.id, auth.profileId))
        .returning();

      if (!updated) {
        return c.json(err("Profile not found"), 404);
      }

      return c.json(ok(updated));
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "Failed to update profile";
      return c.json(err(message), 500);
    }
  },
);

// POST /api/v1/auth/me/avatar - Upload profile avatar (multipart)
authRoutes.post("/me/avatar", async (c) => {
  const auth = c.get("auth");

  let body: Record<string, string | File>;
  try {
    body = await c.req.parseBody();
  } catch {
    throw new HTTPException(400, { message: "Invalid multipart body" });
  }

  const file = body.avatar;
  if (!file || typeof file === "string") {
    throw new HTTPException(400, { message: "No file provided" });
  }

  // Validate file type
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    throw new HTTPException(400, {
      message: `Invalid file type: ${file.type}. Allowed: ${allowedTypes.join(", ")}`,
    });
  }

  // Validate file size (5 MB max)
  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    throw new HTTPException(400, {
      message: "File too large (max 5 MB)",
    });
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = file.type.split("/")[1];
    const key = `avatars/${auth.profileId}/${Date.now()}.${ext}`;

    const { url } = await uploadFile(buffer, key, file.type);

    await db
      .update(profiles)
      .set({ avatarUrl: url, updatedAt: new Date() })
      .where(eq(profiles.id, auth.profileId));

    return c.json(ok({ avatarUrl: url }));
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Failed to upload avatar";
    return c.json(err(message), 500);
  }
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
