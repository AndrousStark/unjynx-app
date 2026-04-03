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
import * as sessionService from "./session.service.js";
import * as mfaService from "./mfa.service.js";
import { uploadFile } from "../../services/storage.js";
import {
  callbackSchema,
  refreshSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  updateProfileSchema,
  loginSchema,
  socialAuthSchema,
  verifyEmailSchema,
  resendVerificationSchema,
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

      // Create a session record if we received a refresh token.
      // Decode the access token (without verification — already issued by Logto)
      // to extract the sub claim and resolve the profile.
      if (tokens.refreshToken) {
        try {
          const payload = decodeJwtPayload(tokens.accessToken);
          if (payload?.sub) {
            const profile = await authRepo.findProfileByLogtoId(payload.sub);
            if (profile) {
              const tokenHash = await sessionService.hashToken(
                tokens.refreshToken,
              );
              const userAgent = c.req.header("user-agent") ?? "";
              const ipAddress =
                c.req.header("x-forwarded-for") ??
                c.req.header("x-real-ip") ??
                undefined;

              await sessionService.createSession(profile.id, tokenHash, {
                deviceType: parseDeviceType(userAgent),
                browser: parseBrowser(userAgent),
                os: parseOs(userAgent),
                ipAddress,
              });
            }
          }
        } catch {
          // Session tracking is non-critical — don't fail the callback
        }
      }

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

      // Update session lastActiveAt (fire-and-forget)
      sessionService
        .hashToken(refreshToken)
        .then((hash) => sessionService.refreshSessionActivity(hash))
        .catch(() => {
          // Non-critical
        });

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

// ── Direct Auth (native / zero-redirect) ────────────────────────────────

// POST /api/v1/auth/login - Direct email/password login
authRoutes.post(
  "/login",
  zValidator("json", loginSchema),
  async (c) => {
    const { email, password, deviceInfo } = c.req.valid("json");

    try {
      const userAgent = c.req.header("user-agent") ?? "";
      const ipAddress =
        c.req.header("x-forwarded-for") ??
        c.req.header("x-real-ip") ??
        undefined;

      const result = await authService.directLogin(email, password, {
        userAgent,
        ipAddress,
        deviceType: deviceInfo?.deviceType ?? parseDeviceType(userAgent),
        os: deviceInfo?.os ?? parseOs(userAgent),
        appVersion: deviceInfo?.appVersion,
      });

      return c.json(ok(result));
    } catch (e) {
      const message = e instanceof Error ? e.message : "Login failed";
      return c.json(err(message), 401);
    }
  },
);

// POST /api/v1/auth/social - Native social login (Google, Apple)
authRoutes.post(
  "/social",
  zValidator("json", socialAuthSchema),
  async (c) => {
    const { provider, idToken, deviceInfo } = c.req.valid("json");

    try {
      const userAgent = c.req.header("user-agent") ?? "";
      const ipAddress =
        c.req.header("x-forwarded-for") ??
        c.req.header("x-real-ip") ??
        undefined;

      const result = await authService.socialLogin(provider, idToken, {
        userAgent,
        ipAddress,
        deviceType: deviceInfo?.deviceType ?? parseDeviceType(userAgent),
        os: deviceInfo?.os ?? parseOs(userAgent),
        appVersion: deviceInfo?.appVersion,
      });

      return c.json(ok(result));
    } catch (e) {
      const message = e instanceof Error ? e.message : "Social login failed";
      return c.json(err(message), 401);
    }
  },
);

// POST /api/v1/auth/verify-email - Verify email with 6-digit OTP
authRoutes.post(
  "/verify-email",
  zValidator("json", verifyEmailSchema),
  async (c) => {
    const { email, code } = c.req.valid("json");

    try {
      const verified = await authService.verifyEmailOtp(email, code);

      if (!verified) {
        return c.json(err("Invalid or expired verification code"), 400);
      }

      return c.json(ok({ verified: true }));
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "Verification failed";
      return c.json(err(message), 500);
    }
  },
);

// POST /api/v1/auth/resend-verification - Resend verification OTP
authRoutes.post(
  "/resend-verification",
  zValidator("json", resendVerificationSchema),
  async (c) => {
    const { email } = c.req.valid("json");

    try {
      await authService.sendVerificationOtp(email);
      // Always return success to prevent email enumeration
      return c.json(ok({ sent: true }));
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "Failed to send verification code";
      return c.json(err(message), 500);
    }
  },
);

// ── Protected routes ────────────────────────────────────────────────────

authRoutes.use("/me", authMiddleware);
authRoutes.use("/me/*", authMiddleware);
authRoutes.use("/entitlements", authMiddleware);
authRoutes.use("/logout", authMiddleware);
authRoutes.use("/sessions", authMiddleware);
authRoutes.use("/sessions/*", authMiddleware);
authRoutes.use("/mfa-status", authMiddleware);

// GET /api/v1/auth/mfa-status - Check MFA configuration status
// Returns { enabled, methods: ["totp"|"webauthn"|"backup_codes"], mandatory }
authRoutes.get("/mfa-status", async (c) => {
  const auth = c.get("auth");

  try {
    const profile = await authRepo.findProfileById(auth.profileId);
    const adminRole = (profile as Record<string, unknown>)?.adminRole as string | null ?? null;

    const status = await mfaService.getFullMfaStatus(auth.sub, adminRole);
    return c.json(ok(status));
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to check MFA status";
    return c.json(err(message), 500);
  }
});

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

// ── Session Management (protected) ──────────────────────────────────

// GET /api/v1/auth/sessions - List active sessions for current user
authRoutes.get("/sessions", async (c) => {
  const auth = c.get("auth");

  try {
    const sessions = await sessionService.listActiveSessions(auth.profileId);

    // Strip tokenHash from the response for security
    const sanitized = sessions.map((s) => ({
      id: s.id,
      deviceType: s.deviceType,
      browser: s.browser,
      os: s.os,
      ipAddress: s.ipAddress,
      geoCountry: s.geoCountry,
      geoCity: s.geoCity,
      lastActiveAt: s.lastActiveAt,
      createdAt: s.createdAt,
      expiresAt: s.expiresAt,
    }));

    return c.json(ok(sanitized));
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Failed to list sessions";
    return c.json(err(message), 500);
  }
});

// DELETE /api/v1/auth/sessions/:id - Revoke a specific session
authRoutes.delete("/sessions/:id", async (c) => {
  const auth = c.get("auth");
  const sessionId = c.req.param("id");

  // Validate UUID format
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(sessionId)) {
    return c.json(err("Invalid session ID"), 400);
  }

  try {
    const revoked = await sessionService.revokeSession(
      auth.profileId,
      sessionId,
    );

    if (!revoked) {
      return c.json(err("Session not found"), 404);
    }

    return c.json(ok({ revoked: true }));
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Failed to revoke session";
    return c.json(err(message), 500);
  }
});

// DELETE /api/v1/auth/sessions - Revoke all other sessions ("sign out everywhere")
authRoutes.delete("/sessions", async (c) => {
  const auth = c.get("auth");

  // Optional: pass current session ID to keep it alive
  const currentSessionId = c.req.query("keepCurrent") ?? undefined;

  try {
    const revokedCount = await sessionService.revokeAllSessions(
      auth.profileId,
      currentSessionId,
    );

    return c.json(ok({ revokedCount }));
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Failed to revoke sessions";
    return c.json(err(message), 500);
  }
});

// ── Helper Functions ────────────────────────────────────────────────

/**
 * Decode a JWT payload without verification (for extracting the sub claim
 * from a freshly issued token that we trust).
 */
function decodeJwtPayload(
  token: string,
): { sub?: string } | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = JSON.parse(
      Buffer.from(parts[1], "base64url").toString("utf-8"),
    );
    return payload as { sub?: string };
  } catch {
    return null;
  }
}

/**
 * Parse device type from User-Agent string.
 */
function parseDeviceType(ua: string): string {
  const lower = ua.toLowerCase();
  if (
    lower.includes("mobile") ||
    lower.includes("android") ||
    lower.includes("iphone")
  ) {
    return "mobile";
  }
  if (lower.includes("tablet") || lower.includes("ipad")) {
    return "tablet";
  }
  return "desktop";
}

/**
 * Parse browser name from User-Agent string.
 */
function parseBrowser(ua: string): string {
  if (ua.includes("Firefox/")) return "Firefox";
  if (ua.includes("Edg/")) return "Edge";
  if (ua.includes("Chrome/") && !ua.includes("Edg/")) return "Chrome";
  if (ua.includes("Safari/") && !ua.includes("Chrome/")) return "Safari";
  if (ua.includes("Opera/") || ua.includes("OPR/")) return "Opera";
  return "Unknown";
}

/**
 * Parse OS from User-Agent string.
 */
function parseOs(ua: string): string {
  if (ua.includes("Windows")) return "Windows";
  if (ua.includes("Mac OS") || ua.includes("Macintosh")) return "macOS";
  if (ua.includes("Linux") && !ua.includes("Android")) return "Linux";
  if (ua.includes("Android")) return "Android";
  if (ua.includes("iPhone") || ua.includes("iPad")) return "iOS";
  return "Unknown";
}
