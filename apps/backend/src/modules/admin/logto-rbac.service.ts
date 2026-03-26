// ── Logto RBAC Service ───────────────────────────────────────────────
//
// Manages Logto API resources, scopes, and roles for the UNJYNX platform.
//
// Logto RBAC model:
//   API Resource  → represents our backend API (e.g., https://api.unjynx.me)
//   Scopes        → permissions attached to the resource (e.g., tasks:create, admin:manage)
//   Roles         → bundles of scopes (e.g., "member" role has tasks:create, projects:create)
//
// When a user logs in and requests a token with this resource as audience,
// the JWT will include the scopes granted by their assigned roles.
// The auth middleware can then validate these scopes.
//
// This service provides:
//   - One-time RBAC setup (registers resource, scopes, roles)
//   - Status check (lists current configuration)

import { env } from "../../env.js";
import { getManagementToken } from "../../utils/logto-m2m.js";
import { logger } from "../../middleware/logger.js";

const log = logger.child({ module: "logto-rbac" });

// ── Constants ──────────────────────────────────────────────────────

const API_RESOURCE_INDICATOR =
  process.env.LOGTO_API_RESOURCE ?? "https://api.unjynx.me";
const API_RESOURCE_NAME = "UNJYNX API";

/**
 * Scopes that map to our feature catalog.
 * These are registered on the UNJYNX API resource in Logto.
 */
const UNJYNX_SCOPES = [
  // Core
  { name: "tasks:create", description: "Create tasks" },
  { name: "tasks:read", description: "Read tasks" },
  { name: "tasks:update", description: "Update tasks" },
  { name: "tasks:delete", description: "Delete tasks" },
  { name: "projects:create", description: "Create projects" },
  { name: "projects:read", description: "Read projects" },
  { name: "projects:update", description: "Update projects" },
  { name: "projects:delete", description: "Delete projects" },
  // Channels
  { name: "channels:push", description: "Use push notifications" },
  { name: "channels:telegram", description: "Use Telegram channel" },
  { name: "channels:whatsapp", description: "Use WhatsApp channel" },
  { name: "channels:email", description: "Use email channel" },
  { name: "channels:sms", description: "Use SMS channel" },
  { name: "channels:instagram", description: "Use Instagram channel" },
  { name: "channels:slack", description: "Use Slack channel" },
  { name: "channels:discord", description: "Use Discord channel" },
  // Premium features
  { name: "ai:chat", description: "Use AI chat features" },
  { name: "ai:schedule", description: "Use AI auto-scheduling" },
  { name: "gamification:read", description: "View gamification data" },
  { name: "content:daily", description: "Access daily content" },
  { name: "progress:read", description: "View progress tracking" },
  // Team
  { name: "teams:create", description: "Create teams" },
  { name: "teams:manage", description: "Manage team members and settings" },
  { name: "teams:reports", description: "View team reports" },
  // Admin
  { name: "admin:read", description: "Read admin data" },
  { name: "admin:manage", description: "Manage users, content, flags" },
  { name: "admin:billing", description: "Manage billing and subscriptions" },
  { name: "admin:impersonate", description: "Impersonate users" },
  { name: "admin:panic", description: "Activate/deactivate panic mode" },
  // Enterprise
  { name: "sso:saml", description: "SSO/SAML integration" },
  { name: "audit:read", description: "Read audit logs" },
  { name: "api:access", description: "External API access" },
  { name: "branding:custom", description: "Custom branding" },
] as const;

/**
 * Role definitions with scope bundles.
 * Each role gets a specific set of scopes.
 */
const ROLE_DEFINITIONS = [
  {
    name: "unjynx:guest",
    description: "Guest — can only view shared resources",
    scopes: ["tasks:read", "projects:read"],
  },
  {
    name: "unjynx:viewer",
    description: "Viewer — read-only access to own data",
    scopes: [
      "tasks:read", "projects:read", "progress:read",
      "content:daily", "gamification:read",
    ],
  },
  {
    name: "unjynx:member",
    description: "Member — standard user with full create/edit access",
    scopes: [
      "tasks:create", "tasks:read", "tasks:update", "tasks:delete",
      "projects:create", "projects:read", "projects:update", "projects:delete",
      "channels:push", "channels:telegram", "channels:whatsapp",
      "channels:email", "channels:sms", "channels:instagram",
      "channels:slack", "channels:discord",
      "ai:chat", "ai:schedule",
      "gamification:read", "content:daily", "progress:read",
    ],
  },
  {
    name: "unjynx:admin",
    description: "Admin — manage users, content, and flags",
    scopes: [
      "tasks:create", "tasks:read", "tasks:update", "tasks:delete",
      "projects:create", "projects:read", "projects:update", "projects:delete",
      "channels:push", "channels:telegram", "channels:whatsapp",
      "channels:email", "channels:sms", "channels:instagram",
      "channels:slack", "channels:discord",
      "ai:chat", "ai:schedule",
      "gamification:read", "content:daily", "progress:read",
      "teams:create", "teams:manage", "teams:reports",
      "admin:read", "admin:manage",
    ],
  },
  {
    name: "unjynx:owner",
    description: "Owner — full access including billing, impersonation, panic mode",
    scopes: UNJYNX_SCOPES.map((s) => s.name),
  },
] as const;

/**
 * Organization role definitions for team-level RBAC.
 */
const ORG_ROLE_DEFINITIONS = [
  {
    name: "org-viewer",
    description: "Team viewer — read-only",
    scopes: ["tasks:read", "projects:read"],
  },
  {
    name: "org-member",
    description: "Team member — standard access",
    scopes: [
      "tasks:create", "tasks:read", "tasks:update", "tasks:delete",
      "projects:create", "projects:read", "projects:update", "projects:delete",
    ],
  },
  {
    name: "org-admin",
    description: "Team admin — manage team",
    scopes: [
      "tasks:create", "tasks:read", "tasks:update", "tasks:delete",
      "projects:create", "projects:read", "projects:update", "projects:delete",
      "teams:manage", "teams:reports",
    ],
  },
  {
    name: "org-owner",
    description: "Team owner — full team control",
    scopes: [
      "tasks:create", "tasks:read", "tasks:update", "tasks:delete",
      "projects:create", "projects:read", "projects:update", "projects:delete",
      "teams:create", "teams:manage", "teams:reports",
    ],
  },
] as const;

// ── Helpers ─────────────────────────────────────────────────────────

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
    `Logto RBAC API error (${context}): ${response.status} — ${body}`,
  );
}

// ── API Resource Management ────────────────────────────────────────

interface LogtoResource {
  readonly id: string;
  readonly name: string;
  readonly indicator: string;
  readonly scopes?: readonly { id: string; name: string }[];
}

interface LogtoRole {
  readonly id: string;
  readonly name: string;
  readonly description?: string;
}

/**
 * Find or create the UNJYNX API resource in Logto.
 */
async function ensureApiResource(token: string): Promise<string> {
  const baseUrl = getBaseUrl();

  // Check if resource already exists
  const listResponse = await fetch(`${baseUrl}/resources`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const resources = (await handleResponse(
    listResponse,
    "listResources",
  )) as LogtoResource[];

  const existing = resources.find(
    (r) => r.indicator === API_RESOURCE_INDICATOR,
  );
  if (existing) {
    log.info({ resourceId: existing.id }, "API resource already exists");
    return existing.id;
  }

  // Create the resource
  const createResponse = await fetch(`${baseUrl}/resources`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: API_RESOURCE_NAME,
      indicator: API_RESOURCE_INDICATOR,
    }),
  });

  const created = (await handleResponse(
    createResponse,
    "createResource",
  )) as LogtoResource;

  log.info({ resourceId: created.id }, "Created API resource");
  return created.id;
}

/**
 * Register all scopes on the API resource.
 * Skips scopes that already exist (idempotent).
 */
async function ensureScopes(
  token: string,
  resourceId: string,
): Promise<number> {
  const baseUrl = getBaseUrl();

  // Get existing scopes
  const getResponse = await fetch(`${baseUrl}/resources/${resourceId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const resource = (await handleResponse(
    getResponse,
    "getResource",
  )) as LogtoResource;

  const existingNames = new Set(
    (resource.scopes ?? []).map((s) => s.name),
  );

  let created = 0;

  for (const scope of UNJYNX_SCOPES) {
    if (existingNames.has(scope.name)) continue;

    const response = await fetch(
      `${baseUrl}/resources/${resourceId}/scopes`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(scope),
      },
    );

    await handleResponse(response, `createScope:${scope.name}`);
    created++;
  }

  log.info(
    { resourceId, total: UNJYNX_SCOPES.length, created },
    "Scopes ensured on API resource",
  );

  return created;
}

/**
 * Create roles and assign scopes to them.
 * Skips roles that already exist (idempotent).
 */
async function ensureRoles(
  token: string,
  resourceId: string,
): Promise<number> {
  const baseUrl = getBaseUrl();

  // Get all resource scopes to map names → IDs
  const getResponse = await fetch(`${baseUrl}/resources/${resourceId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const resource = (await handleResponse(
    getResponse,
    "getResourceForRoles",
  )) as LogtoResource;

  const scopeNameToId = new Map(
    (resource.scopes ?? []).map((s) => [s.name, s.id]),
  );

  // Get existing roles
  const rolesResponse = await fetch(`${baseUrl}/roles`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const existingRoles = (await handleResponse(
    rolesResponse,
    "listRoles",
  )) as LogtoRole[];

  const existingRoleNames = new Set(existingRoles.map((r) => r.name));

  let created = 0;

  for (const roleDef of ROLE_DEFINITIONS) {
    if (existingRoleNames.has(roleDef.name)) continue;

    // Create the role
    const createResponse = await fetch(`${baseUrl}/roles`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: roleDef.name,
        description: roleDef.description,
        type: "User",
      }),
    });

    const role = (await handleResponse(
      createResponse,
      `createRole:${roleDef.name}`,
    )) as LogtoRole;

    // Assign scopes to the role
    const scopeIds = roleDef.scopes
      .map((name) => scopeNameToId.get(name))
      .filter((id): id is string => id !== undefined);

    if (scopeIds.length > 0) {
      const assignResponse = await fetch(
        `${baseUrl}/roles/${role.id}/scopes`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ scopeIds }),
        },
      );

      await handleResponse(
        assignResponse,
        `assignScopes:${roleDef.name}`,
      );
    }

    created++;
  }

  log.info(
    { total: ROLE_DEFINITIONS.length, created },
    "Roles ensured in Logto",
  );

  return created;
}

/**
 * Create organization roles for team-level RBAC.
 */
async function ensureOrganizationRoles(token: string): Promise<number> {
  const baseUrl = getBaseUrl();

  // Get existing organization roles
  const listResponse = await fetch(`${baseUrl}/organization-roles`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  let existingOrgRoles: LogtoRole[] = [];
  try {
    existingOrgRoles = (await handleResponse(
      listResponse,
      "listOrgRoles",
    )) as LogtoRole[];
  } catch {
    // Organization roles API may not be available — skip
    log.warn("Organization roles API not available — skipping");
    return 0;
  }

  const existingNames = new Set(existingOrgRoles.map((r) => r.name));
  let created = 0;

  for (const roleDef of ORG_ROLE_DEFINITIONS) {
    if (existingNames.has(roleDef.name)) continue;

    try {
      const response = await fetch(`${baseUrl}/organization-roles`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: roleDef.name,
          description: roleDef.description,
        }),
      });

      await handleResponse(response, `createOrgRole:${roleDef.name}`);
      created++;
    } catch (error) {
      log.warn(
        { error, roleName: roleDef.name },
        "Failed to create organization role",
      );
    }
  }

  log.info(
    { total: ORG_ROLE_DEFINITIONS.length, created },
    "Organization roles ensured in Logto",
  );

  return created;
}

// ── Public API ──────────────────────────────────────────────────────

export interface RbacSetupResult {
  readonly resourceId: string;
  readonly scopesCreated: number;
  readonly rolesCreated: number;
  readonly orgRolesCreated: number;
  readonly totalScopes: number;
  readonly totalRoles: number;
}

/**
 * One-time RBAC setup: registers API resource, scopes, and roles in Logto.
 * Idempotent — safe to call multiple times.
 */
export async function setupLogtoRbac(): Promise<RbacSetupResult> {
  const token = await requireToken();

  log.info("Starting Logto RBAC setup...");

  // Step 1: Ensure API resource exists
  const resourceId = await ensureApiResource(token);

  // Step 2: Register all scopes
  const scopesCreated = await ensureScopes(token, resourceId);

  // Step 3: Create roles with scope bundles
  const rolesCreated = await ensureRoles(token, resourceId);

  // Step 4: Create organization roles
  const orgRolesCreated = await ensureOrganizationRoles(token);

  log.info(
    { resourceId, scopesCreated, rolesCreated, orgRolesCreated },
    "Logto RBAC setup complete",
  );

  return {
    resourceId,
    scopesCreated,
    rolesCreated,
    orgRolesCreated,
    totalScopes: UNJYNX_SCOPES.length,
    totalRoles: ROLE_DEFINITIONS.length,
  };
}

export interface RbacStatus {
  readonly configured: boolean;
  readonly resourceIndicator: string;
  readonly resourceId: string | null;
  readonly scopeCount: number;
  readonly roleCount: number;
  readonly roles: readonly { name: string; id: string }[];
}

/**
 * Get the current RBAC configuration status from Logto.
 */
export async function getRbacStatus(): Promise<RbacStatus> {
  const token = await requireToken();
  const baseUrl = getBaseUrl();

  // Check for API resource
  const listResponse = await fetch(`${baseUrl}/resources`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const resources = (await handleResponse(
    listResponse,
    "listResources",
  )) as LogtoResource[];

  const resource = resources.find(
    (r) => r.indicator === API_RESOURCE_INDICATOR,
  );

  if (!resource) {
    return {
      configured: false,
      resourceIndicator: API_RESOURCE_INDICATOR,
      resourceId: null,
      scopeCount: 0,
      roleCount: 0,
      roles: [],
    };
  }

  // Get scopes
  const getResponse = await fetch(`${baseUrl}/resources/${resource.id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const fullResource = (await handleResponse(
    getResponse,
    "getResource",
  )) as LogtoResource;

  // Get roles
  const rolesResponse = await fetch(`${baseUrl}/roles`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const allRoles = (await handleResponse(
    rolesResponse,
    "listRoles",
  )) as LogtoRole[];

  const unjynxRoles = allRoles.filter((r) =>
    r.name.startsWith("unjynx:"),
  );

  return {
    configured: true,
    resourceIndicator: API_RESOURCE_INDICATOR,
    resourceId: resource.id,
    scopeCount: fullResource.scopes?.length ?? 0,
    roleCount: unjynxRoles.length,
    roles: unjynxRoles.map((r) => ({ name: r.name, id: r.id })),
  };
}
