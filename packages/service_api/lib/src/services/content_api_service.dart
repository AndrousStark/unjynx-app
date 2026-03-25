import '../api_client.dart';
import '../api_response.dart';

/// API service for daily content delivery (quotes, rituals, categories).
class ContentApiService {
  final ApiClient _client;

  const ContentApiService(this._client);

  /// Get today's content (quote, tip, etc.).
  ///
  /// Optional [category] filters to a specific category.
  Future<ApiResponse<Map<String, dynamic>>> getTodayContent({
    String? category,
  }) {
    return _client.get('/content/today', queryParameters: {
      if (category != null) 'category': category,
    });
  }

  /// List all content categories.
  Future<ApiResponse<List<dynamic>>> getCategories() {
    return _client.get('/content/categories');
  }

  /// Save/bookmark a content item.
  Future<ApiResponse<Map<String, dynamic>>> saveContent(String contentId) {
    return _client.post('/content/save', data: {'contentId': contentId});
  }

  /// Unsave/unbookmark a content item.
  Future<ApiResponse<Map<String, dynamic>>> unsaveContent(String contentId) {
    return _client.post('/content/save', data: {
      'contentId': contentId,
      'unsave': true,
    });
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
  Future<ApiResponse<List<dynamic>>> getRitualHistory({
    int page = 1,
    int limit = 10,
  }) {
    return _client.get('/content/rituals/history', queryParameters: {
      'page': page,
      'limit': limit,
    });
  }
}
