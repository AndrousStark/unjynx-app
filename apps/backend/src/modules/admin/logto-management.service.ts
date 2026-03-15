import { env } from "../../env.js";
import { getManagementToken } from "../../utils/logto-m2m.js";

/**
 * Logto Management API service for admin user operations.
 *
 * Each function obtains an M2M token, makes the appropriate API call,
 * and throws a descriptive error on failure.
 */

// ── Helpers ────────────────────────────────────────────────────────────

function getBaseUrl(): string {
  return `${env.LOGTO_ENDPOINT}/api`;
}

async function requireToken(): Promise<string> {
  const token = await getManagementToken();
  if (!token) {
    throw new Error("Logto M2M credentials not configured — cannot call Management API");
  }
  return token;
}

async function handleResponse(
  response: Response,
  context: string,
): Promise<unknown> {
  if (response.ok) {
    // 204 No Content has no body
    if (response.status === 204) return undefined;
    return response.json();
  }

  const body = await response.text().catch(() => "");
  throw new Error(
    `Logto Management API error (${context}): ${response.status} — ${body}`,
  );
}

// ── User operations ────────────────────────────────────────────────────

interface CreateLogtoUserResult {
  readonly id: string;
}

/**
 * Create a new user in Logto.
 *
 * @returns The Logto user ID (sub).
 */
export async function createLogtoUser(
  email: string,
  password: string,
  name?: string,
): Promise<string> {
  const token = await requireToken();
  const baseUrl = getBaseUrl();

  const body: Record<string, unknown> = {
    primaryEmail: email,
    password,
  };
  if (name) {
    body.name = name;
  }

  const response = await fetch(`${baseUrl}/users`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const result = (await handleResponse(
    response,
    "createUser",
  )) as CreateLogtoUserResult;

  return result.id;
}

/**
 * Update an existing Logto user's profile fields.
 */
export async function updateLogtoUser(
  logtoUserId: string,
  data: { email?: string; name?: string },
): Promise<void> {
  const token = await requireToken();
  const baseUrl = getBaseUrl();

  const body: Record<string, unknown> = {};
  if (data.email !== undefined) {
    body.primaryEmail = data.email;
  }
  if (data.name !== undefined) {
    body.name = data.name;
  }

  if (Object.keys(body).length === 0) return;

  const response = await fetch(`${baseUrl}/users/${logtoUserId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  await handleResponse(response, "updateUser");
}

/**
 * Set a Logto user's password directly (admin reset).
 */
export async function setLogtoPassword(
  logtoUserId: string,
  password: string,
): Promise<void> {
  const token = await requireToken();
  const baseUrl = getBaseUrl();

  const response = await fetch(
    `${baseUrl}/users/${logtoUserId}/password`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ password }),
    },
  );

  await handleResponse(response, "setPassword");
}

/**
 * Delete a user from Logto.
 */
export async function deleteLogtoUser(logtoUserId: string): Promise<void> {
  const token = await requireToken();
  const baseUrl = getBaseUrl();

  const response = await fetch(`${baseUrl}/users/${logtoUserId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });

  await handleResponse(response, "deleteUser");
}

/**
 * Suspend or unsuspend a Logto user.
 * Suspended users cannot sign in.
 */
export async function suspendLogtoUser(
  logtoUserId: string,
  isSuspended: boolean,
): Promise<void> {
  const token = await requireToken();
  const baseUrl = getBaseUrl();

  const response = await fetch(`${baseUrl}/users/${logtoUserId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ isSuspended }),
  });

  await handleResponse(response, isSuspended ? "suspendUser" : "unsuspendUser");
}

/**
 * Assign a role to a Logto user.
 */
export async function assignLogtoRole(
  logtoUserId: string,
  roleId: string,
): Promise<void> {
  const token = await requireToken();
  const baseUrl = getBaseUrl();

  const response = await fetch(`${baseUrl}/users/${logtoUserId}/roles`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ roleIds: [roleId] }),
  });

  await handleResponse(response, "assignRole");
}

/**
 * Remove a role from a Logto user.
 */
export async function removeLogtoRole(
  logtoUserId: string,
  roleId: string,
): Promise<void> {
  const token = await requireToken();
  const baseUrl = getBaseUrl();

  const response = await fetch(`${baseUrl}/users/${logtoUserId}/roles`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ roleIds: [roleId] }),
  });

  await handleResponse(response, "removeRole");
}
