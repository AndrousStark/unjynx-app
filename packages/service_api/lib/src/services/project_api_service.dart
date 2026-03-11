import '../api_client.dart';
import '../api_response.dart';

/// API service for project operations.
class ProjectApiService {
  final ApiClient _client;

  const ProjectApiService(this._client);

  /// List all projects for the current user.
  Future<ApiResponse<List<dynamic>>> getProjects() {
    return _client.get('/projects');
  }

  /// Create a new project.
  Future<ApiResponse<Map<String, dynamic>>> createProject(
    Map<String, dynamic> data,
  ) {
    return _client.post('/projects', data: data);
  }

  /// Get a single project by ID.
  Future<ApiResponse<Map<String, dynamic>>> getProject(String id) {
    return _client.get('/projects/$id');
  }

  /// Update a project.
  Future<ApiResponse<Map<String, dynamic>>> updateProject(
    String id,
    Map<String, dynamic> data,
  ) {
    return _client.patch('/projects/$id', data: data);
  }

  /// Delete a project.
  Future<ApiResponse<Map<String, dynamic>>> deleteProject(String id) {
    return _client.delete('/projects/$id');
  }
}
