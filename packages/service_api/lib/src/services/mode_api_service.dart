import '../api_client.dart';
import '../api_response.dart';

/// API service for industry mode operations.
class ModeApiService {
  final ApiClient _client;

  const ModeApiService(this._client);

  /// List all active industry modes.
  Future<ApiResponse<List<dynamic>>> getModes() {
    return _client.get('/modes');
  }

  /// Get the authenticated user's active mode with vocabulary map.
  Future<ApiResponse<Map<String, dynamic>>> getActiveMode() {
    return _client.get('/modes/active');
  }

  /// Set the authenticated user's active mode by slug.
  Future<ApiResponse<Map<String, dynamic>>> setActiveMode(String slug) {
    return _client.put('/modes/active', data: {'slug': slug});
  }

  /// Get full mode detail (vocabulary + templates + widgets) by slug.
  Future<ApiResponse<Map<String, dynamic>>> getModeDetail(String slug) {
    return _client.get('/modes/$slug');
  }

  /// Get templates for a specific mode by slug.
  Future<ApiResponse<List<dynamic>>> getModeTemplates(String slug) {
    return _client.get('/modes/$slug/templates');
  }
}
