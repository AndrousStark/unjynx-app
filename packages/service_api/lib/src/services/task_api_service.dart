import '../api_client.dart';
import '../api_response.dart';

/// API service for task CRUD and actions.
class TaskApiService {
  final ApiClient _client;

  const TaskApiService(this._client);

  /// List tasks with offset-based pagination.
  Future<ApiResponse<List<dynamic>>> getTasks({
    int page = 1,
    int limit = 20,
    String? status,
    String? priority,
    String? projectId,
  }) {
    return _client.get('/tasks', queryParameters: {
      'page': page,
      'limit': limit,
      if (status != null) 'status': status,
      if (priority != null) 'priority': priority,
      if (projectId != null) 'projectId': projectId,
    });
  }

  /// List tasks with cursor-based pagination (for infinite scroll).
  Future<ApiResponse<List<dynamic>>> getTasksWithCursor({
    String? cursor,
    int limit = 50,
    String? status,
    String? priority,
    String? search,
    String sort = '-created_at',
  }) {
    return _client.get('/tasks/cursor', queryParameters: {
      'limit': limit,
      'sort': sort,
      if (cursor != null) 'cursor': cursor,
      if (status != null) 'status': status,
      if (priority != null) 'priority': priority,
      if (search != null) 'search': search,
    });
  }

  /// Create a new task.
  Future<ApiResponse<Map<String, dynamic>>> createTask(
    Map<String, dynamic> data, {
    String? idempotencyKey,
  }) {
    return _client.post(
      '/tasks',
      data: data,
      idempotencyKey: idempotencyKey,
    );
  }

  /// Get a single task by ID.
  Future<ApiResponse<Map<String, dynamic>>> getTask(String id) {
    return _client.get('/tasks/$id');
  }

  /// Update a task.
  Future<ApiResponse<Map<String, dynamic>>> updateTask(
    String id,
    Map<String, dynamic> data, {
    String? idempotencyKey,
  }) {
    return _client.patch(
      '/tasks/$id',
      data: data,
      idempotencyKey: idempotencyKey,
    );
  }

  /// Delete a task.
  Future<ApiResponse<Map<String, dynamic>>> deleteTask(String id) {
    return _client.delete('/tasks/$id');
  }

  /// Mark a task as completed.
  Future<ApiResponse<Map<String, dynamic>>> completeTask(String id) {
    return _client.post('/tasks/$id/complete');
  }

  /// Mark a completed task as not completed.
  Future<ApiResponse<Map<String, dynamic>>> uncompleteTask(String id) {
    return _client.post('/tasks/$id/uncomplete');
  }

  /// Snooze a task for [minutes].
  Future<ApiResponse<Map<String, dynamic>>> snoozeTask(
    String id, {
    required int minutes,
  }) {
    return _client.post('/tasks/$id/snooze', data: {'minutes': minutes});
  }

  /// Move a task to a different project.
  Future<ApiResponse<Map<String, dynamic>>> moveTask(
    String id, {
    String? projectId,
  }) {
    return _client.post('/tasks/$id/move', data: {'projectId': projectId});
  }

  /// Duplicate a task.
  Future<ApiResponse<Map<String, dynamic>>> duplicateTask(String id) {
    return _client.post('/tasks/$id/duplicate');
  }

  /// Create multiple tasks at once.
  Future<ApiResponse<List<dynamic>>> bulkCreate(
    List<Map<String, dynamic>> tasks,
  ) {
    return _client.post('/tasks/bulk', data: {'tasks': tasks});
  }

  /// Update multiple tasks at once.
  Future<ApiResponse<List<dynamic>>> bulkUpdate(
    List<Map<String, dynamic>> tasks,
  ) {
    return _client.patch('/tasks/bulk', data: {'tasks': tasks});
  }

  /// Delete multiple tasks by ID.
  Future<ApiResponse<Map<String, dynamic>>> bulkDelete(List<String> ids) {
    return _client.delete('/tasks/bulk', data: {'ids': ids});
  }
}
