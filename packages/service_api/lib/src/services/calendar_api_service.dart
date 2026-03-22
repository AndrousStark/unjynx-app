import '../api_client.dart';
import '../api_response.dart';

/// API service for Google Calendar integration.
///
/// Handles connecting/disconnecting Google Calendar, querying connection
/// status, fetching calendar events, and two-way sync (write-back).
class CalendarApiService {
  final ApiClient _client;

  const CalendarApiService(this._client);

  // ── Connection Management ──────────────────────────────────────────

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
  /// Returns `{ "connected": bool, "provider": string?, "calendarId": string? }`.
  Future<ApiResponse<Map<String, dynamic>>> getCalendarStatus() {
    return _client.get('/calendar/status');
  }

  // ── Read (Ghost Events) ────────────────────────────────────────────

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

  // ── Write-Back (Two-Way Sync) ──────────────────────────────────────

  /// Create a Google Calendar event linked to a task.
  ///
  /// The backend creates the event on Google Calendar and stores
  /// the mapping (taskId -> externalEventId). Returns the mapping.
  Future<ApiResponse<Map<String, dynamic>>> createEvent({
    required String taskId,
    required String title,
    required DateTime dueDate,
    String? description,
  }) {
    return _client.post(
      '/calendar/events',
      data: {
        'taskId': taskId,
        'title': title,
        'dueDate': dueDate.toUtc().toIso8601String(),
        if (description != null) 'description': description,
      },
    );
  }

  /// Update a Google Calendar event linked to a task.
  ///
  /// Only fields provided will be updated on the Google event.
  /// Returns the updated mapping.
  Future<ApiResponse<Map<String, dynamic>>> updateEvent({
    required String taskId,
    String? title,
    DateTime? dueDate,
    String? description,
  }) {
    return _client.patch(
      '/calendar/events/$taskId',
      data: {
        if (title != null) 'title': title,
        if (dueDate != null) 'dueDate': dueDate.toUtc().toIso8601String(),
        if (description != null) 'description': description,
      },
    );
  }

  /// Delete a Google Calendar event linked to a task.
  ///
  /// Removes the event from Google Calendar and deletes the mapping.
  Future<ApiResponse<Map<String, dynamic>>> deleteEvent({
    required String taskId,
  }) {
    return _client.delete('/calendar/events/$taskId');
  }
}
