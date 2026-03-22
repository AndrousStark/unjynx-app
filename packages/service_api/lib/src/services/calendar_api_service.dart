import '../api_client.dart';
import '../api_response.dart';

/// API service for calendar integration (Google, Apple CalDAV, Outlook).
///
/// Handles connecting/disconnecting calendar providers, querying connection
/// status, fetching calendar events from all providers, and two-way sync
/// (write-back).
class CalendarApiService {
  final ApiClient _client;

  const CalendarApiService(this._client);

  // ── Google Calendar Connection ──────────────────────────────────────

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

  // ── Apple Calendar (CalDAV) Connection ──────────────────────────────

  /// Connect an Apple Calendar account via CalDAV credentials.
  ///
  /// Uses the Apple ID email and an app-specific password (generated at
  /// https://appleid.apple.com/account/manage). The [caldavUrl] defaults
  /// to `https://caldav.icloud.com` on the backend if not provided.
  Future<ApiResponse<Map<String, dynamic>>> connectApple({
    required String username,
    required String password,
    String caldavUrl = 'https://caldav.icloud.com',
  }) {
    return _client.post(
      '/calendar/connect/apple',
      data: {
        'caldavUrl': caldavUrl,
        'username': username,
        'password': password,
      },
    );
  }

  // ── Outlook Calendar Connection ─────────────────────────────────────

  /// Connect an Outlook Calendar account using a Microsoft OAuth auth code.
  ///
  /// The backend exchanges the auth code for tokens via Microsoft identity
  /// platform and stores them server-side.
  Future<ApiResponse<Map<String, dynamic>>> connectOutlook(
    String authCode,
  ) {
    return _client.post(
      '/calendar/connect/outlook',
      data: {'authCode': authCode},
    );
  }

  // ── Provider Management ─────────────────────────────────────────────

  /// List all connected calendar providers for the current user.
  ///
  /// Returns a list of `{ "provider": string, "connected": bool,
  /// "calendarId": string?, "connectedAt": string? }` objects.
  Future<ApiResponse<List<dynamic>>> getProviders() {
    return _client.get('/calendar/providers');
  }

  /// Disconnect a specific calendar provider.
  ///
  /// If [provider] is null, disconnects ALL providers.
  /// The provider query parameter is appended to the URL path.
  Future<ApiResponse<Map<String, dynamic>>> disconnectCalendar({
    String? provider,
  }) {
    final path = provider != null
        ? '/calendar/disconnect?provider=$provider'
        : '/calendar/disconnect';
    return _client.delete(path);
  }

  /// Get current calendar connection status (legacy, single-provider).
  ///
  /// Returns `{ "connected": bool, "provider": string?, "calendarId": string? }`.
  Future<ApiResponse<Map<String, dynamic>>> getCalendarStatus() {
    return _client.get('/calendar/status');
  }

  // ── Read (Ghost Events -- All Providers) ────────────────────────────

  /// Fetch calendar events from ALL connected providers within a date range.
  ///
  /// Returns a merged, sorted list of event objects with id, title, start,
  /// end, allDay, and source fields. Used to render ghost events on the
  /// calendar grid.
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

  /// Create a calendar event linked to a task.
  ///
  /// The backend creates the event on the primary connected calendar and
  /// stores the mapping (taskId -> externalEventId). Returns the mapping.
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

  /// Update a calendar event linked to a task.
  ///
  /// Only fields provided will be updated on the external event.
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

  /// Delete a calendar event linked to a task.
  ///
  /// Removes the event from the external calendar and deletes the mapping.
  Future<ApiResponse<Map<String, dynamic>>> deleteEvent({
    required String taskId,
  }) {
    return _client.delete('/calendar/events/$taskId');
  }
}
