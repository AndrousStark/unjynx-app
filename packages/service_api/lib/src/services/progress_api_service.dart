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

  /// Get daily completion trend (default 30 days).
  Future<ApiResponse<Map<String, dynamic>>> getCompletionTrend({
    int days = 30,
  }) {
    return _client.get('/progress/completion-trend', queryParameters: {
      'days': days.toString(),
    });
  }

  /// Get task completion counts grouped by day of week.
  Future<ApiResponse<Map<String, dynamic>>> getProductivityByDay() {
    return _client.get('/progress/productivity-by-day');
  }

  /// Get task completion heatmap by hour and day of week.
  Future<ApiResponse<Map<String, dynamic>>> getProductivityByHour() {
    return _client.get('/progress/productivity-by-hour');
  }

  // ── AI / ML endpoints ──────────────────────────────────────────────────

  /// Get detected productivity patterns (Prophet time-series analysis).
  ///
  /// Returns patterns with confidence scores and 7-day forecast.
  Future<ApiResponse<Map<String, dynamic>>> getPatterns({int days = 90}) {
    return _client.get('/ai/patterns', queryParameters: {
      'days': days.toString(),
    });
  }

  /// Get 24-hour energy forecast (Gaussian Process regression).
  ///
  /// Returns hourly energy predictions with peak/low hours.
  Future<ApiResponse<Map<String, dynamic>>> getEnergyForecast() {
    return _client.get('/ai/energy');
  }

  /// Get AI-ranked task suggestions (LinUCB contextual bandit).
  ///
  /// Returns top tasks sorted by ML confidence score.
  Future<ApiResponse<Map<String, dynamic>>> getSuggestions({int limit = 5}) {
    return _client.get('/ai/suggestions', queryParameters: {
      'limit': limit.toString(),
    });
  }
}
