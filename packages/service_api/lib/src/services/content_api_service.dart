import '../api_client.dart';
import '../api_response.dart';

/// API service for daily content delivery (quotes, rituals, categories).
class ContentApiService {
  final ApiClient _client;

  const ContentApiService(this._client);

  /// Get today's content (quote, tip, etc.).
  Future<ApiResponse<Map<String, dynamic>>> getTodayContent() {
    return _client.get('/content/today');
  }

  /// List all content categories.
  Future<ApiResponse<List<dynamic>>> getCategories() {
    return _client.get('/content/categories');
  }

  /// Save/bookmark a content item.
  Future<ApiResponse<Map<String, dynamic>>> saveContent(String contentId) {
    return _client.post('/content/save', data: {'contentId': contentId});
  }

  /// Get user's content preferences.
  Future<ApiResponse<Map<String, dynamic>>> getPreferences() {
    return _client.get('/content/preferences');
  }

  /// Update user's content preferences.
  Future<ApiResponse<Map<String, dynamic>>> updatePreferences(
    Map<String, dynamic> data,
  ) {
    return _client.put('/content/preferences', data: data);
  }

  /// Log a completed ritual.
  Future<ApiResponse<Map<String, dynamic>>> logRitual(
    Map<String, dynamic> data,
  ) {
    return _client.post('/content/rituals', data: data);
  }

  /// Get ritual completion history.
  Future<ApiResponse<List<dynamic>>> getRitualHistory() {
    return _client.get('/content/rituals/history');
  }
}
