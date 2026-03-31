// ---------------------------------------------------------------------------
// Custom Fields API
// ---------------------------------------------------------------------------

import { apiClient } from './client';

export interface CustomFieldDefinition {
  readonly id: string;
  readonly orgId: string;
  readonly name: string;
  readonly fieldKey: string;
  readonly fieldType: 'text' | 'number' | 'date' | 'select' | 'multi_select' | 'user' | 'url' | 'checkbox' | 'email' | 'phone' | 'rich_text' | 'label' | 'currency';
  readonly description: string | null;
  readonly isRequired: boolean;
  readonly defaultValue: unknown;
  readonly options: {
    choices?: readonly { label: string; value: string; color?: string }[];
    currency?: string;
    min?: number;
    max?: number;
    placeholder?: string;
  } | null;
  readonly applicableTaskTypes: readonly string[] | null;
  readonly sortOrder: number;
  readonly isArchived: boolean;
}

export interface CustomFieldValue {
  readonly id: string;
  readonly taskId: string;
  readonly fieldId: string;
  readonly value: unknown;
}

export const getFieldDefinitions = () =>
  apiClient.get<readonly CustomFieldDefinition[]>('/api/v1/custom-fields');

export const getFieldDefinition = (id: string) =>
  apiClient.get<CustomFieldDefinition>(`/api/v1/custom-fields/${id}`);

export const createFieldDefinition = (data: {
  name: string; fieldKey: string; fieldType: string; description?: string;
  isRequired?: boolean; options?: Record<string, unknown>;
  applicableTaskTypes?: string[];
}) => apiClient.post<CustomFieldDefinition>('/api/v1/custom-fields', data);

export const updateFieldDefinition = (id: string, data: {
  name?: string; description?: string; isRequired?: boolean;
  options?: Record<string, unknown>; sortOrder?: number;
}) => apiClient.patch<CustomFieldDefinition>(`/api/v1/custom-fields/${id}`, data);

export const archiveFieldDefinition = (id: string) =>
  apiClient.delete(`/api/v1/custom-fields/${id}`);

export const getFieldValues = (taskId: string) =>
  apiClient.get<readonly CustomFieldValue[]>(`/api/v1/custom-fields/tasks/${taskId}/values`);

export const setFieldValue = (taskId: string, fieldId: string, value: unknown) =>
  apiClient.put(`/api/v1/custom-fields/tasks/${taskId}/values`, { fieldId, value });

export const deleteFieldValue = (taskId: string, fieldId: string) =>
  apiClient.delete(`/api/v1/custom-fields/tasks/${taskId}/values/${fieldId}`);
