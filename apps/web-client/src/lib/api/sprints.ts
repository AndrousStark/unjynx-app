// ---------------------------------------------------------------------------
// Sprints API
// ---------------------------------------------------------------------------

import { apiClient } from './client';

export interface Sprint {
  readonly id: string;
  readonly projectId: string;
  readonly name: string;
  readonly goal: string | null;
  readonly status: 'planning' | 'active' | 'completed' | 'cancelled';
  readonly startDate: string | null;
  readonly endDate: string | null;
  readonly committedPoints: number;
  readonly completedPoints: number;
  readonly retroWentWell: string | null;
  readonly retroToImprove: string | null;
  readonly retroActionItems: readonly string[];
  readonly createdAt: string;
}

export interface SprintTask {
  readonly sprintId: string;
  readonly taskId: string;
  readonly task: { id: string; title: string; status: string; priority: string; estimatePoints: number | null; assigneeId: string | null };
}

export interface BurndownEntry {
  readonly capturedAt: string;
  readonly totalPoints: number;
  readonly completedPoints: number;
  readonly remainingPoints: number;
}

export interface VelocityEntry {
  readonly name: string;
  readonly committed: number;
  readonly completed: number;
}

export const getSprints = (projectId: string) =>
  apiClient.get<readonly Sprint[]>('/api/v1/sprints', { params: { projectId } });
export const getActiveSprint = (projectId: string) =>
  apiClient.get<Sprint | null>('/api/v1/sprints/active', { params: { projectId } });
export const getSprint = (id: string) => apiClient.get<Sprint>(`/api/v1/sprints/${id}`);
export const createSprint = (data: { projectId: string; name: string; goal?: string; startDate?: string; endDate?: string }) =>
  apiClient.post<Sprint>('/api/v1/sprints', data);
export const updateSprint = (id: string, data: { name?: string; goal?: string; startDate?: string; endDate?: string }) =>
  apiClient.patch<Sprint>(`/api/v1/sprints/${id}`, data);
export const startSprint = (id: string) => apiClient.post<Sprint>(`/api/v1/sprints/${id}/start`);
export const completeSprint = (id: string, moveIncompleteToSprintId?: string) =>
  apiClient.post<{ sprint: Sprint; incompleteMoved: number }>(`/api/v1/sprints/${id}/complete`, { moveIncompleteToSprintId });
export const getSprintTasks = (id: string) => apiClient.get<readonly SprintTask[]>(`/api/v1/sprints/${id}/tasks`);
export const addTaskToSprint = (sprintId: string, taskId: string) =>
  apiClient.post(`/api/v1/sprints/${sprintId}/tasks`, { taskId });
export const removeTaskFromSprint = (sprintId: string, taskId: string) =>
  apiClient.delete(`/api/v1/sprints/${sprintId}/tasks/${taskId}`);
export const getBurndown = (id: string) => apiClient.get<readonly BurndownEntry[]>(`/api/v1/sprints/${id}/burndown`);
export const getVelocity = (projectId: string, limit?: number) =>
  apiClient.get<readonly VelocityEntry[]>('/api/v1/sprints/velocity', { params: { projectId, limit } });
export const saveRetro = (id: string, data: { wentWell?: string; toImprove?: string; actionItems?: string[] }) =>
  apiClient.post<Sprint>(`/api/v1/sprints/${id}/retro`, data);
