/// Port for AI/LLM operations.
///
/// Implementations: Ollama (local dev), Claude API (production).
abstract class AIPort {
  /// Generate a text completion.
  Future<String> complete({
    required String prompt,
    String? systemPrompt,
    double temperature,
    int maxTokens,
  });

  /// Generate suggestions for a task.
  Future<List<String>> suggestTasks({
    required String context,
    int count,
  });

  /// Analyze task patterns and suggest optimal scheduling.
  Future<Map<String, dynamic>> analyzeSchedule({
    required List<Map<String, dynamic>> tasks,
    required Map<String, dynamic> userPreferences,
  });
}
