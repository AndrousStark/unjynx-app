import '../api_client.dart';
import '../api_response.dart';

/// API service for sprint management (agile workflow).
class SprintApiService {
  final ApiClient _client;

  const SprintApiService(this._client);

  // ── CRUD ──────────────────────────────────────────────────────────

  /// Create a new sprint.
  Future<ApiResponse<Map<String, dynamic>>> createSprint({
    required String projectId,
    required String name,
    String? goal,
    String? startDate,
    String? endDate,
  }) {
    return _client.post(
      '/sprints',
      data: {
        'projectId': projectId,
        'name': name,
        if (goal != null) 'goal': goal,
        if (startDate != null) 'startDate': startDate,
        if (endDate != null) 'endDate': endDate,
      },
    );
  }

  /// List sprints for a project.
  Future<ApiResponse<List<dynamic>>> getSprints({required String projectId}) {
    return _client.get('/sprints', queryParameters: {'projectId': projectId});
  }

  /// Get the currently active sprint for a project.
  Future<ApiResponse<Map<String, dynamic>>> getActiveSprint({
    required String projectId,
  }) {
    return _client.get(
      '/sprints/active',
      queryParameters: {'projectId': projectId},
    );
  }

  /// Get sprint by ID.
  Future<ApiResponse<Map<String, dynamic>>> getSprint(String sprintId) {
    return _client.get('/sprints/$sprintId');
  }

  /// Update sprint details.
  Future<ApiResponse<Map<String, dynamic>>> updateSprint(
    String sprintId, {
    String? name,
    String? goal,
    String? startDate,
    String? endDate,
  }) {
    return _client.patch(
      '/sprints/$sprintId',
      data: {
        if (name != null) 'name': name,
        if (goal != null) 'goal': goal,
        if (startDate != null) 'startDate': startDate,
        if (endDate != null) 'endDate': endDate,
      },
    );
  }

  // ── Lifecycle ─────────────────────────────────────────────────────

  /// Start a sprint (manager+ only).
  Future<ApiResponse<Map<String, dynamic>>> startSprint(String sprintId) {
    return _client.post('/sprints/$sprintId/start');
  }

  /// Complete a sprint (manager+ only).
  ///
  /// [moveIncompleteToSprintId] optionally moves unfinished tasks
  /// to another sprint.
  Future<ApiResponse<Map<String, dynamic>>> completeSprint(
    String sprintId, {
    String? moveIncompleteToSprintId,
  }) {
    return _client.post(
      '/sprints/$sprintId/complete',
      data: {
        if (moveIncompleteToSprintId != null)
          'moveIncompleteToSprintId': moveIncompleteToSprintId,
      },
    );
  }

  // ── Tasks ─────────────────────────────────────────────────────────

  /// List tasks in a sprint.
  Future<ApiResponse<List<dynamic>>> getSprintTasks(String sprintId) {
    return _client.get('/sprints/$sprintId/tasks');
  }

  /// Add a task to a sprint.
  Future<ApiResponse<Map<String, dynamic>>> addTask(
    String sprintId, {
    required String taskId,
  }) {
    return _client.post('/sprints/$sprintId/tasks', data: {'taskId': taskId});
  }

  /// Remove a task from a sprint.
  Future<ApiResponse<void>> removeTask(String sprintId, String taskId) {
    return _client.delete('/sprints/$sprintId/tasks/$taskId');
  }

  // ── Charts ────────────────────────────────────────────────────────

  /// Get burndown chart data for a sprint.
  Future<ApiResponse<List<dynamic>>> getBurndown(String sprintId) {
    return _client.get('/sprints/$sprintId/burndown');
  }

  /// Get velocity chart data across sprints.
  Future<ApiResponse<Map<String, dynamic>>> getVelocity({
    required String projectId,
    int limit = 10,
  }) {
    return _client.get(
      '/sprints/velocity',
      queryParameters: {'projectId': projectId, 'limit': limit.toString()},
    );
  }

  // ── Retrospective ─────────────────────────────────────────────────

  /// Save sprint retrospective.
  Future<ApiResponse<Map<String, dynamic>>> saveRetro(
    String sprintId, {
    String? wentWell,
    String? toImprove,
    List<String>? actionItems,
  }) {
    return _client.post(
      '/sprints/$sprintId/retro',
      data: {
        if (wentWell != null) 'wentWell': wentWell,
        if (toImprove != null) 'toImprove': toImprove,
        if (actionItems != null) 'actionItems': actionItems,
      },
    );
  }
}
