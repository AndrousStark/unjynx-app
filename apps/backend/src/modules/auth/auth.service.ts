import type { Profile } from "../../db/schema/index.js";
import { env } from "../../env.js";
import { getManagementToken } from "../../utils/logto-m2m.js";
import { logger } from "../../middleware/logger.js";
import * as authRepo from "./auth.repository.js";
import type { CallbackInput } from "./auth.schema.js";

const log = logger.child({ module: "auth" });

interface LogtoUser {
  readonly sub: string;
  readonly email?: string;
  readonly name?: string;
}

interface TokenResponse {
  readonly accessToken: string;
  readonly refreshToken?: string;
  readonly expiresIn: number;
  readonly tokenType: string;
}

// ── Profile sync ────────────────────────────────────────────────────────

export async function syncProfile(user: LogtoUser): Promise<Profile> {
  return authRepo.upsertProfile({
    logtoId: user.sub,
    email: user.email,
    name: user.name,
  });
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
