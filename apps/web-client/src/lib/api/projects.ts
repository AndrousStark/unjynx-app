// ---------------------------------------------------------------------------
// Projects API
// ---------------------------------------------------------------------------

import { apiClient } from './client';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Project {
  readonly id: string;
  readonly name: string;
  readonly description: string | null;
  readonly color: string;
  readonly icon: string | null;
  readonly isArchived: boolean;
  readonly isFavorite: boolean;
  readonly viewMode: 'list' | 'board' | 'calendar' | 'timeline' | 'table';
  readonly sortOrder: number;
  readonly taskCount: number;
  readonly completedTaskCount: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface Section {
  readonly id: string;
  readonly name: string;
  readonly projectId: string;
  readonly sortOrder: number;
  readonly createdAt: string;
}

export interface CreateProjectPayload {
  readonly name: string;
  readonly description?: string;
  readonly color?: string;
  readonly icon?: string;
  readonly viewMode?: Project['viewMode'];
}

export interface UpdateProjectPayload {
  readonly name?: string;
  readonly description?: string | null;
  readonly color?: string;
  readonly icon?: string | null;
  readonly isArchived?: boolean;
  readonly isFavorite?: boolean;
  readonly viewMode?: Project['viewMode'];
  readonly sortOrder?: number;
}

export interface CreateSectionPayload {
  readonly name: string;
  readonly sortOrder?: number;
}

// ---------------------------------------------------------------------------
// API functions
// ---------------------------------------------------------------------------

export function getProjects(): Promise<readonly Project[]> {
  return apiClient.get<readonly Project[]>('/api/v1/projects');
}

export function getProject(id: string): Promise<Project> {
  return apiClient.get<Project>(`/api/v1/projects/${id}`);
}

export function createProject(payload: CreateProjectPayload): Promise<Project> {
  return apiClient.post<Project>('/api/v1/projects', payload);
}

export function updateProject(id: string, payload: UpdateProjectPayload): Promise<Project> {
  return apiClient.patch<Project>(`/api/v1/projects/${id}`, payload);
}

export function deleteProject(id: string): Promise<void> {
  return apiClient.delete(`/api/v1/projects/${id}`);
}

export function archiveProject(id: string): Promise<Project> {
  return apiClient.post<Project>(`/api/v1/projects/${id}/archive`);
}

export function getSections(projectId: string): Promise<readonly Section[]> {
  return apiClient.get<readonly Section[]>(`/api/v1/projects/${projectId}/sections`);
}

export function createSection(projectId: string, payload: CreateSectionPayload): Promise<Section> {
  return apiClient.post<Section>(`/api/v1/projects/${projectId}/sections`, payload);
}

export function updateSection(projectId: string, sectionId: string, payload: { readonly name?: string; readonly sortOrder?: number }): Promise<Section> {
  return apiClient.patch<Section>(`/api/v1/projects/${projectId}/sections/${sectionId}`, payload);
}

export function deleteSection(projectId: string, sectionId: string): Promise<void> {
  return apiClient.delete(`/api/v1/projects/${projectId}/sections/${sectionId}`);
}
