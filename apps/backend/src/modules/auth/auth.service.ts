import type { Profile } from "../../db/schema/index.js";
import { env } from "../../env.js";
import { getManagementToken } from "../../utils/logto-m2m.js";
import { logger } from "../../middleware/logger.js";
import { clearProfileCache } from "../../middleware/auth.js";
import * as authRepo from "./auth.repository.js";
import * as jwtService from "./jwt.service.js";
import * as sessionSvc from "./session.service.js";
import { verifyGoogleIdToken } from "./google.service.js";
import type { CallbackInput } from "./auth.schema.js";
import IORedis from "ioredis";

const log = logger.child({ module: "auth" });

interface LogtoUser {
  readonly sub: string;
  readonly email?: string;
  readonly name?: string;
  readonly emailVerified?: boolean;
}

interface TokenResponse {
  readonly accessToken: string;
  readonly refreshToken?: string;
  readonly expiresIn: number;
  readonly tokenType: string;
}

// ── Profile sync ────────────────────────────────────────────────────────

/**
 * Sync profile from Logto user data.
 *
 * Checks Logto's user data for `primaryEmail` and `emailVerified` status,
 * and updates our profile accordingly. If Logto reports the email as
 * verified, we mark it verified in our DB as well.
 */
export async function syncProfile(user: LogtoUser): Promise<Profile> {
  // Upsert basic profile fields
  const profile = await authRepo.upsertProfile({
    logtoId: user.sub,
    email: user.email,
    name: user.name,
  });

  // If Logto reports email as verified and we haven't marked it yet,
  // update the verification status in our DB.
  if (user.emailVerified && !profile.emailVerified && user.email) {
    const updated = await authRepo.markEmailVerified(profile.id);
    // Clear the auth middleware profile cache so the new status is picked up
    clearProfileCache();
    return updated ?? profile;
  }

  // Additionally, fetch email verification status from Logto Management API
  // if the JWT didn't include it (e.g., first sync or token without email_verified claim).
  if (!profile.emailVerified && user.email) {
    try {
      const logtoVerified = await fetchLogtoEmailVerified(user.sub);
      if (logtoVerified) {
        const updated = await authRepo.markEmailVerified(profile.id);
        clearProfileCache();
        return updated ?? profile;
      }
    } catch (error) {
      log.warn({ error }, "Failed to fetch Logto email verification status");
      // Non-critical — continue with existing profile
    }
  }

  return profile;
}

/**
 * Fetch a user's email verification status from Logto Management API.
 */
async function fetchLogtoEmailVerified(logtoId: string): Promise<boolean> {
  const m2mToken = await getManagementToken();
  if (!m2mToken) return false;

  const url = `${env.LOGTO_ENDPOINT}/api/users/${logtoId}`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${m2mToken}` },
  });

  if (!response.ok) return false;

  const data = (await response.json()) as {
    primaryEmail?: string;
    primaryEmailVerified?: boolean;
  };

  return data.primaryEmailVerified === true;
}

export async function getProfileByLogtoId(
  logtoId: string,
): Promise<Profile | undefined> {
  return authRepo.findProfileByLogtoId(logtoId);
}

// ── Token exchange (PKCE) ───────────────────────────────────────────────

export async function exchangeCodeForTokens(
  input: CallbackInput,
): Promise<TokenResponse> {
  const tokenUrl = `${env.LOGTO_ENDPOINT}/oidc/token`;

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: env.LOGTO_APP_ID ?? "",
    code: input.code,
    code_verifier: input.codeVerifier,
    redirect_uri: input.redirectUri,
  });

  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      (errorData as Record<string, string>).error_description ??
        `Token exchange failed: ${response.status}`,
    );
  }

  const data = (await response.json()) as Record<string, unknown>;

  return {
    accessToken: data.access_token as string,
    refreshToken: data.refresh_token as string | undefined,
    expiresIn: (data.expires_in as number) ?? 3600,
    tokenType: (data.token_type as string) ?? "Bearer",
  };
}

// ── Token refresh ───────────────────────────────────────────────────────

export async function refreshAccessToken(
  refreshToken: string,
): Promise<TokenResponse> {
  const tokenUrl = `${env.LOGTO_ENDPOINT}/oidc/token`;

  const body = new URLSearchParams({
    grant_type: "refresh_token",
    client_id: env.LOGTO_APP_ID ?? "",
    refresh_token: refreshToken,
  });

  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!response.ok) {
    throw new Error("Token refresh failed — re-authentication required");
  }

  const data = (await response.json()) as Record<string, unknown>;

  return {
    accessToken: data.access_token as string,
    refreshToken: data.refresh_token as string | undefined,
    expiresIn: (data.expires_in as number) ?? 3600,
    tokenType: (data.token_type as string) ?? "Bearer",
  };
}

// ── Session revocation ──────────────────────────────────────────────────

export async function revokeSession(logtoId: string): Promise<void> {
  await authRepo.updateLastLogout(logtoId);
}

// ── User Registration via Logto Management API ──────────────────────────

interface RegisterInput {
  readonly email: string;
  readonly password: string;
  readonly name: string;
}

/**
 * Register a new user via Logto Management API.
 *
 * Creates the user in Logto with email + password, then creates the
 * corresponding profile in our database.
 */
export async function registerUser(
  input: RegisterInput,
): Promise<{ profileId: string }> {
  const m2mToken = await getManagementToken();
  if (!m2mToken) {
    throw new Error("Registration service unavailable");
  }

  // Check if email already exists in Logto
  const searchUrl = `${env.LOGTO_ENDPOINT}/api/users?search=${encodeURIComponent(input.email)}`;
  const searchResponse = await fetch(searchUrl, {
    headers: { Authorization: `Bearer ${m2mToken}` },
  });

  if (searchResponse.ok) {
    const users = (await searchResponse.json()) as Array<{
      id: string;
      primaryEmail?: string;
    }>;
    const existing = users.find(
      (u) => u.primaryEmail?.toLowerCase() === input.email.toLowerCase(),
    );
    if (existing) {
      throw new Error("An account with this email already exists");
    }
  }

  // Create user in Logto
  const createUrl = `${env.LOGTO_ENDPOINT}/api/users`;
  const createResponse = await fetch(createUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${m2mToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      primaryEmail: input.email,
      password: input.password,
      name: input.name,
    }),
  });

  if (!createResponse.ok) {
    const error = await createResponse.text().catch(() => "");
    log.error({ status: createResponse.status, error }, "Logto user creation failed");
    if (createResponse.status === 422) {
      throw new Error("Invalid email or password format");
    }
    throw new Error("Registration failed — please try again");
  }

  const logtoUser = (await createResponse.json()) as {
    id: string;
    primaryEmail: string;
    name: string;
  };

  // Create profile in our database
  const profile = await authRepo.upsertProfile({
    logtoId: logtoUser.id,
    email: logtoUser.primaryEmail,
    name: logtoUser.name,
  });

  log.info({ email: input.email, profileId: profile.id }, "User registered");

  return { profileId: profile.id };
}

// ── Password Reset via Logto Management API ─────────────────────────────

/**
 * Request a password reset for the given email.
 *
 * Uses Logto Management API to find the user and directly set a new
 * temporary password, then sends a notification (if email connector
 * configured). In practice, for Logto-based auth, the user should use
 * Logto's built-in "Forgot Password" on the sign-in experience page.
 *
 * Security: Always returns successfully to prevent email enumeration.
 */
export async function requestPasswordReset(email: string): Promise<void> {
  try {
    const m2mToken = await getManagementToken();
    if (!m2mToken) return;

    // Find user by email in Logto
    const searchUrl = `${env.LOGTO_ENDPOINT}/api/users?search=${encodeURIComponent(email)}`;
    const response = await fetch(searchUrl, {
      headers: { Authorization: `Bearer ${m2mToken}` },
    });

    if (!response.ok) return;

    const users = (await response.json()) as Array<{
      id: string;
      primaryEmail?: string;
    }>;
    const user = users.find(
      (u) => u.primaryEmail?.toLowerCase() === email.toLowerCase(),
    );
    if (!user) return;

    // Use Logto Management API to update the user's password directly.
    // The correct endpoint is PATCH /api/users/{userId}/password
    const resetUrl = `${env.LOGTO_ENDPOINT}/api/users/${user.id}/password`;
    const tempPassword = generateTempPassword();

    const resetResponse = await fetch(resetUrl, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${m2mToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ password: tempPassword }),
    });

    if (!resetResponse.ok) {
      log.warn(
        { userId: user.id, status: resetResponse.status },
        "Password reset via Logto failed",
      );
      return;
    }

    // Send the temporary password via email (if SendGrid configured)
    await sendPasswordResetEmail(email, tempPassword);

    log.info({ email }, "Password reset processed");
  } catch (error) {
    log.warn({ error }, "Password reset error (swallowed)");
  }
}

/**
 * Reset password using a verification token.
 *
 * For the Logto-based flow, we use the Management API to directly
 * update the user's password.
 */
export async function resetPassword(
  token: string,
  newPassword: string,
): Promise<void> {
  const m2mToken = await getManagementToken();
  if (!m2mToken) {
    throw new Error("Password reset service unavailable");
  }

  // The token is the Logto user ID (sent in the reset email link)
  const resetUrl = `${env.LOGTO_ENDPOINT}/api/users/${token}/password`;
  const response = await fetch(resetUrl, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${m2mToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ password: newPassword }),
  });

  if (!response.ok) {
    throw new Error("Invalid or expired reset link");
  }
}

// ── Direct Auth (native / zero-redirect) ────────────────────────────────

/**
 * Unified auth response returned by directLogin and socialLogin.
 */
export interface DirectAuthResult {
  readonly accessToken: string;
  readonly refreshToken: string;
  readonly expiresIn: number;
  readonly tokenType: "Bearer";
  readonly user: {
    readonly id: string;
    readonly email: string;
    readonly name: string | null;
    readonly avatarUrl: string | null;
    readonly emailVerified: boolean;
    readonly adminRole: string | null;
  };
}

interface SessionMeta {
  readonly userAgent?: string;
  readonly ipAddress?: string;
  readonly deviceType?: string;
  readonly os?: string;
  readonly appVersion?: string;
}

/**
 * Direct email + password login.
 *
 * 1. Find user in Logto by email
 * 2. Verify password via Management API
 * 3. Upsert local profile
 * 4. Issue self-signed JWT + refresh token
 * 5. Create session record
 */
export async function directLogin(
  email: string,
  password: string,
  meta: SessionMeta = {},
): Promise<DirectAuthResult> {
  // ── Dev bypass: allow test login when Logto is not running ──
  if (env.NODE_ENV === "development") {
    const m2mCheck = await getManagementToken();
    if (!m2mCheck) {
      log.warn("Logto unavailable — using dev bypass login");
      return devBypassLogin(email, password, meta);
    }
  }

  const m2mToken = await getManagementToken();
  if (!m2mToken) {
    throw new Error("Authentication service unavailable");
  }

  // 1. Find user by email in Logto
  const searchUrl = `${env.LOGTO_ENDPOINT}/api/users?search=${encodeURIComponent(email)}`;
  const searchRes = await fetch(searchUrl, {
    headers: { Authorization: `Bearer ${m2mToken}` },
  });

  if (!searchRes.ok) {
    throw new Error("Authentication service error");
  }

  const users = (await searchRes.json()) as Array<{
    id: string;
    primaryEmail?: string;
    name?: string;
    avatar?: string;
    primaryEmailVerified?: boolean;
  }>;

  const logtoUser = users.find(
    (u) => u.primaryEmail?.toLowerCase() === email.toLowerCase(),
  );

  if (!logtoUser) {
    throw new Error("Invalid email or password");
  }

  // 2. Verify password via Logto Management API
  const verifyUrl = `${env.LOGTO_ENDPOINT}/api/users/${logtoUser.id}/password/verify`;
  const verifyRes = await fetch(verifyUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${m2mToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ password }),
  });

  if (verifyRes.status === 422) {
    throw new Error("Invalid email or password");
  }

  if (!verifyRes.ok && verifyRes.status !== 204) {
    log.error(
      { status: verifyRes.status, logtoUserId: logtoUser.id },
      "Logto password verify unexpected status",
    );
    throw new Error("Authentication failed");
  }

  // 3. Upsert local profile
  const profile = await authRepo.upsertProfile({
    logtoId: logtoUser.id,
    email: logtoUser.primaryEmail,
    name: logtoUser.name,
    picture: logtoUser.avatar,
  });

  // Sync email verification from Logto if needed
  if (logtoUser.primaryEmailVerified && !profile.emailVerified) {
    await authRepo.markEmailVerified(profile.id);
    clearProfileCache();
    profile.emailVerified = true;
  }

  // 4. Issue self-signed tokens
  const accessToken = await jwtService.signAccessToken({
    profileId: profile.id,
    email: profile.email ?? undefined,
    name: profile.name ?? undefined,
    role: profile.adminRole ?? "member",
    emailVerified: profile.emailVerified,
  });

  const refreshToken = jwtService.generateRefreshToken();

  // 5. Create session
  const tokenHash = await sessionSvc.hashToken(refreshToken);
  await sessionSvc.createSession(profile.id, tokenHash, {
    deviceType: meta.deviceType,
    os: meta.os,
    ipAddress: meta.ipAddress,
    browser: meta.userAgent ? undefined : undefined,
  });

  log.info({ email, profileId: profile.id }, "Direct login successful");

  return {
    accessToken,
    refreshToken,
    expiresIn: 900, // 15 minutes (matches jwt.service ACCESS_TOKEN_TTL)
    tokenType: "Bearer",
    user: {
      id: profile.id,
      email: profile.email ?? email,
      name: profile.name,
      avatarUrl: profile.avatarUrl,
      emailVerified: profile.emailVerified,
      adminRole: profile.adminRole,
    },
  };
}

/**
 * Native social login (Google / Apple).
 *
 * 1. Verify the provider's ID token
 * 2. Check if user exists in Logto; create if not
 * 3. Link social identity if needed
 * 4. Upsert local profile
 * 5. Issue self-signed JWT
 */
export async function socialLogin(
  provider: "google" | "apple",
  idToken: string,
  meta: SessionMeta = {},
): Promise<DirectAuthResult> {
  // 1. Verify ID token
  if (provider !== "google") {
    throw new Error(`Social provider "${provider}" is not yet supported`);
  }

  const googleInfo = await verifyGoogleIdToken(idToken);
  const { googleId, email, name, picture, emailVerified } = googleInfo;

  const m2mToken = await getManagementToken();
  if (!m2mToken) {
    throw new Error("Authentication service unavailable");
  }

  // 2. Check if user exists in Logto
  const searchUrl = `${env.LOGTO_ENDPOINT}/api/users?search=${encodeURIComponent(email)}`;
  const searchRes = await fetch(searchUrl, {
    headers: { Authorization: `Bearer ${m2mToken}` },
  });

  let logtoUserId: string;

  if (searchRes.ok) {
    const users = (await searchRes.json()) as Array<{
      id: string;
      primaryEmail?: string;
      identities?: Record<string, unknown>;
    }>;

    const existing = users.find(
      (u) => u.primaryEmail?.toLowerCase() === email.toLowerCase(),
    );

    if (existing) {
      logtoUserId = existing.id;

      // 3. Link Google identity if not already linked
      const hasGoogle = existing.identities && "google" in existing.identities;
      if (!hasGoogle) {
        try {
          const linkUrl = `${env.LOGTO_ENDPOINT}/api/users/${logtoUserId}/identities`;
          await fetch(linkUrl, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${m2mToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              connectorId: "google",
              connectorData: {
                userId: googleId,
                rawData: { sub: googleId, email, name, picture },
              },
            }),
          });
        } catch (linkErr) {
          log.warn({ err: linkErr }, "Failed to link Google identity — non-critical");
        }
      }
    } else {
      // 4. Create user in Logto with social identity
      const createUrl = `${env.LOGTO_ENDPOINT}/api/users`;
      const createRes = await fetch(createUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${m2mToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          primaryEmail: email,
          name: name ?? undefined,
          avatar: picture ?? undefined,
          primaryEmailVerified: emailVerified,
        }),
      });

      if (!createRes.ok) {
        const errText = await createRes.text().catch(() => "");
        log.error(
          { status: createRes.status, error: errText },
          "Logto user creation failed during social login",
        );
        throw new Error("Account creation failed — please try again");
      }

      const created = (await createRes.json()) as { id: string };
      logtoUserId = created.id;
    }
  } else {
    throw new Error("Authentication service error");
  }

  // 5. Upsert local profile
  const profile = await authRepo.upsertProfileFromSocial({
    logtoId: logtoUserId,
    email,
    name,
    googleId,
    avatarUrl: picture,
  });

  // 6. Issue self-signed tokens
  const accessToken = await jwtService.signAccessToken({
    profileId: profile.id,
    email: profile.email ?? undefined,
    name: profile.name ?? undefined,
    role: profile.adminRole ?? "member",
    emailVerified: profile.emailVerified,
  });

  const refreshToken = jwtService.generateRefreshToken();

  // Create session
  const tokenHash = await sessionSvc.hashToken(refreshToken);
  await sessionSvc.createSession(profile.id, tokenHash, {
    deviceType: meta.deviceType,
    os: meta.os,
    ipAddress: meta.ipAddress,
  });

  log.info(
    { provider, email, profileId: profile.id },
    "Social login successful",
  );

  return {
    accessToken,
    refreshToken,
    expiresIn: 900,
    tokenType: "Bearer",
    user: {
      id: profile.id,
      email: profile.email ?? email,
      name: profile.name,
      avatarUrl: profile.avatarUrl,
      emailVerified: profile.emailVerified,
      adminRole: profile.adminRole,
    },
  };
}

// ── Email Verification OTP ──────────────────────────────────────────────

let otpRedis: IORedis | null = null;

function getOtpRedis(): IORedis {
  if (!otpRedis) {
    otpRedis = new IORedis(env.REDIS_URL, {
      connectionName: "unjynx:email-otp",
      lazyConnect: true,
      enableReadyCheck: false,
      maxRetriesPerRequest: 2,
      retryStrategy(times: number): number | null {
        if (times > 3) return null;
        return Math.min(times * 100, 1000);
      },
    });
    otpRedis.on("error", () => {
      // Swallow — callers handle failures gracefully
    });
  }
  return otpRedis;
}

const OTP_KEY_PREFIX = "email_otp:";
const OTP_TTL_SECONDS = 600; // 10 minutes

/**
 * Generate a 6-digit OTP, hash it, store in Redis, and email it.
 */
export async function sendVerificationOtp(email: string): Promise<void> {
  // Generate 6-digit OTP
  const bytes = new Uint8Array(4);
  crypto.getRandomValues(bytes);
  const raw = ((bytes[0] << 24) | (bytes[1] << 16) | (bytes[2] << 8) | bytes[3]) >>> 0;
  const code = String(raw % 1000000).padStart(6, "0");

  // Hash it before storing
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(code));
  const hashHex = Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  // Store in Redis with TTL
  const redis = getOtpRedis();
  await redis.set(`${OTP_KEY_PREFIX}${email.toLowerCase()}`, hashHex, "EX", OTP_TTL_SECONDS);

  // Send via SendGrid
  await sendOtpEmail(email, code);

  log.info({ email }, "Verification OTP sent");
}

/**
 * Verify a 6-digit OTP against the stored hash.
 *
 * On success: marks the email as verified in both Logto and our DB.
 */
export async function verifyEmailOtp(
  email: string,
  code: string,
): Promise<boolean> {
  const redis = getOtpRedis();
  const key = `${OTP_KEY_PREFIX}${email.toLowerCase()}`;

  const storedHash = await redis.get(key);
  if (!storedHash) {
    return false; // Expired or never sent
  }

  // Hash the provided code and compare
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(code));
  const hashHex = Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  if (hashHex !== storedHash) {
    return false; // Wrong code
  }

  // Valid — clean up
  await redis.del(key);

  // Mark email as verified in Logto via Management API
  try {
    const m2mToken = await getManagementToken();
    if (m2mToken) {
      const searchUrl = `${env.LOGTO_ENDPOINT}/api/users?search=${encodeURIComponent(email)}`;
      const searchRes = await fetch(searchUrl, {
        headers: { Authorization: `Bearer ${m2mToken}` },
      });

      if (searchRes.ok) {
        const users = (await searchRes.json()) as Array<{
          id: string;
          primaryEmail?: string;
        }>;
        const user = users.find(
          (u) => u.primaryEmail?.toLowerCase() === email.toLowerCase(),
        );

        if (user) {
          await fetch(`${env.LOGTO_ENDPOINT}/api/users/${user.id}`, {
            method: "PATCH",
            headers: {
              Authorization: `Bearer ${m2mToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ primaryEmailVerified: true }),
          });
        }
      }
    }
  } catch (logtoErr) {
    log.warn({ err: logtoErr }, "Failed to update Logto email verification — non-critical");
  }

  // Mark verified in our DB
  const profile = await authRepo.findProfileByEmail(email);
  if (profile && !profile.emailVerified) {
    await authRepo.markEmailVerified(profile.id);
    clearProfileCache();
  }

  log.info({ email }, "Email verified via OTP");
  return true;
}

// ── OTP Email Helper ────────────────────────────────────────────────────

async function sendOtpEmail(email: string, code: string): Promise<void> {
  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) {
    log.info({ email, code }, "SendGrid not configured — OTP logged for dev");
    return;
  }

  const fromEmail = process.env.SENDGRID_FROM_EMAIL ?? "noreply@unjynx.me";
  const fromName = process.env.SENDGRID_FROM_NAME ?? "UNJYNX";

  try {
    const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email }] }],
        from: { email: fromEmail, name: fromName },
        subject: "UNJYNX — Email Verification Code",
        content: [
          {
            type: "text/plain",
            value: [
              "Hi,",
              "",
              `Your UNJYNX verification code is: ${code}`,
              "",
              "This code expires in 10 minutes.",
              "",
              "If you didn't request this, please ignore this email.",
              "",
              "— UNJYNX Team",
            ].join("\n"),
          },
          {
            type: "text/html",
            value: `
              <div style="font-family: 'Outfit', sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #0F0A1A; color: #F0EBF7; border-radius: 16px;">
                <h1 style="color: #FFD700; font-size: 24px; margin-bottom: 8px;">UNJYNX</h1>
                <p style="color: #9B8BB8; margin-bottom: 24px;">Email Verification</p>
                <p>Your verification code is:</p>
                <div style="background: #1E1333; border: 1px solid #6C3CE0; border-radius: 8px; padding: 16px; margin: 16px 0; text-align: center;">
                  <code style="font-size: 32px; color: #FFD700; letter-spacing: 8px; font-weight: bold;">${code}</code>
                </div>
                <p style="color: #6B5B8A; font-size: 14px;">This code expires in 10 minutes.</p>
                <p style="color: #6B5B8A; font-size: 12px; margin-top: 24px;">If you didn't request this, please ignore this email.</p>
              </div>
            `,
          },
        ],
      }),
    });

    if (!response.ok) {
      log.warn({ status: response.status }, "OTP email send failed");
    }
  } catch (error) {
    log.warn({ error }, "OTP email error");
  }
}

// ── Dev Bypass (development only, no Logto required) ────────────────────

const DEV_ACCOUNTS: Record<string, { password: string; name: string; role: "owner" | "admin" | "member" }> = {
  "admin@unjynx.dev": { password: "admin123", name: "Dev Admin", role: "owner" },
  "user@unjynx.dev": { password: "user123", name: "Test User", role: "member" },
  "dev@unjynx.dev": { password: "dev123", name: "Dev Engineer", role: "admin" },
};

async function devBypassLogin(
  email: string,
  password: string,
  meta: SessionMeta,
): Promise<DirectAuthResult> {
  const account = DEV_ACCOUNTS[email.toLowerCase()];
  if (!account || password !== account.password) {
    throw new Error("Invalid email or password");
  }

  // Upsert a dev profile
  let profile = await authRepo.findProfileByEmail(email.toLowerCase());
  if (!profile) {
    const [created] = await (await import("../../db/index.js")).db
      .insert((await import("../../db/schema/index.js")).profiles)
      .values({
        email: email.toLowerCase(),
        name: account.name,
        adminRole: account.role,
        emailVerified: true,
        emailVerifiedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: (await import("../../db/schema/index.js")).profiles.email,
        set: { updatedAt: new Date() },
      })
      .returning();
    profile = created;
  }

  const accessToken = await jwtService.signAccessToken({
    profileId: profile.id,
    email: profile.email ?? email.toLowerCase(),
    name: profile.name ?? "Dev Admin",
    role: profile.adminRole ?? "owner",
    emailVerified: true,
  });

  const refreshToken = jwtService.generateRefreshToken();
  const tokenHash = await sessionSvc.hashToken(refreshToken);
  await sessionSvc.createSession(profile.id, tokenHash, {
    deviceType: meta.deviceType,
    os: meta.os,
    ipAddress: meta.ipAddress,
  });

  log.info({ email }, "Dev bypass login successful");

  return {
    accessToken,
    refreshToken,
    expiresIn: 900,
    tokenType: "Bearer",
    user: {
      id: profile.id,
      email: profile.email ?? email.toLowerCase(),
      name: profile.name,
      avatarUrl: profile.avatarUrl,
      emailVerified: true,
      adminRole: profile.adminRole ?? "owner",
    },
  };
}

// ── Helpers ─────────────────────────────────────────────────────────────

function generateTempPassword(): string {
  const chars =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%";
  let password = "";
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  for (const byte of bytes) {
    password += chars[byte % chars.length];
  }
  return password;
}

async function sendPasswordResetEmail(
  email: string,
  tempPassword: string,
): Promise<void> {
  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) {
    log.info(
      { email },
      "SendGrid not configured — skipping password reset email",
    );
    return;
  }

  const fromEmail =
    process.env.SENDGRID_FROM_EMAIL ?? "noreply@unjynx.me";
  const fromName = process.env.SENDGRID_FROM_NAME ?? "UNJYNX";

  try {
    const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email }] }],
        from: { email: fromEmail, name: fromName },
        subject: "UNJYNX — Password Reset",
        content: [
          {
            type: "text/plain",
            value: [
              "Hi,",
              "",
              "Your UNJYNX password has been reset.",
              "",
              `Your temporary password is: ${tempPassword}`,
              "",
              "Please sign in and change your password immediately.",
              "",
              "If you didn't request this, please ignore this email or contact support.",
              "",
              "— UNJYNX Team",
            ].join("\n"),
          },
          {
            type: "text/html",
            value: `
              <div style="font-family: 'Outfit', sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #0F0A1A; color: #F0EBF7; border-radius: 16px;">
                <h1 style="color: #FFD700; font-size: 24px; margin-bottom: 8px;">UNJYNX</h1>
                <p style="color: #9B8BB8; margin-bottom: 24px;">Password Reset</p>
                <p>Your password has been reset. Here is your temporary password:</p>
                <div style="background: #1E1333; border: 1px solid #6C3CE0; border-radius: 8px; padding: 16px; margin: 16px 0; text-align: center;">
                  <code style="font-size: 20px; color: #FFD700; letter-spacing: 2px;">${tempPassword}</code>
                </div>
                <p>Please sign in and change your password immediately.</p>
                <p style="color: #6B5B8A; font-size: 12px; margin-top: 24px;">If you didn't request this, please ignore this email.</p>
              </div>
            `,
          },
        ],
      }),
    });

    if (!response.ok) {
      log.warn(
        { status: response.status },
        "Password reset email send failed",
      );
    }
  } catch (error) {
    log.warn({ error }, "Password reset email error");
  }
}
