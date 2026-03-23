// ---------------------------------------------------------------------------
// Channels API
// ---------------------------------------------------------------------------

import { apiClient } from './client';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ChannelType =
  | 'whatsapp'
  | 'telegram'
  | 'instagram'
  | 'sms'
  | 'email'
  | 'discord'
  | 'slack'
  | 'push';

export type ChannelStatus = 'active' | 'pending' | 'failed' | 'disabled';

export interface Channel {
  readonly id: string;
  readonly type: ChannelType;
  readonly status: ChannelStatus;
  readonly identifier: string;
  readonly label: string | null;
  readonly isVerified: boolean;
  readonly isPrimary: boolean;
  readonly lastUsedAt: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface ChannelDelivery {
  readonly id: string;
  readonly channelId: string;
  readonly taskId: string;
  readonly status: 'queued' | 'sent' | 'delivered' | 'failed' | 'read';
  readonly sentAt: string | null;
  readonly deliveredAt: string | null;
  readonly failureReason: string | null;
  readonly createdAt: string;
}

export interface AddChannelPayload {
  readonly type: ChannelType;
  readonly identifier: string;
  readonly label?: string;
}

export interface VerifyChannelPayload {
  readonly code: string;
}

// ---------------------------------------------------------------------------
// API functions
// ---------------------------------------------------------------------------

export function getChannels(): Promise<readonly Channel[]> {
  return apiClient.get<readonly Channel[]>('/api/v1/channels');
}

export function getChannel(id: string): Promise<Channel> {
  return apiClient.get<Channel>(`/api/v1/channels/${id}`);
}

export function addChannel(payload: AddChannelPayload): Promise<Channel> {
  return apiClient.post<Channel>('/api/v1/channels', payload);
}

export function removeChannel(id: string): Promise<void> {
  return apiClient.delete(`/api/v1/channels/${id}`);
}

export function verifyChannel(id: string, payload: VerifyChannelPayload): Promise<Channel> {
  return apiClient.post<Channel>(`/api/v1/channels/${id}/verify`, payload);
}

export function resendVerification(id: string): Promise<void> {
  return apiClient.post(`/api/v1/channels/${id}/resend`);
}

export function setPrimaryChannel(id: string): Promise<Channel> {
  return apiClient.post<Channel>(`/api/v1/channels/${id}/primary`);
}

export function getDeliveries(params?: {
  readonly channelId?: string;
  readonly taskId?: string;
  readonly status?: ChannelDelivery['status'];
  readonly page?: number;
  readonly limit?: number;
}): Promise<readonly ChannelDelivery[]> {
  return apiClient.get<readonly ChannelDelivery[]>('/api/v1/channels/deliveries', {
    params: params as Record<string, string | number | boolean | undefined>,
  });
}
