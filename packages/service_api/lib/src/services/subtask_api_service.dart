import '../api_client.dart';
import '../api_response.dart';

/// API service for subtask management within a parent task.
class SubtaskApiService {
  final ApiClient _client;

  const SubtaskApiService(this._client);

  /// List subtasks for a task (paginated).
  Future<ApiResponse<List<dynamic>>> getSubtasks(
    String taskId, {
    int page = 1,
    int limit = 20,
  }) {
    return _client.get(
      '/tasks/$taskId/subtasks',
      queryParameters: {'page': page.toString(), 'limit': limit.toString()},
    );
  }

  /// Create a subtask.
  Future<ApiResponse<Map<String, dynamic>>> createSubtask(
    String taskId, {
    required String title,
  }) {
    return _client.post('/tasks/$taskId/subtasks', data: {'title': title});
  }

  /// Update a subtask (title, completion, sort order).
  Future<ApiResponse<Map<String, dynamic>>> updateSubtask(
    String taskId,
    String subId, {
    String? title,
    bool? isCompleted,
    int? sortOrder,
  }) {
    return _client.patch(
      '/tasks/$taskId/subtasks/$subId',
      data: {
        if (title != null) 'title': title,
        if (isCompleted != null) 'isCompleted': isCompleted,
        if (sortOrder != null) 'sortOrder': sortOrder,
      },
    );
  }

  /// Delete a subtask.
  Future<ApiResponse<void>> deleteSubtask(String taskId, String subId) {
    return _client.delete('/tasks/$taskId/subtasks/$subId');
  }

  /// Reorder subtasks by providing the new ID order.
  Future<ApiResponse<Map<String, dynamic>>> reorderSubtasks(
    String taskId, {
    required List<String> ids,
  }) {
    return _client.post('/tasks/$taskId/subtasks/reorder', data: {'ids': ids});
  }

  /// Get subtask completion progress (completed / total).
  Future<ApiResponse<Map<String, dynamic>>> getProgress(String taskId) {
    return _client.get('/tasks/$taskId/subtasks/progress');
  }
}
