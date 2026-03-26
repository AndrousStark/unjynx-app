// ── MFA Configuration Service ──────────────────────────────────────────
// Checks MFA status via Logto Management API and determines whether
// MFA is mandatory based on the user's admin role.
//
// Logto Management API:
//   GET /api/users/{userId}/mfa-verifications
//   → returns array of { id, type, createdAt }
//   where type is "Totp" | "WebAuthn" | "BackupCode"

import { env } from "../../env.js";
import { getManagementToken } from "../../utils/logto-m2m.js";
import { logger } from "../../middleware/logger.js";

const log = logger.child({ module: "mfa" });

// ── Types ─────────────────────────────────────────────────────────────

export type MfaMethod = "totp" | "webauthn" | "backup_codes";

export interface MfaStatus {
  readonly enabled: boolean;
  readonly methods: readonly MfaMethod[];
  readonly mandatory: boolean;
}

interface LogtoMfaVerification {
  readonly id: string;
  readonly type: string;       // "Totp" | "WebAuthn" | "BackupCode"
  readonly createdAt: string;
}

// ── Roles requiring mandatory MFA ─────────────────────────────────────

const MANDATORY_MFA_ROLES: ReadonlySet<string> = new Set(["owner", "admin"]);

// ── Service Functions ─────────────────────────────────────────────────

/**
 * Check if a user has MFA configured via Logto Management API.
 *
 * @param logtoUserId - The Logto user ID (sub).
 * @returns Array of MFA methods the user has configured, or empty array.
 */
export async function getMfaStatus(logtoUserId: string): Promise<readonly MfaMethod[]> {
  const token = await getManagementToken();
  if (!token) {
    log.warn("M2M token unavailable — cannot check MFA status");
    return [];
  }

  try {
    const url = `${env.LOGTO_ENDPOINT}/api/users/${logtoUserId}/mfa-verifications`;
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      // 404 means user not found or MFA not set up
      if (response.status === 404) return [];

      log.warn(
        { status: response.status, logtoUserId },
        "Failed to fetch MFA verifications from Logto",
      );
      return [];
    }

    const verifications = (await response.json()) as readonly LogtoMfaVerification[];

    return verifications.map((v) => mapLogtoMfaType(v.type));
  } catch (error) {
    log.error(
      { error: error instanceof Error ? error.message : "Unknown", logtoUserId },
      "MFA status check failed",
    );
    return [];
  }
}

/**
 * Determine whether MFA is mandatory for a given admin role.
 *
 * owner, admin → mandatory
 * member, viewer, guest, null → optional
 */
export function requireMfaForRole(role: string | null | undefined): boolean {
  if (!role) return false;
  return MANDATORY_MFA_ROLES.has(role);
}

/**
 * Build the complete MFA status response for a user.
 *
 * @param logtoUserId - Logto user ID.
 * @param adminRole   - The user's admin role (nullable).
 */
export async function getFullMfaStatus(
  logtoUserId: string,
  adminRole: string | null | undefined,
): Promise<MfaStatus> {
  const methods = await getMfaStatus(logtoUserId);
  const mandatory = requireMfaForRole(adminRole);

  return {
    enabled: methods.length > 0,
    methods,
    mandatory,
  };
}

// ── Helpers ───────────────────────────────────────────────────────────

function mapLogtoMfaType(logtoType: string): MfaMethod {
  switch (logtoType.toLowerCase()) {
    case "totp":
      return "totp";
    case "webauthn":
      return "webauthn";
    case "backupcode":
      return "backup_codes";
    default:
      return "totp"; // fallback
  }
}
