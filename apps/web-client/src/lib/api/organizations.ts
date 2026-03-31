// ---------------------------------------------------------------------------
// Organizations API
// ---------------------------------------------------------------------------

import { apiClient } from './client';
import type { Organization } from '../store/org-store';

// ─── Types ───────────────────────────────────────────────────────

export interface OrgMember {
  readonly id: string;
  readonly orgId: string;
  readonly userId: string;
  readonly role: 'owner' | 'admin' | 'manager' | 'member' | 'viewer' | 'guest';
  readonly status: string;
  readonly joinedAt: string;
  readonly lastActiveAt: string;
}

export interface OrgInvite {
  readonly id: string;
  readonly orgId: string;
  readonly email: string;
  readonly role: string;
  readonly inviteCode: string;
  readonly status: string;
  readonly expiresAt: string;
  readonly createdAt: string;
}

// ─── Organization CRUD ───────────────────────────────────────────

export function getOrganizations(): Promise<readonly Organization[]> {
  return apiClient.get('/api/v1/orgs');
}

export function getOrganization(orgId: string): Promise<Organization> {
  return apiClient.get(`/api/v1/orgs/${orgId}`);
}

export function createOrganization(data: {
  name: string;
  slug: string;
  logoUrl?: string;
  industryMode?: string;
}): Promise<Organization> {
  return apiClient.post('/api/v1/orgs', data);
}

export function updateOrganization(
  orgId: string,
  data: {
    name?: string;
    slug?: string;
    logoUrl?: string | null;
    industryMode?: string | null;
    settings?: Record<string, unknown>;
  },
): Promise<Organization> {
  return apiClient.patch(`/api/v1/orgs/${orgId}`, data);
}

export function deleteOrganization(orgId: string): Promise<void> {
  return apiClient.delete(`/api/v1/orgs/${orgId}`);
}

// ─── Members ─────────────────────────────────────────────────────

export function getMembers(orgId: string): Promise<readonly OrgMember[]> {
  return apiClient.get(`/api/v1/orgs/${orgId}/members`);
}

export function inviteMember(
  orgId: string,
  data: { email: string; role?: string },
): Promise<OrgInvite> {
  return apiClient.post(`/api/v1/orgs/${orgId}/invite`, data);
}

export function getPendingInvites(orgId: string): Promise<readonly OrgInvite[]> {
  return apiClient.get(`/api/v1/orgs/${orgId}/invites`);
}

export function updateMemberRole(
  orgId: string,
  userId: string,
  role: string,
): Promise<OrgMember> {
  return apiClient.patch(`/api/v1/orgs/${orgId}/members/${userId}`, { role });
}

export function removeMember(orgId: string, userId: string): Promise<void> {
  return apiClient.delete(`/api/v1/orgs/${orgId}/members/${userId}`);
}

export function leaveOrganization(orgId: string): Promise<void> {
  return apiClient.post(`/api/v1/orgs/${orgId}/leave`);
}

export function acceptInvite(inviteCode: string): Promise<OrgMember> {
  return apiClient.post('/api/v1/orgs/accept-invite', { inviteCode });
}

// ─── GDPR ────────────────────────────────────────────────────────

export function exportOrgData(orgId: string): Promise<unknown> {
  return apiClient.get(`/api/v1/orgs/${orgId}/export`);
}

export function deleteOrgData(orgId: string): Promise<unknown> {
  return apiClient.delete(`/api/v1/orgs/${orgId}/data`);
}
