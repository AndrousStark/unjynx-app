// ---------------------------------------------------------------------------
// Tasks API
// ---------------------------------------------------------------------------

import { apiClient } from './client';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Task {
  readonly id: string;
  readonly title: string;
  readonly description: string | null;
  readonly priority: 'none' | 'low' | 'medium' | 'high' | 'urgent';
  readonly status: 'todo' | 'in_progress' | 'done' | 'cancelled';
  readonly dueDate: string | null;
  readonly dueTime: string | null;
  readonly projectId: string | null;
  readonly sectionId: string | null;
  readonly parentId: string | null;
  readonly assigneeId: string | null;
  readonly labels: readonly string[];
  readonly sortOrder: number;
  readonly isRecurring: boolean;
  readonly rrule: string | null;
  readonly completedAt: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface CreateTaskPayload {
  readonly title: string;
  readonly description?: string;
  readonly priority?: Task['priority'];
  readonly dueDate?: string;
  readonly dueTime?: string;
  readonly projectId?: string;
  readonly sectionId?: string;
  readonly parentId?: string;
  readonly labels?: readonly string[];
  readonly rrule?: string;
}

export interface UpdateTaskPayload {
  readonly title?: string;
  readonly description?: string | null;
  readonly priority?: Task['priority'];
  readonly status?: Task['status'];
  readonly dueDate?: string | null;
  readonly dueTime?: string | null;
  readonly projectId?: string | null;
  readonly sectionId?: string | null;
  readonly parentId?: string | null;
  readonly labels?: readonly string[];
  readonly sortOrder?: number;
  readonly rrule?: string | null;
}

export interface MoveTaskPayload {
  readonly projectId?: string | null;
  readonly sectionId?: string | null;
  readonly sortOrder?: number;
}

export interface TasksFilter {
  readonly projectId?: string;
  readonly status?: Task['status'];
  readonly priority?: Task['priority'];
  readonly dueDate?: string;
  readonly dueBefore?: string;
  readonly dueAfter?: string;
  readonly search?: string;
  readonly page?: number;
  readonly limit?: number;
}

export interface CalendarTasksFilter {
  readonly start: string;
  readonly end: string;
  readonly projectId?: string;
}

// ---------------------------------------------------------------------------
// API functions
// ---------------------------------------------------------------------------

export function getTasks(filter?: TasksFilter): Promise<readonly Task[]> {
  return apiClient.get<readonly Task[]>('/api/v1/tasks', {
    params: filter as Record<string, string | number | boolean | undefined>,
  });
}

export function getTask(id: string): Promise<Task> {
  return apiClient.get<Task>(`/api/v1/tasks/${id}`);
}

export function createTask(payload: CreateTaskPayload): Promise<Task> {
  return apiClient.post<Task>('/api/v1/tasks', payload);
}

export function updateTask(id: string, payload: UpdateTaskPayload): Promise<Task> {
  return apiClient.patch<Task>(`/api/v1/tasks/${id}`, payload);
}

export function deleteTask(id: string): Promise<void> {
  return apiClient.delete(`/api/v1/tasks/${id}`);
}

export function completeTask(id: string): Promise<Task> {
  return apiClient.post<Task>(`/api/v1/tasks/${id}/complete`);
}

export function moveTask(id: string, payload: MoveTaskPayload): Promise<Task> {
  return apiClient.post<Task>(`/api/v1/tasks/${id}/move`, payload);
}

export function getCalendarTasks(filter: CalendarTasksFilter): Promise<readonly Task[]> {
  return apiClient.get<readonly Task[]>('/api/v1/tasks/calendar', {
    params: filter as Record<string, string | number | boolean | undefined>,
  });
}
