import '../api_client.dart';
import '../api_response.dart';

/// API service for custom field definitions, task values, and SLA policies.
class CustomFieldApiService {
  final ApiClient _client;

  const CustomFieldApiService(this._client);

  // ── Field Definitions ─────────────────────────────────────────────

  /// List all custom field definitions for the org.
  Future<ApiResponse<List<dynamic>>> getFields() {
    return _client.get('/custom-fields');
  }

  /// Get a single field definition.
  Future<ApiResponse<Map<String, dynamic>>> getField(String fieldId) {
    return _client.get('/custom-fields/$fieldId');
  }

  /// Create a custom field definition (admin+).
  Future<ApiResponse<Map<String, dynamic>>> createField({
    required String name,
    required String fieldKey,
    required String fieldType,
    String? description,
    bool? isRequired,
    dynamic defaultValue,
    Map<String, dynamic>? options,
    List<String>? applicableTaskTypes,
    List<String>? applicableProjectIds,
  }) {
    return _client.post(
      '/custom-fields',
      data: {
        'name': name,
        'fieldKey': fieldKey,
        'fieldType': fieldType,
        if (description != null) 'description': description,
        if (isRequired != null) 'isRequired': isRequired,
        if (defaultValue != null) 'defaultValue': defaultValue,
        if (options != null) 'options': options,
        if (applicableTaskTypes != null)
          'applicableTaskTypes': applicableTaskTypes,
        if (applicableProjectIds != null)
          'applicableProjectIds': applicableProjectIds,
      },
    );
  }

  /// Update a field definition (admin+).
  Future<ApiResponse<Map<String, dynamic>>> updateField(
    String fieldId, {
    String? name,
    String? description,
    bool? isRequired,
    Map<String, dynamic>? options,
    int? sortOrder,
  }) {
    return _client.patch(
      '/custom-fields/$fieldId',
      data: {
        if (name != null) 'name': name,
        if (description != null) 'description': description,
        if (isRequired != null) 'isRequired': isRequired,
        if (options != null) 'options': options,
        if (sortOrder != null) 'sortOrder': sortOrder,
      },
    );
  }

  /// Archive a field definition (admin+).
  Future<ApiResponse<void>> archiveField(String fieldId) {
    return _client.delete('/custom-fields/$fieldId');
  }

  // ── Task Field Values ─────────────────────────────────────────────

  /// Get all custom field values for a task.
  Future<ApiResponse<List<dynamic>>> getTaskValues(String taskId) {
    return _client.get('/custom-fields/tasks/$taskId/values');
  }

  /// Set a custom field value on a task.
  Future<ApiResponse<Map<String, dynamic>>> setTaskValue(
    String taskId, {
    required String fieldId,
    required dynamic value,
  }) {
    return _client.put(
      '/custom-fields/tasks/$taskId/values',
      data: {'fieldId': fieldId, 'value': value},
    );
  }

  /// Remove a custom field value from a task.
  Future<ApiResponse<void>> removeTaskValue(String taskId, String fieldId) {
    return _client.delete('/custom-fields/tasks/$taskId/values/$fieldId');
  }

  // ── SLA Policies ──────────────────────────────────────────────────

  /// List SLA policies, optionally filtered by project.
  Future<ApiResponse<List<dynamic>>> getSlaPolicies({String? projectId}) {
    return _client.get(
      '/custom-fields/sla',
      queryParameters: {if (projectId != null) 'projectId': projectId},
    );
  }

  /// Get a single SLA policy.
  Future<ApiResponse<Map<String, dynamic>>> getSlaPolicy(String policyId) {
    return _client.get('/custom-fields/sla/$policyId');
  }

  /// Create an SLA policy (admin+).
  Future<ApiResponse<Map<String, dynamic>>> createSlaPolicy({
    required String name,
    String? description,
    String? projectId,
    Map<String, dynamic>? conditions,
    int? responseTimeMinutes,
    int? resolutionTimeMinutes,
    Map<String, dynamic>? businessHours,
    String? timezone,
  }) {
    return _client.post(
      '/custom-fields/sla',
      data: {
        'name': name,
        if (description != null) 'description': description,
        if (projectId != null) 'projectId': projectId,
        if (conditions != null) 'conditions': conditions,
        if (responseTimeMinutes != null)
          'responseTimeMinutes': responseTimeMinutes,
        if (resolutionTimeMinutes != null)
          'resolutionTimeMinutes': resolutionTimeMinutes,
        if (businessHours != null) 'businessHours': businessHours,
        if (timezone != null) 'timezone': timezone,
      },
    );
  }

  /// Update an SLA policy (admin+).
  Future<ApiResponse<Map<String, dynamic>>> updateSlaPolicy(
    String policyId, {
    String? name,
    String? description,
    int? responseTimeMinutes,
    int? resolutionTimeMinutes,
    Map<String, dynamic>? businessHours,
    String? timezone,
    bool? isActive,
  }) {
    return _client.patch(
      '/custom-fields/sla/$policyId',
      data: {
        if (name != null) 'name': name,
        if (description != null) 'description': description,
        if (responseTimeMinutes != null)
          'responseTimeMinutes': responseTimeMinutes,
        if (resolutionTimeMinutes != null)
          'resolutionTimeMinutes': resolutionTimeMinutes,
        if (businessHours != null) 'businessHours': businessHours,
        if (timezone != null) 'timezone': timezone,
        if (isActive != null) 'isActive': isActive,
      },
    );
  }

  /// Delete an SLA policy (admin+).
  Future<ApiResponse<void>> deleteSlaPolicy(String policyId) {
    return _client.delete('/custom-fields/sla/$policyId');
  }
}
