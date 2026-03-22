import 'dart:async';

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

  // Fetch schedule suggestions
  final response = await aiApi.scheduleSuggestion(taskIds: []);

  if (!response.success || response.data == null) {
    throw Exception(response.error ?? 'Failed to get schedule suggestions');
  }

  final data = response.data! as Map<String, dynamic>;
  final scheduleList = data['schedule'] as List<dynamic>? ?? [];

  final slots = scheduleList.map((item) {
    final map = item as Map<String, dynamic>;
    final taskId = map['taskId'] as String? ?? '';
    return ScheduleSlot(
      taskId: taskId,
      taskTitle: 'Task ${taskId.length >= 8 ? taskId.substring(0, 8) : taskId}',
      suggestedStart: map['suggestedStart'] as String? ?? '',
      suggestedEnd: map['suggestedEnd'] as String? ?? '',
      reason: map['reason'] as String? ?? '',
    );
  }).toList();

  return ScheduleResult(
    slots: slots,
    insights: data['insights'] as String? ?? '',
  );
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

  // Fetch patterns, energy, and suggestions in parallel
  final results = await Future.wait([
    aiApi.getPatterns(days: 7),
    aiApi.getEnergy(),
    aiApi.getSuggestions(limit: 5),
  ]);

  final patternsResp = results[0];
  final energyResp = results[1];
  final suggestionsResp = results[2];

  // Parse energy forecast
  final energyForecast = <EnergyHour>[];
  if (energyResp.success && energyResp.data != null) {
    final energyData = energyResp.data! as Map<String, dynamic>;
    final forecastList = energyData['forecast'] as List<dynamic>? ?? [];
    for (final item in forecastList) {
      energyForecast.add(EnergyHour.fromJson(item as Map<String, dynamic>));
    }
  }

  // Parse patterns
  final patternsList = <InsightPattern>[];
  if (patternsResp.success && patternsResp.data != null) {
    final patternsData = patternsResp.data! as Map<String, dynamic>;
    final rawPatterns = patternsData['patterns'] as List<dynamic>? ?? [];
    for (final item in rawPatterns) {
      patternsList
          .add(InsightPattern.fromJson(item as Map<String, dynamic>));
    }
  }

  // Parse suggestions as insight suggestions
  final suggestionsList = <InsightSuggestion>[];
  if (suggestionsResp.success && suggestionsResp.data != null) {
    final suggestionsData = suggestionsResp.data! as Map<String, dynamic>;
    final rawTasks =
        suggestionsData['rankedTasks'] as List<dynamic>? ?? [];
    for (final item in rawTasks) {
      final map = item as Map<String, dynamic>;
      final taskId = map['taskId'] as String? ?? '';
      suggestionsList.add(InsightSuggestion(
        title: 'Focus on task ${taskId.length >= 8 ? taskId.substring(0, 8) : taskId}',
        description: 'Priority score: ${map['score'] ?? 0}',
        impact: 'medium',
      ));
    }
  }

  return AiInsightReport(
    summary:
        'Your weekly productivity data has been analyzed. Check the patterns and suggestions below.',
    patterns: patternsList,
    suggestions: suggestionsList,
    prediction:
        'Based on your patterns, next week looks productive. Keep your streaks going!',
    energyForecast: energyForecast,
  );
});
