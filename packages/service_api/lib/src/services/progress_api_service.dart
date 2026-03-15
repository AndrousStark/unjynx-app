import '../api_client.dart';
import '../api_response.dart';

/// API service for progress tracking (rings, streaks, heatmap, insights).
class ProgressApiService {
  final ApiClient _client;

  const ProgressApiService(this._client);

  /// Get current progress ring data.
  Future<ApiResponse<Map<String, dynamic>>> getRings() {
    return _client.get('/progress/rings');
  }

  /// Get current streak data.
  Future<ApiResponse<Map<String, dynamic>>> getStreak() {
    return _client.get('/progress/streak');
  }

  /// Get activity heatmap for a date range.
  Future<ApiResponse<Map<String, dynamic>>> getHeatmap({
    String? from,
    String? to,
  }) {
    return _client.get('/progress/heatmap', queryParameters: {
      if (from != null) 'from': from,
      if (to != null) 'to': to,
    });
  }

  /// Get AI-generated productivity insights.
  Future<ApiResponse<Map<String, dynamic>>> getInsights() {
    return _client.get('/progress/insights');
  }

  /// Get personal best records.
  Future<ApiResponse<Map<String, dynamic>>> getBests() {
    return _client.get('/progress/bests');
  }

  /// Save a progress snapshot (end-of-day).
  Future<ApiResponse<Map<String, dynamic>>> saveSnapshot() {
    return _client.post('/progress/snapshot');
  }
}
