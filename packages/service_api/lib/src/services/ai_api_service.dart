import 'dart:async';
import 'dart:convert';

import '../api_client.dart';
import '../api_response.dart';

/// API service for AI endpoints (Claude + ML service).
class AiApiService {
  final ApiClient _client;

  const AiApiService(this._client);

  // ── Claude API ──────────────────────────────────────────────────────

  /// Stream chat response from Claude via SSE.
  ///
  /// Yields text chunks as they arrive from the server.
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

    final responseBody = await _client.postStream('/ai/chat', data: body);
    final stream = responseBody.stream;

    // Parse SSE events from the byte stream
    final lineBuffer = StringBuffer();

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
        if (line.isEmpty) continue;

        // SSE format: "event: <type>\ndata: <content>"
        if (line.startsWith('data:')) {
          final data = line.substring(5).trim();

          // Check for done signal
          if (data == '[DONE]') return;

          // Check for error
          if (data.startsWith('{')) {
            try {
              final json = jsonDecode(data) as Map<String, dynamic>;
              if (json.containsKey('message')) {
                // Error event
                throw Exception(json['message'] as String);
              }
            } catch (e) {
              if (e is Exception &&
                  e.toString().contains('message')) {
                rethrow;
              }
              // Not JSON, treat as text chunk
              yield data;
            }
          } else {
            yield data;
          }
        }
      }
    }
  }

  /// Decompose a task into subtasks using Claude.
  Future<ApiResponse<Map<String, dynamic>>> decompose({
    required String taskTitle,
    String? description,
  }) {
    return _client.post('/ai/decompose', data: {
      'taskTitle': taskTitle,
      if (description != null) 'description': description,
    });
  }

  /// Get AI schedule suggestions for a set of tasks.
  Future<ApiResponse<Map<String, dynamic>>> scheduleSuggestion({
    required List<String> taskIds,
  }) {
    return _client.post('/ai/schedule', data: {
      'taskIds': taskIds,
    });
  }

  // ── ML Service (existing endpoints) ─────────────────────────────────

  /// Get AI-ranked task suggestions.
  Future<ApiResponse<Map<String, dynamic>>> getSuggestions({
    int limit = 10,
    int? hour,
    int? day,
    int? energy,
  }) {
    return _client.get('/ai/suggestions', queryParameters: {
      'limit': limit,
      if (hour != null) 'hour': hour,
      if (day != null) 'day': day,
      if (energy != null) 'energy': energy,
    });
  }

  /// Get 24-hour energy forecast.
  Future<ApiResponse<Map<String, dynamic>>> getEnergy() {
    return _client.get('/ai/energy');
  }

  /// Get habit patterns.
  Future<ApiResponse<Map<String, dynamic>>> getPatterns({
    int days = 90,
  }) {
    return _client.get('/ai/patterns', queryParameters: {
      'days': days,
    });
  }

  /// Get optimal notification time.
  Future<ApiResponse<Map<String, dynamic>>> getOptimalTime() {
    return _client.get('/ai/optimal-time');
  }
}
