import '../api_client.dart';
import '../api_response.dart';

/// API service for tag management and task-tag associations.
class TagApiService {
  final ApiClient _client;

  const TagApiService(this._client);

  // ── Tag CRUD ──────────────────────────────────────────────────────

  /// List all tags (paginated).
  Future<ApiResponse<List<dynamic>>> getTags({int page = 1, int limit = 20}) {
    return _client.get(
      '/tags',
      queryParameters: {'page': page.toString(), 'limit': limit.toString()},
    );
  }

  /// Get a single tag by ID.
  Future<ApiResponse<Map<String, dynamic>>> getTag(String tagId) {
    return _client.get('/tags/$tagId');
  }

  /// Create a new tag.
  Future<ApiResponse<Map<String, dynamic>>> createTag({
    required String name,
    String? color,
  }) {
    return _client.post(
      '/tags',
      data: {'name': name, if (color != null) 'color': color},
    );
  }

  /// Update a tag.
  Future<ApiResponse<Map<String, dynamic>>> updateTag(
    String tagId, {
    String? name,
    String? color,
  }) {
    return _client.patch(
      '/tags/$tagId',
      data: {if (name != null) 'name': name, if (color != null) 'color': color},
    );
  }

  /// Delete a tag.
  Future<ApiResponse<void>> deleteTag(String tagId) {
    return _client.delete('/tags/$tagId');
  }

  // ── Task-Tag Junction ─────────────────────────────────────────────

  /// List tags attached to a task.
  Future<ApiResponse<List<dynamic>>> getTaskTags(String taskId) {
    return _client.get('/tasks/$taskId/tags');
  }

  /// Add a tag to a task.
  Future<ApiResponse<Map<String, dynamic>>> addTagToTask(
    String taskId, {
    required String tagId,
  }) {
    return _client.post('/tasks/$taskId/tags', data: {'tagId': tagId});
  }

  /// Remove a tag from a task.
  Future<ApiResponse<void>> removeTagFromTask(String taskId, String tagId) {
    return _client.delete('/tasks/$taskId/tags/$tagId');
  }
}
