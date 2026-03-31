// ---------------------------------------------------------------------------
// Workflows API
// ---------------------------------------------------------------------------

import { apiClient } from './client';

export interface Workflow {
  readonly id: string;
  readonly name: string;
  readonly description: string | null;
  readonly isDefault: boolean;
  readonly isSystem: boolean;
}

export interface WorkflowStatus {
  readonly id: string;
  readonly workflowId: string;
  readonly name: string;
  readonly category: 'todo' | 'in_progress' | 'done';
  readonly color: string | null;
  readonly sortOrder: number;
  readonly isInitial: boolean;
  readonly isFinal: boolean;
}

export interface WorkflowTransition {
  readonly id: string;
  readonly fromStatusId: string;
  readonly toStatusId: string;
  readonly name: string | null;
}

export interface WorkflowDetail extends Workflow {
  readonly statuses: readonly WorkflowStatus[];
  readonly transitions: readonly WorkflowTransition[];
}

export const getWorkflows = () => apiClient.get<readonly Workflow[]>('/api/v1/workflows');
export const getWorkflowDetail = (id: string) => apiClient.get<WorkflowDetail>(`/api/v1/workflows/${id}`);
export const getStatuses = (id: string) => apiClient.get<readonly WorkflowStatus[]>(`/api/v1/workflows/${id}/statuses`);
export const getAvailableTransitions = (id: string, fromStatusId: string) =>
  apiClient.get<readonly (WorkflowTransition & { toStatus: WorkflowStatus })[]>(`/api/v1/workflows/${id}/transitions/${fromStatusId}`);
export const createWorkflow = (data: { name: string; description?: string; isDefault?: boolean }) =>
  apiClient.post<Workflow>('/api/v1/workflows', data);
export const addStatus = (workflowId: string, data: { name: string; category: string; color?: string; sortOrder?: number; isInitial?: boolean; isFinal?: boolean }) =>
  apiClient.post<WorkflowStatus>(`/api/v1/workflows/${workflowId}/statuses`, data);
export const addTransition = (workflowId: string, data: { fromStatusId: string; toStatusId: string; name?: string }) =>
  apiClient.post<WorkflowTransition>(`/api/v1/workflows/${workflowId}/transitions`, data);
