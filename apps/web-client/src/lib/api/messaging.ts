// ---------------------------------------------------------------------------
// Messaging API (Slack-like channels)
// ---------------------------------------------------------------------------

import { apiClient } from './client';

export interface MsgChannel {
  readonly id: string;
  readonly name: string | null;
  readonly description: string | null;
  readonly channelType: 'public' | 'private' | 'dm' | 'group_dm';
  readonly topic: string | null;
  readonly isArchived: boolean;
  readonly memberCount: number;
  readonly messageCount: number;
  readonly lastMessageAt: string | null;
  readonly isJoined?: boolean;
}

export interface Message {
  readonly id: string;
  readonly channelId: string;
  readonly userId: string;
  readonly content: string;
  readonly threadId: string | null;
  readonly isThreadRoot: boolean;
  readonly replyCount: number;
  readonly mentionedUserIds: readonly string[];
  readonly isEdited: boolean;
  readonly isDeleted: boolean;
  readonly hasAttachments: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface MessageReaction {
  readonly id: string;
  readonly messageId: string;
  readonly userId: string;
  readonly emoji: string;
}

export interface UnreadCount {
  readonly channelId: string;
  readonly unreadCount: number;
}

// ─── Channels ────────────────────────────────────────────────────

export const getChannels = () => apiClient.get<readonly MsgChannel[]>('/api/v1/messaging/channels');
export const getChannel = (id: string) => apiClient.get<MsgChannel>(`/api/v1/messaging/channels/${id}`);
export const createChannel = (data: { name: string; description?: string; channelType?: string; topic?: string }) =>
  apiClient.post<MsgChannel>('/api/v1/messaging/channels', data);
export const updateChannel = (id: string, data: { name?: string; description?: string; topic?: string }) =>
  apiClient.patch<MsgChannel>(`/api/v1/messaging/channels/${id}`, data);
export const archiveChannel = (id: string) => apiClient.post<MsgChannel>(`/api/v1/messaging/channels/${id}/archive`);
export const getOrCreateDm = (userIds: readonly string[]) =>
  apiClient.post<MsgChannel>('/api/v1/messaging/dm', { userIds });

// ─── Members ─────────────────────────────────────────────────────

export const joinChannel = (id: string) => apiClient.post(`/api/v1/messaging/channels/${id}/join`);
export const leaveChannel = (id: string) => apiClient.post(`/api/v1/messaging/channels/${id}/leave`);
export const getChannelMembers = (id: string) => apiClient.get(`/api/v1/messaging/channels/${id}/members`);

// ─── Messages ────────────────────────────────────────────────────

export const getMessages = (channelId: string, params?: { limit?: number; before?: string }) =>
  apiClient.get<readonly Message[]>(`/api/v1/messaging/channels/${channelId}/messages`, { params });
export const getThread = (channelId: string, messageId: string, params?: { limit?: number }) =>
  apiClient.get<readonly Message[]>(`/api/v1/messaging/channels/${channelId}/messages/${messageId}/thread`, { params });
export const sendMessage = (channelId: string, data: {
  content: string; threadId?: string; mentionedUserIds?: string[]; isChannelMention?: boolean;
}) => apiClient.post<Message>(`/api/v1/messaging/channels/${channelId}/messages`, data);
export const editMessage = (id: string, content: string) =>
  apiClient.patch<Message>(`/api/v1/messaging/messages/${id}`, { content });
export const deleteMessage = (id: string) => apiClient.delete(`/api/v1/messaging/messages/${id}`);

// ─── Reactions ───────────────────────────────────────────────────

export const addReaction = (messageId: string, emoji: string) =>
  apiClient.post(`/api/v1/messaging/messages/${messageId}/reactions`, { emoji });
export const removeReaction = (messageId: string, emoji: string) =>
  apiClient.delete(`/api/v1/messaging/messages/${messageId}/reactions/${emoji}`);
export const getReactions = (messageId: string) =>
  apiClient.get<readonly MessageReaction[]>(`/api/v1/messaging/messages/${messageId}/reactions`);

// ─── Pins ────────────────────────────────────────────────────────

export const pinMessage = (channelId: string, messageId: string) =>
  apiClient.post(`/api/v1/messaging/channels/${channelId}/pins`, { messageId });
export const unpinMessage = (channelId: string, messageId: string) =>
  apiClient.delete(`/api/v1/messaging/channels/${channelId}/pins/${messageId}`);
export const getPinnedMessages = (channelId: string) =>
  apiClient.get(`/api/v1/messaging/channels/${channelId}/pins`);

// ─── Read / Unread ───────────────────────────────────────────────

export const markAsRead = (channelId: string, messageId: string) =>
  apiClient.post(`/api/v1/messaging/channels/${channelId}/read`, { messageId });
export const getUnreadCounts = () => apiClient.get<readonly UnreadCount[]>('/api/v1/messaging/unread');

// ─── Search ──────────────────────────────────────────────────────

export const searchMessages = (q: string, channelId?: string, limit?: number) =>
  apiClient.get<readonly Message[]>('/api/v1/messaging/search', { params: { q, channelId, limit } });
