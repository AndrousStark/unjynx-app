// ---------------------------------------------------------------------------
// Reports & Analytics API
// ---------------------------------------------------------------------------

import { apiClient } from './client';

export interface VelocityData {
  readonly sprints: readonly { name: string; committed: number; completed: number; startDate: string | null; endDate: string | null }[];
  readonly averageVelocity: number;
}

export interface CycleTimeData {
  readonly averageDays: number | null;
  readonly medianDays: number | null;
  readonly distribution: readonly { range: string; count: number }[];
  readonly byPriority: readonly { priority: string; avgDays: number }[];
}

export interface WorkloadData {
  readonly members: readonly {
    userId: string; name: string | null;
    activeTasks: number; completedThisPeriod: number;
    overdueCount: number; estimatedHours: number;
  }[];
}

export interface SlaComplianceData {
  readonly policies: readonly { policyName: string; totalTasks: number; withinSla: number; breached: number; complianceRate: number }[];
  readonly overallComplianceRate: number;
}

export interface OrgSummary {
  readonly totalTasks: number;
  readonly completedTasks: number;
  readonly overdueTasks: number;
  readonly activeMembers: number;
  readonly completionRate: number;
  readonly tasksCreatedThisWeek: number;
  readonly tasksCompletedThisWeek: number;
}

export const getVelocity = (projectId: string, limit?: number) =>
  apiClient.get<VelocityData>('/api/v1/reports/velocity', { params: { projectId, limit } });
export const getCycleTime = (params?: { projectId?: string; days?: number }) =>
  apiClient.get<CycleTimeData>('/api/v1/reports/cycle-time', { params });
export const getWorkload = (projectId?: string) =>
  apiClient.get<WorkloadData>('/api/v1/reports/workload', { params: { projectId } });
export const getSlaCompliance = (params?: { projectId?: string; days?: number }) =>
  apiClient.get<SlaComplianceData>('/api/v1/reports/sla', { params });
export const getOrgSummary = () => apiClient.get<OrgSummary>('/api/v1/reports/summary');
