import 'dart:async';
import 'dart:convert';

import 'package:dio/dio.dart';

import '../api_client.dart';
import '../api_exception.dart';
import '../api_response.dart';

/// Exception thrown when the AI service is not configured (503).
class AiUnavailableException implements Exception {
  final String message;
  const AiUnavailableException(
      [this.message = 'AI features are coming soon']);

  @override
  String toString() => message;
}

/// API service for AI endpoints (Claude + ML service).
class AiApiService {
  final ApiClient _client;

  const AiApiService(this._client);

  // ── Claude API ──────────────────────────────────────────────────────

  /// Stream chat response from Claude via SSE.
  ///
  /// Yields text chunks as they arrive from the server.
  /// Throws [AiUnavailableException] if backend returns 503.
  Stream<String> chatStream({
    required List<Map<String, dynamic>> messages,
    String? persona,
    String? model,
  }) async* {
    final body = <String, dynamic>{
      'messages': messages,
      if (persona != null) 'persona': persona,
      if (model != null) 'model': model,
    };

    ResponseBody responseBody;
    try {
      responseBody = await _client.postStream('/ai/chat', data: body);
    } on DioException catch (e) {
      final apiErr = e.error;
      if (apiErr is ApiException && apiErr.statusCode == 503) {
        throw const AiUnavailableException();
      }
      rethrow;
    }

    final stream = responseBody.stream;

    // Parse SSE events from the byte stream.
    // Hono's streamSSE outputs: "event: <type>\ndata: <content>\n\n"
    final lineBuffer = StringBuffer();
    String? currentEvent;

    await for (final chunk in stream) {
      final text = utf8.decode(chunk);
      lineBuffer.write(text);

      // Process complete lines
      final lines = lineBuffer.toString().split('\n');
      // Keep the last potentially incomplete line in the buffer
      lineBuffer
        ..clear()
        ..write(lines.last);

      for (var i = 0; i < lines.length - 1; i++) {
        final line = lines[i].trim();
        if (line.isEmpty) {
          // Reset event type on blank line (SSE event boundary)
          currentEvent = null;
          continue;
        }

        // Track event type: "event: text", "event: error", "event: done"
        if (line.startsWith('event:')) {
          currentEvent = line.substring(6).trim();
          continue;
        }

        if (line.startsWith('data:')) {
          final data = line.substring(5).trim();

          // Check for done signal
          if (data == '[DONE]' || currentEvent == 'done') return;

          // Check for error event
          if (currentEvent == 'error' || _looksLikeErrorJson(data)) {
            try {
              final json = jsonDecode(data) as Map<String, dynamic>;
              final message =
                  json['message'] as String? ?? 'AI error occurred';
              throw AiUnavailableException(message);
            } catch (e) {
              if (e is AiUnavailableException) rethrow;
              // Not valid JSON error - treat as text
              yield data;
            }
          } else {
            // Normal text or usage event
            if (currentEvent == 'usage') continue; // skip usage metadata
            yield data;
          }
        }
      }
    }
  }

  /// Heuristic: check if a data payload looks like a JSON error object.
  static bool _looksLikeErrorJson(String data) {
    return data.startsWith('{') && data.contains('"message"');
  }

  /// Decompose a task into subtasks using Claude.
  ///
  /// Throws [AiUnavailableException] if backend returns 503.
  Future<ApiResponse<Map<String, dynamic>>> decompose({
    required String taskTitle,
    String? description,
  }) {
    return _wrapAiCall(
      () => _client.post('/ai/decompose', data: {
        'taskTitle': taskTitle,
        if (description != null) 'description': description,
      }),
    );
  }

  /// Get AI schedule suggestions for a set of tasks.
  ///
  /// Throws [AiUnavailableException] if backend returns 503.
  Future<ApiResponse<Map<String, dynamic>>> scheduleSuggestion({
    required List<String> taskIds,
  }) {
    return _wrapAiCall(
      () => _client.post('/ai/schedule', data: {
        'taskIds': taskIds,
      }),
    );
  }

  // ── ML Service (existing endpoints) ─────────────────────────────────

  /// Get AI-ranked task suggestions.
  ///
  /// Throws [AiUnavailableException] if ML service returns 503.
  Future<ApiResponse<Map<String, dynamic>>> getSuggestions({
    int limit = 10,
    int? hour,
    int? day,
    int? energy,
  }) {
    return _wrapAiCall(
      () => _client.get('/ai/suggestions', queryParameters: {
        'limit': limit,
        if (hour != null) 'hour': hour,
        if (day != null) 'day': day,
        if (energy != null) 'energy': energy,
      }),
    );
  }

  /// Get 24-hour energy forecast.
  ///
  /// Throws [AiUnavailableException] if ML service returns 503.
  Future<ApiResponse<Map<String, dynamic>>> getEnergy() {
    return _wrapAiCall(() => _client.get('/ai/energy'));
  }

  /// Get habit patterns.
  ///
  /// Throws [AiUnavailableException] if ML service returns 503.
  Future<ApiResponse<Map<String, dynamic>>> getPatterns({
    int days = 90,
  }) {
    return _wrapAiCall(
      () => _client.get('/ai/patterns', queryParameters: {
        'days': days,
      }),
    );
  }

  /// Get optimal notification time.
  ///
  /// Throws [AiUnavailableException] if ML service returns 503.
  Future<ApiResponse<Map<String, dynamic>>> getOptimalTime() {
    return _wrapAiCall(() => _client.get('/ai/optimal-time'));
  }

  /// Wraps an API call, translating 503 responses into
  /// [AiUnavailableException] for graceful UI handling.
  Future<ApiResponse<T>> _wrapAiCall<T>(
    Future<ApiResponse<T>> Function() call,
  ) async {
    try {
      return await call();
    } on DioException catch (e) {
      final apiErr = e.error;
      if (apiErr is ApiException &&
          (apiErr.statusCode == 503 || apiErr.statusCode == 502)) {
        throw const AiUnavailableException();
      }
      rethrow;
    }
  }
}
