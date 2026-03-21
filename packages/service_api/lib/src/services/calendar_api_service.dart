import '../api_client.dart';
import '../api_response.dart';

/// API service for Google Calendar integration.
///
/// Handles connecting/disconnecting Google Calendar, querying connection
/// status, and fetching calendar events for ghost-event display.
class CalendarApiService {
  final ApiClient _client;

  const CalendarApiService(this._client);

  /// Connect a Google Calendar account using the OAuth server auth code.
  ///
  /// The backend exchanges the auth code for tokens and stores them
  /// server-side. Returns connection metadata (email, calendar ID).
  Future<ApiResponse<Map<String, dynamic>>> connectCalendar(
    String authCode,
  ) {
    return _client.post(
      '/calendar/connect',
      data: {'authCode': authCode},
    );
  }

  /// Disconnect the user's Google Calendar integration.
  ///
  /// Revokes stored tokens on the backend.
  Future<ApiResponse<Map<String, dynamic>>> disconnectCalendar() {
    return _client.delete('/calendar/disconnect');
  }

  /// Get current calendar connection status.
  ///
  /// Returns `{ "connected": bool, "email": string?, "lastSyncedAt": string? }`.
  Future<ApiResponse<Map<String, dynamic>>> getCalendarStatus() {
    return _client.get('/calendar/status');
  }

  /// Fetch calendar events within a date range.
  ///
  /// Returns a list of event objects with id, title, start, end, allDay,
  /// and source fields. Used to render ghost events on the calendar grid.
  Future<ApiResponse<List<dynamic>>> getCalendarEvents({
    required DateTime start,
    required DateTime end,
  }) {
    return _client.get('/calendar/events', queryParameters: {
      'start': start.toUtc().toIso8601String(),
      'end': end.toUtc().toIso8601String(),
    });
  }
}
