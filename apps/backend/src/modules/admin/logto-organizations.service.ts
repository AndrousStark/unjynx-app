// ── Logto Organizations ↔ Teams Sync ──────────────────────────────
//
// Maps UNJYNX teams to Logto organizations, enabling org-level RBAC.
// Each team creation/update/delete is mirrored to Logto Organizations API.
// Member additions/removals are synced, and org-level roles are mapped.
//
// Logto Organizations API reference:
//   - POST   /api/organizations                     — Create organization
//   - PATCH  /api/organizations/:id                  — Update organization
//   - DELETE /api/organizations/:id                  — Delete organization
//   - POST   /api/organizations/:id/users            — Add member
//   - DELETE /api/organizations/:id/users/:userId     — Remove member
//   - PUT    /api/organizations/:id/users/:userId/roles — Set member roles

import { eq } from "drizzle-orm";
import { db } from "../../db/index.js";
import { teams } from "../../db/schema/index.js";
import { env } from "../../env.js";
import { getManagementToken } from "../../utils/logto-m2m.js";
import { logger } from "../../middleware/logger.js";

const log = logger.child({ module: "logto-organizations" });

// ── Helpers ────────────────────────────────────────────────────────

function getBaseUrl(): string {
  return `${env.LOGTO_ENDPOINT}/api`;
}

async function requireToken(): Promise<string> {
  const token = await getManagementToken();
  if (!token) {
    throw new Error("Logto M2M credentials not configured");
  }
  return token;
}

async function handleResponse(
  response: Response,
  context: string,
): Promise<unknown> {
  if (response.ok) {
    if (response.status === 204) return undefined;
    return response.json();
  }
  const body = await response.text().catch(() => "");
  throw new Error(
    `Logto Organizations API error (${context}): ${response.status} — ${body}`,
  );
}

// ── Team Role → Logto Organization Role Mapping ──────────────────

/**
 * UNJYNX team roles map to Logto organization role IDs.
 * These role IDs are created during RBAC setup (see logto-rbac.service.ts).
 * Env vars allow overriding for different Logto tenants.
 */
function getOrgRoleId(teamRole: string): string | null {
  const roleMap: Record<string, string | undefined> = {
    owner: process.env.LOGTO_ORG_ROLE_OWNER ?? "org-owner",
    admin: process.env.LOGTO_ORG_ROLE_ADMIN ?? "org-admin",
    member: process.env.LOGTO_ORG_ROLE_MEMBER ?? "org-member",
    viewer: process.env.LOGTO_ORG_ROLE_VIEWER ?? "org-viewer",
  };
  return roleMap[teamRole] ?? null;
}

// ── Organization CRUD ─────────────────────────────────────────────

interface LogtoOrganization {
  readonly id: string;
  readonly name: string;
  readonly description?: string;
}

/**
 * Create a Logto organization for an UNJYNX team.
 * Stores the Logto org ID in the team's metadata (JSON in name field convention).
 */
export async function createOrganization(
  teamId: string,
  teamName: string,
  description?: string,
): Promise<LogtoOrganization> {
  const token = await requireToken();
  const baseUrl = getBaseUrl();

  const response = await fetch(`${baseUrl}/organizations`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: teamName,
      description: description ?? `UNJYNX Team: ${teamName}`,
    }),
  });

  const org = (await handleResponse(
    response,
    "createOrganization",
  )) as LogtoOrganization;

  log.info(
    { teamId, logtoOrgId: org.id },
    "Created Logto organization for team",
  );

  return org;
}

/**
 * Update a Logto organization (e.g. when team name changes).
 */
export async function updateOrganization(
  logtoOrgId: string,
  data: { name?: string; description?: string },
): Promise<void> {
  const token = await requireToken();
  const baseUrl = getBaseUrl();

  const body: Record<string, unknown> = {};
  if (data.name !== undefined) body.name = data.name;
  if (data.description !== undefined) body.description = data.description;
  if (Object.keys(body).length === 0) return;

  const response = await fetch(`${baseUrl}/organizations/${logtoOrgId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  await handleResponse(response, "updateOrganization");
  log.info({ logtoOrgId }, "Updated Logto organization");
}

/**
 * Delete a Logto organization (when team is dissolved).
 */
export async function deleteOrganization(
  logtoOrgId: string,
): Promise<void> {
  const token = await requireToken();
  const baseUrl = getBaseUrl();

  const response = await fetch(`${baseUrl}/organizations/${logtoOrgId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });

  await handleResponse(response, "deleteOrganization");
  log.info({ logtoOrgId }, "Deleted Logto organization");
}

/**
 * List all organizations (admin view).
 */
export async function listOrganizations(): Promise<LogtoOrganization[]> {
  const token = await requireToken();
  const baseUrl = getBaseUrl();

  const response = await fetch(`${baseUrl}/organizations`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  return (await handleResponse(
    response,
    "listOrganizations",
  )) as LogtoOrganization[];
}

// ── Member Management ──────────────────────────────────────────────

/**
 * Add a user to a Logto organization.
 */
export async function addOrganizationMember(
  logtoOrgId: string,
  logtoUserId: string,
): Promise<void> {
  const token = await requireToken();
  const baseUrl = getBaseUrl();

  const response = await fetch(
    `${baseUrl}/organizations/${logtoOrgId}/users`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userIds: [logtoUserId] }),
    },
  );

  await handleResponse(response, "addOrganizationMember");
  log.info({ logtoOrgId, logtoUserId }, "Added member to Logto organization");
}

/**
 * Remove a user from a Logto organization.
 */
export async function removeOrganizationMember(
  logtoOrgId: string,
  logtoUserId: string,
): Promise<void> {
  const token = await requireToken();
  const baseUrl = getBaseUrl();

  const response = await fetch(
    `${baseUrl}/organizations/${logtoOrgId}/users/${logtoUserId}`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    },
  );

  await handleResponse(response, "removeOrganizationMember");
  log.info(
    { logtoOrgId, logtoUserId },
    "Removed member from Logto organization",
  );
}

/**
 * Set a member's roles within an organization.
 */
export async function setOrganizationMemberRoles(
  logtoOrgId: string,
  logtoUserId: string,
  roleIds: readonly string[],
): Promise<void> {
  const token = await requireToken();
  const baseUrl = getBaseUrl();

  const response = await fetch(
    `${baseUrl}/organizations/${logtoOrgId}/users/${logtoUserId}/roles`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ organizationRoleIds: [...roleIds] }),
    },
  );

  await handleResponse(response, "setOrganizationMemberRoles");
  log.info(
    { logtoOrgId, logtoUserId, roleIds },
    "Set member roles in Logto organization",
  );
}

// ── High-Level Sync Functions ──────────────────────────────────────

/**
 * Sync a team creation to Logto.
 * Called after a team is created in the database.
 * Fire-and-forget: failure here doesn't block team creation.
 */
export async function syncTeamCreated(
  teamId: string,
  teamName: string,
  ownerLogtoId: string,
): Promise<string | null> {
  try {
    const org = await createOrganization(teamId, teamName);

    // Add owner as member
    await addOrganizationMember(org.id, ownerLogtoId);

    // Set owner role
    const ownerRoleId = getOrgRoleId("owner");
    if (ownerRoleId) {
      await setOrganizationMemberRoles(org.id, ownerLogtoId, [ownerRoleId]);
    }

    return org.id;
  } catch (error) {
    log.error(
      { error, teamId },
      "Failed to sync team creation to Logto Organizations",
    );
    return null;
  }
}

/**
 * Sync a team update to Logto.
 */
export async function syncTeamUpdated(
  logtoOrgId: string,
  teamName: string,
): Promise<void> {
  try {
    await updateOrganization(logtoOrgId, { name: teamName });
  } catch (error) {
    log.error(
      { error, logtoOrgId },
      "Failed to sync team update to Logto Organizations",
    );
  }
}

/**
 * Sync a team deletion to Logto.
 */
export async function syncTeamDeleted(logtoOrgId: string): Promise<void> {
  try {
    await deleteOrganization(logtoOrgId);
  } catch (error) {
    log.error(
      { error, logtoOrgId },
      "Failed to sync team deletion to Logto Organizations",
    );
  }
}

/**
 * Sync a member addition to Logto.
 */
export async function syncMemberAdded(
  logtoOrgId: string,
  logtoUserId: string,
  teamRole: string,
): Promise<void> {
  try {
    await addOrganizationMember(logtoOrgId, logtoUserId);

    const roleId = getOrgRoleId(teamRole);
    if (roleId) {
      await setOrganizationMemberRoles(logtoOrgId, logtoUserId, [roleId]);
    }
  } catch (error) {
    log.error(
      { error, logtoOrgId, logtoUserId },
      "Failed to sync member addition to Logto Organizations",
    );
  }
}

/**
 * Sync a member removal from Logto.
 */
export async function syncMemberRemoved(
  logtoOrgId: string,
  logtoUserId: string,
): Promise<void> {
  try {
    await removeOrganizationMember(logtoOrgId, logtoUserId);
  } catch (error) {
    log.error(
      { error, logtoOrgId, logtoUserId },
      "Failed to sync member removal from Logto Organizations",
    );
  }
}

/**
 * Sync a member role change to Logto.
 */
export async function syncMemberRoleChanged(
  logtoOrgId: string,
  logtoUserId: string,
  newRole: string,
): Promise<void> {
  try {
    const roleId = getOrgRoleId(newRole);
    if (roleId) {
      await setOrganizationMemberRoles(logtoOrgId, logtoUserId, [roleId]);
    }
  } catch (error) {
    log.error(
      { error, logtoOrgId, logtoUserId, newRole },
      "Failed to sync member role change to Logto Organizations",
    );
  }
}
