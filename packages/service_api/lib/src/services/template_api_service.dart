import '../api_client.dart';
import '../api_response.dart';

/// API service for task templates (reusable task blueprints with subtasks).
class TemplateApiService {
  final ApiClient _client;

  const TemplateApiService(this._client);

  /// List all templates, optionally filtered by category.
  Future<ApiResponse<List<dynamic>>> getTemplates({String? category}) {
    return _client.get(
      '/templates',
      queryParameters: {if (category != null) 'category': category},
    );
  }

  /// Search/suggest templates by query string.
  ///
  /// [query] must be at least 2 characters.
  Future<ApiResponse<List<dynamic>>> suggestTemplates({required String query}) {
    return _client.get('/templates/suggest', queryParameters: {'q': query});
  }

  /// Get a single template by ID.
  Future<ApiResponse<Map<String, dynamic>>> getTemplate(String templateId) {
    return _client.get('/templates/$templateId');
  }

  /// Create a new template.
  ///
  /// [subtasks] is a list of maps with keys:
  /// - `title` (required, string)
  /// - `estimatedMinutes` (required, 1-480)
  /// - `isOptional` (optional, bool)
  Future<ApiResponse<Map<String, dynamic>>> createTemplate({
    required String title,
    String? description,
    String? priority,
    String? category,
    List<Map<String, dynamic>>? subtasks,
  }) {
    return _client.post(
      '/templates',
      data: {
        'title': title,
        if (description != null) 'description': description,
        if (priority != null) 'priority': priority,
        if (category != null) 'category': category,
        if (subtasks != null) 'subtasks': subtasks,
      },
    );
  }

  /// Delete a template.
  Future<ApiResponse<void>> deleteTemplate(String templateId) {
    return _client.delete('/templates/$templateId');
  }

  /// Use a template — creates a new task from the template blueprint.
  ///
  /// Returns the created task.
  Future<ApiResponse<Map<String, dynamic>>> useTemplate(String templateId) {
    return _client.post('/templates/$templateId/use');
  }

  /// Save an AI task decomposition as a reusable template.
  Future<ApiResponse<Map<String, dynamic>>> saveFromDecomposition({
    required String title,
    required List<Map<String, dynamic>> subtasks,
    String? category,
  }) {
    return _client.post(
      '/templates/from-decomposition',
      data: {
        'title': title,
        'subtasks': subtasks,
        if (category != null) 'category': category,
      },
    );
  }
}
