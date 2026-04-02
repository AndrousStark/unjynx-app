import '../api_client.dart';
import '../api_response.dart';

/// API service for recurring task rules (RFC 5545 RRULE).
class RecurringApiService {
  final ApiClient _client;

  const RecurringApiService(this._client);

  /// Get the recurrence rule for a task.
  ///
  /// Returns null data if no recurrence is set.
  Future<ApiResponse<Map<String, dynamic>>> getRecurrence(String taskId) {
    return _client.get('/tasks/$taskId/recurrence');
  }

  /// Set or update the recurrence rule for a task.
  ///
  /// [rrule] must be a valid RRULE string (e.g. "FREQ=WEEKLY;BYDAY=MO,WE,FR").
  Future<ApiResponse<Map<String, dynamic>>> setRecurrence(
    String taskId, {
    required String rrule,
  }) {
    return _client.put('/tasks/$taskId/recurrence', data: {'rrule': rrule});
  }

  /// Remove the recurrence rule from a task (make it one-time).
  Future<ApiResponse<void>> deleteRecurrence(String taskId) {
    return _client.delete('/tasks/$taskId/recurrence');
  }

  /// Get the next N occurrences of a recurring task.
  ///
  /// [count] defaults to 5, max 100.
  Future<ApiResponse<List<dynamic>>> getOccurrences(
    String taskId, {
    int count = 5,
  }) {
    return _client.get(
      '/tasks/$taskId/occurrences',
      queryParameters: {'count': count.toString()},
    );
  }
}
