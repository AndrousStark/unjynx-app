import '../api_client.dart';
import '../api_response.dart';

/// API service for task comment CRUD operations.
///
/// Maps to backend routes: `/api/v1/tasks/:taskId/comments/*`
class CommentApiService {
  final ApiClient _client;

  const CommentApiService(this._client);

  /// List comments for a task with pagination.
  ///
  /// Returns a paginated response with `items` array and `meta` object.
  Future<ApiResponse<List<dynamic>>> getComments(
    String taskId, {
    int page = 1,
    int limit = 20,
  }) {
    return _client.get(
      '/tasks/$taskId/comments',
      queryParameters: {
        'page': page,
        'limit': limit,
      },
    );
  }

  /// Create a new comment on a task.
  Future<ApiResponse<Map<String, dynamic>>> createComment(
    String taskId, {
    required String content,
    String? idempotencyKey,
  }) {
    return _client.post(
      '/tasks/$taskId/comments',
      data: {'content': content},
      idempotencyKey: idempotencyKey,
    );
  }

  /// Update an existing comment.
  Future<ApiResponse<Map<String, dynamic>>> updateComment(
    String taskId,
    String commentId, {
    required String content,
  }) {
    return _client.patch(
      '/tasks/$taskId/comments/$commentId',
      data: {'content': content},
    );
  }

  /// Delete a comment.
  Future<ApiResponse<Map<String, dynamic>>> deleteComment(
    String taskId,
    String commentId,
  ) {
    return _client.delete('/tasks/$taskId/comments/$commentId');
  }
}
