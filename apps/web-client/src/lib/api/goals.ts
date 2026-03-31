// ---------------------------------------------------------------------------
// Goals / OKR API
// ---------------------------------------------------------------------------

import { apiClient } from './client';

export interface Goal {
  readonly id: string;
  readonly title: string;
  readonly description: string | null;
  readonly parentId: string | null;
  readonly ownerId: string | null;
  readonly targetValue: string | null;
  readonly currentValue: string;
  readonly unit: string;
  readonly level: 'company' | 'team' | 'individual';
  readonly status: 'on_track' | 'at_risk' | 'behind' | 'completed' | 'cancelled';
  readonly dueDate: string | null;
  readonly completedAt: string | null;
  readonly createdAt: string;
}

export interface GoalWithChildren extends Goal {
  readonly children: readonly Goal[];
  readonly ownerName: string | null;
  readonly progressPercent: number;
}

export interface GoalTask {
  readonly taskId: string;
  readonly title: string;
  readonly status: string;
  readonly priority: string;
}

export const getGoals = (params?: { level?: string; ownerId?: string; parentId?: string }) =>
  apiClient.get<readonly Goal[]>('/api/v1/goals', { params });
export const getGoalTree = () => apiClient.get<readonly GoalWithChildren[]>('/api/v1/goals/tree');
export const getGoal = (id: string) => apiClient.get<Goal>(`/api/v1/goals/${id}`);
export const createGoal = (data: {
  title: string; description?: string; parentId?: string; ownerId?: string;
  targetValue?: string; unit?: string; level?: string; dueDate?: string;
}) => apiClient.post<Goal>('/api/v1/goals', data);
export const updateGoal = (id: string, data: {
  title?: string; description?: string; ownerId?: string; targetValue?: string;
  currentValue?: string; unit?: string; status?: string; dueDate?: string;
}) => apiClient.patch<Goal>(`/api/v1/goals/${id}`, data);
export const archiveGoal = (id: string) => apiClient.delete(`/api/v1/goals/${id}`);
export const getGoalTasks = (id: string) => apiClient.get<readonly GoalTask[]>(`/api/v1/goals/${id}/tasks`);
export const linkTaskToGoal = (goalId: string, taskId: string) =>
  apiClient.post(`/api/v1/goals/${goalId}/tasks`, { taskId });
export const unlinkTaskFromGoal = (goalId: string, taskId: string) =>
  apiClient.delete(`/api/v1/goals/${goalId}/tasks/${taskId}`);
export const recalculateGoal = (id: string) => apiClient.post<Goal>(`/api/v1/goals/${id}/recalculate`);
