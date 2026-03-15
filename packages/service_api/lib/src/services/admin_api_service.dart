import '../api_client.dart';
import '../api_response.dart';

/// API service for admin panel operations (team/enterprise admins).
class AdminApiService {
  final ApiClient _client;

  const AdminApiService(this._client);

  // ── Users ──

  /// List users (admin only).
  Future<ApiResponse<List<dynamic>>> getUsers({
    int page = 1,
    int limit = 50,
    String? search,
    String? role,
  }) {
    return _client.get('/admin/users', queryParameters: {
      'page': page,
      'limit': limit,
      if (search != null) 'search': search,
      if (role != null) 'role': role,
    });
  }

  /// Get user details.
  Future<ApiResponse<Map<String, dynamic>>> getUser(String userId) {
    return _client.get('/admin/users/$userId');
  }

  /// Update user (ban, role change, etc.).
  Future<ApiResponse<Map<String, dynamic>>> updateUser(
    String userId,
    Map<String, dynamic> data,
  ) {
    return _client.patch('/admin/users/$userId', data: data);
  }

  // ── Content ──

  /// List content entries.
  Future<ApiResponse<List<dynamic>>> getContent({
    int page = 1,
    int limit = 50,
    String? category,
  }) {
    return _client.get('/admin/content', queryParameters: {
      'page': page,
      'limit': limit,
      if (category != null) 'category': category,
    });
  }

  /// Create a content entry.
  Future<ApiResponse<Map<String, dynamic>>> createContent(
    Map<String, dynamic> data, {
    String? idempotencyKey,
  }) {
    return _client.post(
      '/admin/content',
      data: data,
      idempotencyKey: idempotencyKey,
    );
  }

  /// Update a content entry.
  Future<ApiResponse<Map<String, dynamic>>> updateContent(
    String contentId,
    Map<String, dynamic> data,
  ) {
    return _client.patch('/admin/content/$contentId', data: data);
  }

  /// Delete a content entry.
  Future<ApiResponse<Map<String, dynamic>>> deleteContent(String contentId) {
    return _client.delete('/admin/content/$contentId');
  }

  // ── Analytics ──

  /// Get platform analytics.
  Future<ApiResponse<Map<String, dynamic>>> getAnalytics({
    String range = '30d',
  }) {
    return _client.get('/admin/analytics', queryParameters: {
      'range': range,
    });
  }

  // ── Feature Flags ──

  /// List feature flags.
  Future<ApiResponse<List<dynamic>>> getFeatureFlags() {
    return _client.get('/admin/feature-flags');
  }

  /// Toggle a feature flag.
  Future<ApiResponse<Map<String, dynamic>>> toggleFeatureFlag(
    String flagId,
    Map<String, dynamic> data,
  ) {
    return _client.patch('/admin/feature-flags/$flagId', data: data);
  }

  // ── Audit Log ──

  /// Get audit log entries.
  Future<ApiResponse<List<dynamic>>> getAuditLog({
    int page = 1,
    int limit = 50,
    String? userId,
    String? action,
  }) {
    return _client.get('/admin/audit-log', queryParameters: {
      'page': page,
      'limit': limit,
      if (userId != null) 'userId': userId,
      if (action != null) 'action': action,
    });
  }

  // ── Broadcast ──

  /// Send a broadcast notification to all users or a segment.
  Future<ApiResponse<Map<String, dynamic>>> broadcast(
    Map<String, dynamic> data, {
    String? idempotencyKey,
  }) {
    return _client.post(
      '/admin/broadcast',
      data: data,
      idempotencyKey: idempotencyKey,
    );
  }
}
