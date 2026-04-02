import '../api_client.dart';
import '../api_response.dart';

/// API service for AI team intelligence (standups, risks, suggestions).
class AiTeamApiService {
  final ApiClient _client;

  const AiTeamApiService(this._client);

  /// Generate a daily standup summary from team activity.
  Future<ApiResponse<Map<String, dynamic>>> getStandup() {
    return _client.get('/ai-team/standup');
  }

  /// Detect project risks (overdue clusters, bottlenecks, etc.).
  Future<ApiResponse<Map<String, dynamic>>> detectRisks() {
    return _client.get('/ai-team/risks');
  }

  /// Suggest the best assignee for a task based on workload and skills.
  Future<ApiResponse<Map<String, dynamic>>> suggestAssignee({
    required String taskTitle,
    String taskPriority = 'medium',
  }) {
    return _client.post(
      '/ai-team/suggest-assignee',
      data: {'taskTitle': taskTitle, 'taskPriority': taskPriority},
    );
  }

  /// Get a project health score (0-100) with breakdown.
  Future<ApiResponse<Map<String, dynamic>>> getProjectHealth(String projectId) {
    return _client.get('/ai-team/health/$projectId');
  }

  /// List pending AI suggestions for an entity.
  Future<ApiResponse<List<dynamic>>> getSuggestions({
    String? entityType,
    String? entityId,
  }) {
    return _client.get(
      '/ai-team/suggestions',
      queryParameters: {
        if (entityType != null) 'entityType': entityType,
        if (entityId != null) 'entityId': entityId,
      },
    );
  }

  /// Accept an AI suggestion.
  Future<ApiResponse<Map<String, dynamic>>> acceptSuggestion(
    String suggestionId,
  ) {
    return _client.post('/ai-team/suggestions/$suggestionId/accept');
  }

  /// Dismiss an AI suggestion.
  Future<ApiResponse<Map<String, dynamic>>> dismissSuggestion(
    String suggestionId,
  ) {
    return _client.post('/ai-team/suggestions/$suggestionId/dismiss');
  }

  /// Get AI operation history (admin+).
  Future<ApiResponse<List<dynamic>>> getOperations({
    String? operationType,
    int limit = 20,
  }) {
    return _client.get(
      '/ai-team/operations',
      queryParameters: {
        if (operationType != null) 'operationType': operationType,
        'limit': limit.toString(),
      },
    );
  }

  /// Get AI cost summary for the last 30 days (admin+).
  Future<ApiResponse<Map<String, dynamic>>> getCostSummary() {
    return _client.get('/ai-team/cost');
  }
}
