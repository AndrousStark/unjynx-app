// ---------------------------------------------------------------------------
// Team API
// ---------------------------------------------------------------------------

import { apiClient } from './client';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type TeamRole = 'owner' | 'admin' | 'member' | 'viewer';

export interface Team {
  readonly id: string;
  readonly name: string;
  readonly description: string | null;
  readonly avatarUrl: string | null;
  readonly memberCount: number;
  readonly plan: 'free' | 'pro' | 'team' | 'enterprise';
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface TeamMember {
  readonly id: string;
  readonly userId: string;
  readonly teamId: string;
  readonly role: TeamRole;
  readonly displayName: string;
  readonly email: string;
  readonly avatarUrl: string | null;
  readonly joinedAt: string;
  readonly lastActiveAt: string | null;
}

export interface TeamInvite {
  readonly id: string;
  readonly teamId: string;
  readonly email: string;
  readonly role: TeamRole;
  readonly status: 'pending' | 'accepted' | 'expired' | 'revoked';
  readonly invitedBy: string;
  readonly expiresAt: string;
  readonly createdAt: string;
}

export interface CreateTeamPayload {
  readonly name: string;
  readonly description?: string;
}

export interface InviteMemberPayload {
  readonly email: string;
  readonly role?: TeamRole;
}

export interface UpdateMemberRolePayload {
  readonly role: TeamRole;
}

// ---------------------------------------------------------------------------
// API functions
// ---------------------------------------------------------------------------

export function getTeams(): Promise<readonly Team[]> {
  return apiClient.get<readonly Team[]>('/api/v1/teams');
}

export function getTeam(id: string): Promise<Team> {
  return apiClient.get<Team>(`/api/v1/teams/${id}`);
}

export function createTeam(payload: CreateTeamPayload): Promise<Team> {
  return apiClient.post<Team>('/api/v1/teams', payload);
}

export function updateTeam(id: string, payload: Partial<CreateTeamPayload>): Promise<Team> {
  return apiClient.patch<Team>(`/api/v1/teams/${id}`, payload);
}

export function deleteTeam(id: string): Promise<void> {
  return apiClient.delete(`/api/v1/teams/${id}`);
}

export function getMembers(teamId: string): Promise<readonly TeamMember[]> {
  return apiClient.get<readonly TeamMember[]>(`/api/v1/teams/${teamId}/members`);
}

export function inviteMember(teamId: string, payload: InviteMemberPayload): Promise<TeamInvite> {
  return apiClient.post<TeamInvite>(`/api/v1/teams/${teamId}/invites`, payload);
}

export function updateMemberRole(teamId: string, memberId: string, payload: UpdateMemberRolePayload): Promise<TeamMember> {
  return apiClient.patch<TeamMember>(`/api/v1/teams/${teamId}/members/${memberId}`, payload);
}

export function removeMember(teamId: string, memberId: string): Promise<void> {
  return apiClient.delete(`/api/v1/teams/${teamId}/members/${memberId}`);
}

export function getInvites(teamId: string): Promise<readonly TeamInvite[]> {
  return apiClient.get<readonly TeamInvite[]>(`/api/v1/teams/${teamId}/invites`);
}

export function revokeInvite(teamId: string, inviteId: string): Promise<void> {
  return apiClient.delete(`/api/v1/teams/${teamId}/invites/${inviteId}`);
}

export function acceptInvite(token: string): Promise<TeamMember> {
  return apiClient.post<TeamMember>('/api/v1/teams/invites/accept', { token });
}
