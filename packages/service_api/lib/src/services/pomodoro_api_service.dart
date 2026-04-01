import '../api_client.dart';
import '../api_response.dart';

/// API service for Pomodoro focus timer sessions.
class PomodoroApiService {
  final ApiClient _client;

  const PomodoroApiService(this._client);

  /// Start a new Pomodoro session.
  ///
  /// [taskId] optionally links this session to a specific task.
  /// [durationMinutes] defaults to 25. Range: 5-120.
  Future<ApiResponse<Map<String, dynamic>>> startSession({
    String? taskId,
    int durationMinutes = 25,
  }) {
    return _client.post(
      '/pomodoro/start',
      data: {
        if (taskId != null) 'taskId': taskId,
        'durationMinutes': durationMinutes,
      },
    );
  }

  /// Complete the active Pomodoro session.
  ///
  /// [focusRating] is an optional 1-5 self-assessment.
  Future<ApiResponse<Map<String, dynamic>>> completeSession({
    int? focusRating,
  }) {
    return _client.post(
      '/pomodoro/complete',
      data: {if (focusRating != null) 'focusRating': focusRating},
    );
  }

  /// Abandon the active Pomodoro session.
  Future<ApiResponse<void>> abandonSession() {
    return _client.post('/pomodoro/abandon');
  }

  /// Get the current active session (if any).
  ///
  /// Returns session details including elapsed time.
  Future<ApiResponse<Map<String, dynamic>>> getActiveSession() {
    return _client.get('/pomodoro/active');
  }

  /// Get Pomodoro stats: today, week, lifetime, streak, peak hour.
  Future<ApiResponse<Map<String, dynamic>>> getStats() {
    return _client.get('/pomodoro/stats');
  }

  /// Get an AI task suggestion for the next Pomodoro session.
  Future<ApiResponse<Map<String, dynamic>>> suggestNextTask() {
    return _client.get('/pomodoro/suggest');
  }

  /// Get recent session history.
  ///
  /// [limit] defaults to 10.
  Future<ApiResponse<List<dynamic>>> getHistory({int limit = 10}) {
    return _client.get(
      '/pomodoro/history',
      queryParameters: {'limit': limit.toString()},
    );
  }
}
