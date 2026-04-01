import '../api_client.dart';
import '../api_response.dart';

/// API service for goal management (company → team → individual hierarchy).
class GoalApiService {
  final ApiClient _client;

  const GoalApiService(this._client);

  // ── CRUD ──────────────────────────────────────────────────────────

  /// Create a new goal.
  Future<ApiResponse<Map<String, dynamic>>> createGoal({
    required String title,
    String? description,
    String? parentId,
    String? ownerId,
    String? targetValue,
    String? unit,
    String? level,
    String? dueDate,
  }) {
    return _client.post(
      '/goals',
      data: {
        'title': title,
        if (description != null) 'description': description,
        if (parentId != null) 'parentId': parentId,
        if (ownerId != null) 'ownerId': ownerId,
        if (targetValue != null) 'targetValue': targetValue,
        if (unit != null) 'unit': unit,
        if (level != null) 'level': level,
        if (dueDate != null) 'dueDate': dueDate,
      },
    );
  }

  /// List goals with optional filters.
  Future<ApiResponse<List<dynamic>>> getGoals({
    String? level,
    String? ownerId,
    String? parentId,
  }) {
    return _client.get(
      '/goals',
      queryParameters: {
        if (level != null) 'level': level,
        if (ownerId != null) 'ownerId': ownerId,
        if (parentId != null) 'parentId': parentId,
      },
    );
  }

  /// Get the full goal hierarchy tree.
  Future<ApiResponse<List<dynamic>>> getGoalTree() {
    return _client.get('/goals/tree');
  }

  /// Get a single goal.
  Future<ApiResponse<Map<String, dynamic>>> getGoal(String goalId) {
    return _client.get('/goals/$goalId');
  }

  /// Update a goal.
  Future<ApiResponse<Map<String, dynamic>>> updateGoal(
    String goalId, {
    String? title,
    String? description,
    String? ownerId,
    String? targetValue,
    String? currentValue,
    String? unit,
    String? status,
    String? dueDate,
  }) {
    return _client.patch(
      '/goals/$goalId',
      data: {
        if (title != null) 'title': title,
        if (description != null) 'description': description,
        if (ownerId != null) 'ownerId': ownerId,
        if (targetValue != null) 'targetValue': targetValue,
        if (currentValue != null) 'currentValue': currentValue,
        if (unit != null) 'unit': unit,
        if (status != null) 'status': status,
        if (dueDate != null) 'dueDate': dueDate,
      },
    );
  }

  /// Archive a goal (manager+ only).
  Future<ApiResponse<void>> archiveGoal(String goalId) {
    return _client.delete('/goals/$goalId');
  }

  // ── Task Links ────────────────────────────────────────────────────

  /// List tasks linked to a goal.
  Future<ApiResponse<List<dynamic>>> getGoalTasks(String goalId) {
    return _client.get('/goals/$goalId/tasks');
  }

  /// Link a task to a goal.
  Future<ApiResponse<Map<String, dynamic>>> linkTask(
    String goalId, {
    required String taskId,
  }) {
    return _client.post('/goals/$goalId/tasks', data: {'taskId': taskId});
  }

  /// Unlink a task from a goal.
  Future<ApiResponse<void>> unlinkTask(String goalId, String taskId) {
    return _client.delete('/goals/$goalId/tasks/$taskId');
  }

  // ── Progress ──────────────────────────────────────────────────────

  /// Force-recalculate goal progress from linked tasks.
  Future<ApiResponse<Map<String, dynamic>>> recalculate(String goalId) {
    return _client.post('/goals/$goalId/recalculate');
  }
}
