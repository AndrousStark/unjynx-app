import '../api_client.dart';
import '../api_response.dart';

/// API service for custom workflow management (statuses + transitions).
class WorkflowApiService {
  final ApiClient _client;

  const WorkflowApiService(this._client);

  /// List all workflows for the org.
  Future<ApiResponse<List<dynamic>>> getWorkflows() {
    return _client.get('/workflows');
  }

  /// Get a workflow with its statuses and transitions.
  Future<ApiResponse<Map<String, dynamic>>> getWorkflow(String workflowId) {
    return _client.get('/workflows/$workflowId');
  }

  /// Get only the statuses for a workflow.
  Future<ApiResponse<List<dynamic>>> getStatuses(String workflowId) {
    return _client.get('/workflows/$workflowId/statuses');
  }

  /// Get available transitions from a specific status.
  Future<ApiResponse<List<dynamic>>> getTransitions(
    String workflowId,
    String fromStatusId,
  ) {
    return _client.get('/workflows/$workflowId/transitions/$fromStatusId');
  }

  /// Create a custom workflow (admin+).
  Future<ApiResponse<Map<String, dynamic>>> createWorkflow({
    required String name,
    String? description,
    bool? isDefault,
  }) {
    return _client.post(
      '/workflows',
      data: {
        'name': name,
        if (description != null) 'description': description,
        if (isDefault != null) 'isDefault': isDefault,
      },
    );
  }

  /// Add a status to a workflow (admin+).
  Future<ApiResponse<Map<String, dynamic>>> addStatus(
    String workflowId, {
    required String name,
    required String category,
    String? color,
    int? sortOrder,
    bool? isInitial,
    bool? isFinal,
  }) {
    return _client.post(
      '/workflows/$workflowId/statuses',
      data: {
        'name': name,
        'category': category,
        if (color != null) 'color': color,
        if (sortOrder != null) 'sortOrder': sortOrder,
        if (isInitial != null) 'isInitial': isInitial,
        if (isFinal != null) 'isFinal': isFinal,
      },
    );
  }

  /// Add a transition between statuses (admin+).
  Future<ApiResponse<Map<String, dynamic>>> addTransition(
    String workflowId, {
    required String fromStatusId,
    required String toStatusId,
    String? name,
  }) {
    return _client.post(
      '/workflows/$workflowId/transitions',
      data: {
        'fromStatusId': fromStatusId,
        'toStatusId': toStatusId,
        if (name != null) 'name': name,
      },
    );
  }
}
