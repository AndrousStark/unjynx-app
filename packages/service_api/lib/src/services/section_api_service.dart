import '../api_client.dart';
import '../api_response.dart';

/// API service for project sections (task grouping within a project).
class SectionApiService {
  final ApiClient _client;

  const SectionApiService(this._client);

  /// List all sections for a project.
  Future<ApiResponse<List<dynamic>>> getSections(String projectId) {
    return _client.get('/projects/$projectId/sections');
  }

  /// Create a new section in a project.
  Future<ApiResponse<Map<String, dynamic>>> createSection(
    String projectId, {
    required String name,
  }) {
    return _client.post('/projects/$projectId/sections', data: {'name': name});
  }

  /// Update a section (name, sort order).
  Future<ApiResponse<Map<String, dynamic>>> updateSection(
    String projectId,
    String sectionId, {
    String? name,
    int? sortOrder,
  }) {
    return _client.patch(
      '/projects/$projectId/sections/$sectionId',
      data: {
        if (name != null) 'name': name,
        if (sortOrder != null) 'sortOrder': sortOrder,
      },
    );
  }

  /// Delete a section.
  Future<ApiResponse<void>> deleteSection(String projectId, String sectionId) {
    return _client.delete('/projects/$projectId/sections/$sectionId');
  }

  /// Reorder sections by providing the new ID order.
  Future<ApiResponse<Map<String, dynamic>>> reorderSections(
    String projectId, {
    required List<String> ids,
  }) {
    return _client.post(
      '/projects/$projectId/sections/reorder',
      data: {'ids': ids},
    );
  }
}
