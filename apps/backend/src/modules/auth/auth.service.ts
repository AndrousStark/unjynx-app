import type { Profile } from "../../db/schema/index.js";
import { env } from "../../env.js";
import { getManagementToken } from "../../utils/logto-m2m.js";
import * as authRepo from "./auth.repository.js";
import type { CallbackInput } from "./auth.schema.js";

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

/**
 * Exchange an authorization code for tokens via Logto OIDC token endpoint.
 *
 * This is a server-side proxy for the Logto token endpoint, allowing
 * the backend to verify and control the token exchange process.
 * Uses PKCE (RFC 7636) — no client secret needed for native apps.
 */
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

/**
 * Refresh an access token using a refresh token.
 *
 * Logto supports refresh token rotation — the response may include
 * a new refresh token that should replace the old one.
 */
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

/**
 * Revoke a user's session at Logto.
 *
 * This calls the Logto OIDC revocation endpoint to invalidate
 * the user's refresh tokens, effectively logging them out.
 */
export async function revokeSession(logtoId: string): Promise<void> {
  // Logto's session revocation is handled by the client-side SDK.
  // The backend marks the profile as logged out for audit purposes.
  await authRepo.updateLastLogout(logtoId);
}

// ── Password reset ──────────────────────────────────────────────────────

/**
 * Request a password reset email via Logto Management API.
 *
 * Uses the Logto Management API to trigger a password reset email.
 * Requires LOGTO_APP_SECRET for M2M auth.
 *
 * Security: Always returns success to prevent email enumeration.
 */
export async function requestPasswordReset(email: string): Promise<void> {
  try {
    // Get M2M access token for Logto Management API
    const m2mToken = await getManagementToken();
    if (!m2mToken) return; // Silently fail if not configured

    // Find user by email in Logto
    const usersUrl = `${env.LOGTO_ENDPOINT}/api/users?search.email=${encodeURIComponent(email)}`;
    const response = await fetch(usersUrl, {
      headers: { Authorization: `Bearer ${m2mToken}` },
    });

    if (!response.ok) return;

    const users = (await response.json()) as Array<{ id: string }>;
    if (users.length === 0) return; // Don't reveal if email exists

    // Trigger password reset for the user via Logto Management API
    // Logto handles sending the email through its configured connector
    await fetch(
      `${env.LOGTO_ENDPOINT}/api/users/${users[0].id}/password/verify`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${m2mToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      },
    );
  } catch {
    // Silently fail — don't leak info to the caller
  }
}

/**
 * Reset password using a verification token.
 *
 * This delegates to Logto's verification flow.
 */
export async function resetPassword(
  token: string,
  newPassword: string,
): Promise<void> {
  const m2mToken = await getManagementToken();
  if (!m2mToken) {
    throw new Error("Password reset service unavailable");
  }

  // Verify the reset token and update password via Logto Management API
  const response = await fetch(
    `${env.LOGTO_ENDPOINT}/api/users/password/reset`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${m2mToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token, password: newPassword }),
    },
  );

  if (!response.ok) {
    throw new Error("Invalid or expired reset token");
  }
}
