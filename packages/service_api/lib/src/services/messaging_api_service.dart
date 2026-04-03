import '../api_client.dart';
import '../api_response.dart';

/// API service for team messaging (channels, messages, reactions, pins).
class MessagingApiService {
  final ApiClient _client;

  const MessagingApiService(this._client);

  // ── Channels ──────────────────────────────────────────────────────

  /// List all channels the user has access to.
  Future<ApiResponse<List<dynamic>>> getChannels() {
    return _client.get('/messaging/channels');
  }

  /// Get a single channel with recent messages.
  Future<ApiResponse<Map<String, dynamic>>> getChannel(String channelId) {
    return _client.get('/messaging/channels/$channelId');
  }

  /// Create a new channel.
  Future<ApiResponse<Map<String, dynamic>>> createChannel({
    required String name,
    String? description,
    bool isPrivate = false,
  }) {
    return _client.post(
      '/messaging/channels',
      data: {
        'name': name,
        if (description != null) 'description': description,
        'isPrivate': isPrivate,
      },
    );
  }

  /// Join a channel.
  Future<ApiResponse<void>> joinChannel(String channelId) {
    return _client.post('/messaging/channels/$channelId/join');
  }

  /// Leave a channel.
  Future<ApiResponse<void>> leaveChannel(String channelId) {
    return _client.post('/messaging/channels/$channelId/leave');
  }

  /// Get channel members.
  Future<ApiResponse<List<dynamic>>> getChannelMembers(String channelId) {
    return _client.get('/messaging/channels/$channelId/members');
  }

  // ── Messages ──────────────────────────────────────────────────────

  /// Get messages in a channel (paginated).
  Future<ApiResponse<List<dynamic>>> getMessages(
    String channelId, {
    int limit = 50,
    String? before,
  }) {
    return _client.get(
      '/messaging/channels/$channelId/messages',
      queryParameters: {
        'limit': limit.toString(),
        if (before != null) 'before': before,
      },
    );
  }

  /// Send a message.
  Future<ApiResponse<Map<String, dynamic>>> sendMessage(
    String channelId, {
    required String content,
    String? parentId,
  }) {
    return _client.post(
      '/messaging/channels/$channelId/messages',
      data: {'content': content, if (parentId != null) 'parentId': parentId},
    );
  }

  /// Edit a message.
  Future<ApiResponse<Map<String, dynamic>>> editMessage(
    String messageId, {
    required String content,
  }) {
    return _client.patch(
      '/messaging/messages/$messageId',
      data: {'content': content},
    );
  }

  /// Delete a message.
  Future<ApiResponse<void>> deleteMessage(String messageId) {
    return _client.delete('/messaging/messages/$messageId');
  }

  // ── Reactions ─────────────────────────────────────────────────────

  /// Add a reaction to a message.
  Future<ApiResponse<Map<String, dynamic>>> addReaction(
    String messageId, {
    required String emoji,
  }) {
    return _client.post(
      '/messaging/messages/$messageId/reactions',
      data: {'emoji': emoji},
    );
  }

  /// Remove a reaction.
  Future<ApiResponse<void>> removeReaction(String messageId, String emoji) {
    return _client.delete('/messaging/messages/$messageId/reactions/$emoji');
  }

  /// Get reactions on a message.
  Future<ApiResponse<List<dynamic>>> getReactions(String messageId) {
    return _client.get('/messaging/messages/$messageId/reactions');
  }

  // ── Pins ──────────────────────────────────────────────────────────

  /// Pin a message.
  Future<ApiResponse<Map<String, dynamic>>> pinMessage(
    String channelId, {
    required String messageId,
  }) {
    return _client.post(
      '/messaging/channels/$channelId/pins',
      data: {'messageId': messageId},
    );
  }

  /// Unpin a message.
  Future<ApiResponse<void>> unpinMessage(String channelId, String messageId) {
    return _client.delete('/messaging/channels/$channelId/pins/$messageId');
  }

  /// Get pinned messages.
  Future<ApiResponse<List<dynamic>>> getPinnedMessages(String channelId) {
    return _client.get('/messaging/channels/$channelId/pins');
  }

  // ── Unread ────────────────────────────────────────────────────────

  /// Get unread message counts per channel.
  Future<ApiResponse<Map<String, dynamic>>> getUnreadCounts() {
    return _client.get('/messaging/unread');
  }

  /// Mark channel messages as read up to a timestamp.
  Future<ApiResponse<void>> markRead(
    String channelId, {
    required String lastReadAt,
  }) {
    return _client.post(
      '/messaging/channels/$channelId/read',
      data: {'lastReadAt': lastReadAt},
    );
  }
}
