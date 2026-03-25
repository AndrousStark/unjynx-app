import 'dart:async';

import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:service_api/service_api.dart';

import '../../domain/models/ai_insight.dart';
import '../../domain/models/chat_message.dart';
import '../../domain/models/schedule_suggestion.dart';

// ── AI API Service Provider ─────────────────────────────────────────

final aiApiProvider = Provider<AiApiService>(
  (ref) => AiApiService(ref.watch(apiClientProvider)),
);

// ── Persona Provider ────────────────────────────────────────────────

final selectedPersonaProvider =
    NotifierProvider<_PersonaNotifier, AiPersona>(_PersonaNotifier.new);

class _PersonaNotifier extends Notifier<AiPersona> {
  @override
  AiPersona build() => AiPersona.defaultPersona;

  void select(AiPersona persona) => state = persona;
}

// ── AI Availability ─────────────────────────────────────────────────

/// Whether the AI service is known to be unavailable (503).
/// Set to true when the backend tells us AI is not configured.
final aiUnavailableProvider =
    NotifierProvider<_AiUnavailableNotifier, bool>(
  _AiUnavailableNotifier.new,
);

class _AiUnavailableNotifier extends Notifier<bool> {
  @override
  bool build() => false;

  void markUnavailable() => state = true;
  void reset() => state = false;
}

// ── Chat Providers ──────────────────────────────────────────────────

/// Whether the AI is currently responding.
final isAiRespondingProvider =
    NotifierProvider<_IsRespondingNotifier, bool>(_IsRespondingNotifier.new);

class _IsRespondingNotifier extends Notifier<bool> {
  @override
  bool build() => false;

  void set(bool value) => state = value;
}

/// The list of messages in the current chat session.
final chatMessagesProvider =
    NotifierProvider<ChatMessagesNotifier, List<ChatMessage>>(
  ChatMessagesNotifier.new,
);

/// Chat messages notifier with streaming support.
class ChatMessagesNotifier extends Notifier<List<ChatMessage>> {
  @override
  List<ChatMessage> build() => [];

  /// Add a user message and trigger AI response.
  Future<void> sendMessage(String content) async {
    // Check if AI is already known to be unavailable
    if (ref.read(aiUnavailableProvider)) {
      _addSystemMessage(
        'AI features are coming soon. '
        'This feature will be available once the AI service is configured.',
      );
      return;
    }

    // Add user message
    final userMessage = ChatMessage(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      role: 'user',
      content: content,
      timestamp: DateTime.now(),
    );

    state = [...state, userMessage];

    // Create placeholder for AI response
    final aiMessageId =
        (DateTime.now().millisecondsSinceEpoch + 1).toString();
    final aiPlaceholder = ChatMessage(
      id: aiMessageId,
      role: 'assistant',
      content: '',
      timestamp: DateTime.now(),
      isStreaming: true,
    );

    state = [...state, aiPlaceholder];
    ref.read(isAiRespondingProvider.notifier).set(true);

    try {
      final persona = ref.read(selectedPersonaProvider);
      final apiMessages = state
          .where((m) => !m.isStreaming)
          .map((m) => {'role': m.role, 'content': m.content})
          .toList();

      final aiApi = ref.read(aiApiProvider);
      final stream = aiApi.chatStream(
        messages: apiMessages,
        persona: persona.apiValue,
      );

      final buffer = StringBuffer();

      await for (final chunk in stream) {
        buffer.write(chunk);
        // Update the streaming message with accumulated text
        state = [
          ...state.where((m) => m.id != aiMessageId),
          aiPlaceholder.copyWith(
            content: buffer.toString(),
          ),
        ];
      }

      // Finalize the message
      state = [
        ...state.where((m) => m.id != aiMessageId),
        aiPlaceholder.copyWith(
          content: buffer.toString(),
          isStreaming: false,
        ),
      ];
    } on AiUnavailableException {
      ref.read(aiUnavailableProvider.notifier).markUnavailable();
      state = [
        ...state.where((m) => m.id != aiMessageId),
        aiPlaceholder.copyWith(
          content:
              'AI features are coming soon. The AI service is not yet '
              'configured on the server. Please check back later!',
          isStreaming: false,
        ),
      ];
    } on DioException catch (e) {
      final apiErr = e.error;
      final message = apiErr is ApiException
          ? apiErr.message
          : 'Could not reach the server. Please check your connection.';
      state = [
        ...state.where((m) => m.id != aiMessageId),
        aiPlaceholder.copyWith(
          content: message,
          isStreaming: false,
        ),
      ];
    } catch (e) {
      // On error, update the placeholder with error text
      state = [
        ...state.where((m) => m.id != aiMessageId),
        aiPlaceholder.copyWith(
          content: 'Something went wrong. Please try again.',
          isStreaming: false,
        ),
      ];
    } finally {
      ref.read(isAiRespondingProvider.notifier).set(false);
    }
  }

  /// Add a system-level message (not from the user or AI).
  void _addSystemMessage(String text) {
    final msg = ChatMessage(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      role: 'assistant',
      content: text,
      timestamp: DateTime.now(),
    );
    state = [...state, msg];
  }

  /// Clear the chat history.
  void clearChat() {
    state = [];
  }
}

// ── Schedule Providers ──────────────────────────────────────────────

/// Async provider that fetches schedule suggestions.
final scheduleResultProvider =
    FutureProvider.autoDispose<ScheduleResult>((ref) async {
  final aiApi = ref.watch(aiApiProvider);

  try {
    final response = await aiApi.scheduleSuggestion(taskIds: []);

    if (!response.success || response.data == null) {
      throw Exception(
        response.error ?? 'Failed to get schedule suggestions',
      );
    }

    final data = response.data! as Map<String, dynamic>;
    final scheduleList = data['schedule'] as List<dynamic>? ?? [];

    final slots = scheduleList.map((item) {
      final map = item as Map<String, dynamic>;
      final taskId = map['taskId'] as String? ?? '';
      return ScheduleSlot(
        taskId: taskId,
        taskTitle: map['title'] as String? ??
            'Task ${taskId.length >= 8 ? taskId.substring(0, 8) : taskId}',
        suggestedStart: map['suggestedStart'] as String? ?? '',
        suggestedEnd: map['suggestedEnd'] as String? ?? '',
        reason: map['reason'] as String? ?? '',
      );
    }).toList();

    return ScheduleResult(
      slots: slots,
      insights: data['insights'] as String? ?? '',
    );
  } on AiUnavailableException {
    ref.read(aiUnavailableProvider.notifier).markUnavailable();
    throw const AiUnavailableException(
      'AI scheduling is coming soon. The AI service is not yet configured.',
    );
  } on DioException catch (e) {
    final apiErr = e.error;
    if (apiErr is ApiException) {
      throw Exception(apiErr.message);
    }
    throw Exception(
      'Could not reach the server. Please check your connection.',
    );
  }
});

/// Mutable state for accepted/rejected schedule slots.
final scheduleActionsProvider =
    NotifierProvider<ScheduleActionsNotifier, Map<String, bool>>(
  ScheduleActionsNotifier.new,
);

class ScheduleActionsNotifier extends Notifier<Map<String, bool>> {
  @override
  Map<String, bool> build() => {};

  void accept(String taskId) {
    state = {...state, taskId: true};
  }

  void reject(String taskId) {
    state = {...state, taskId: false};
  }

  void acceptAll(List<String> taskIds) {
    final updated = <String, bool>{...state};
    for (final id in taskIds) {
      updated[id] = true;
    }
    state = updated;
  }

  void reset() {
    state = {};
  }
}

// ── Insights Providers ──────────────────────────────────────────────

/// Async provider that fetches the AI insight report.
final aiInsightsProvider =
    FutureProvider.autoDispose<AiInsightReport>((ref) async {
  final aiApi = ref.watch(aiApiProvider);

  try {
    // Fetch patterns, energy, and suggestions in parallel.
    // Each call is wrapped so a single failure doesn't crash the whole
    // insights page — we degrade gracefully per section.
    final results = await Future.wait([
      _safeAiCall(() => aiApi.getPatterns(days: 7)),
      _safeAiCall(() => aiApi.getEnergy()),
      _safeAiCall(() => aiApi.getSuggestions(limit: 5)),
    ]);

    final patternsResp = results[0];
    final energyResp = results[1];
    final suggestionsResp = results[2];

    // If ALL three returned null, the AI service is unavailable
    if (patternsResp == null &&
        energyResp == null &&
        suggestionsResp == null) {
      ref.read(aiUnavailableProvider.notifier).markUnavailable();
      throw const AiUnavailableException(
        'AI insights are coming soon. '
        'The AI service is not yet configured.',
      );
    }

    // Parse energy forecast
    final energyForecast = <EnergyHour>[];
    if (energyResp != null &&
        energyResp.success &&
        energyResp.data != null) {
      final energyData = energyResp.data! as Map<String, dynamic>;
      final forecastList =
          energyData['forecast'] as List<dynamic>? ?? [];
      for (final item in forecastList) {
        energyForecast
            .add(EnergyHour.fromJson(item as Map<String, dynamic>));
      }
    }

    // Parse patterns
    final patternsList = <InsightPattern>[];
    if (patternsResp != null &&
        patternsResp.success &&
        patternsResp.data != null) {
      final patternsData = patternsResp.data! as Map<String, dynamic>;
      final rawPatterns =
          patternsData['patterns'] as List<dynamic>? ?? [];
      for (final item in rawPatterns) {
        patternsList
            .add(InsightPattern.fromJson(item as Map<String, dynamic>));
      }
    }

    // Parse suggestions as insight suggestions
    final suggestionsList = <InsightSuggestion>[];
    if (suggestionsResp != null &&
        suggestionsResp.success &&
        suggestionsResp.data != null) {
      final suggestionsData =
          suggestionsResp.data! as Map<String, dynamic>;
      final rawTasks =
          suggestionsData['rankedTasks'] as List<dynamic>? ?? [];
      for (final item in rawTasks) {
        final map = item as Map<String, dynamic>;
        final taskId = map['taskId'] as String? ?? '';
        suggestionsList.add(InsightSuggestion(
          title:
              'Focus on task ${taskId.length >= 8 ? taskId.substring(0, 8) : taskId}',
          description: 'Priority score: ${map['score'] ?? 0}',
          impact: 'medium',
        ));
      }
    }

    return AiInsightReport(
      summary:
          'Your weekly productivity data has been analyzed. '
          'Check the patterns and suggestions below.',
      patterns: patternsList,
      suggestions: suggestionsList,
      prediction:
          'Based on your patterns, next week looks productive. '
          'Keep your streaks going!',
      energyForecast: energyForecast,
    );
  } on AiUnavailableException {
    rethrow;
  } on DioException catch (e) {
    final apiErr = e.error;
    if (apiErr is ApiException) {
      throw Exception(apiErr.message);
    }
    throw Exception(
      'Could not reach the server. Please check your connection.',
    );
  }
});

/// Safely calls an AI API method, returning null instead of throwing
/// if the service is unavailable (503/502) or the network is down.
Future<ApiResponse<Map<String, dynamic>>?> _safeAiCall(
  Future<ApiResponse<Map<String, dynamic>>> Function() call,
) async {
  try {
    return await call();
  } on AiUnavailableException {
    return null;
  } on DioException {
    return null;
  }
}
