import 'package:flutter/foundation.dart';

/// A single pattern detected by the AI.
@immutable
class InsightPattern {
  /// 'positive', 'negative', or 'neutral'.
  final String type;

  /// Human-readable description of the pattern.
  final String description;

  /// Confidence score (0-1).
  final double confidence;

  const InsightPattern({
    required this.type,
    required this.description,
    required this.confidence,
  });

  factory InsightPattern.fromJson(Map<String, dynamic> json) {
    return InsightPattern(
      type: json['type'] as String? ?? 'neutral',
      description: json['description'] as String? ?? '',
      confidence: (json['confidence'] as num?)?.toDouble() ?? 0.0,
    );
  }

  Map<String, dynamic> toJson() {
    return {'type': type, 'description': description, 'confidence': confidence};
  }
}

/// A suggested action from the AI.
@immutable
class InsightSuggestion {
  /// Short title of the suggestion.
  final String title;

  /// Detailed description.
  final String description;

  /// Impact level: 'high', 'medium', 'low'.
  final String impact;

  const InsightSuggestion({
    required this.title,
    required this.description,
    required this.impact,
  });

  factory InsightSuggestion.fromJson(Map<String, dynamic> json) {
    return InsightSuggestion(
      title: json['title'] as String? ?? '',
      description: json['description'] as String? ?? '',
      impact: json['impact'] as String? ?? 'medium',
    );
  }

  Map<String, dynamic> toJson() {
    return {'title': title, 'description': description, 'impact': impact};
  }
}

/// AI-generated weekly insight report.
@immutable
class AiInsightReport {
  /// 2-3 sentence overview.
  final String summary;

  /// Detected patterns.
  final List<InsightPattern> patterns;

  /// Actionable suggestions.
  final List<InsightSuggestion> suggestions;

  /// Prediction for next week.
  final String prediction;

  /// Energy forecast data.
  final List<EnergyHour> energyForecast;

  /// Tasks completed this week.
  final int tasksCompleted;

  /// Current streak (days).
  final int streakDays;

  const AiInsightReport({
    required this.summary,
    required this.patterns,
    required this.suggestions,
    required this.prediction,
    this.energyForecast = const [],
    this.tasksCompleted = 0,
    this.streakDays = 0,
  });

  factory AiInsightReport.fromJson(Map<String, dynamic> json) {
    return AiInsightReport(
      summary: json['summary'] as String? ?? '',
      patterns:
          (json['patterns'] as List<dynamic>?)
              ?.map((e) => InsightPattern.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
      suggestions:
          (json['suggestions'] as List<dynamic>?)
              ?.map(
                (e) => InsightSuggestion.fromJson(e as Map<String, dynamic>),
              )
              .toList() ??
          [],
      prediction: json['prediction'] as String? ?? '',
      energyForecast:
          (json['energyForecast'] as List<dynamic>?)
              ?.map((e) => EnergyHour.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
      tasksCompleted: json['tasksCompleted'] as int? ?? 0,
      streakDays: json['streakDays'] as int? ?? 0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'summary': summary,
      'patterns': patterns.map((e) => e.toJson()).toList(),
      'suggestions': suggestions.map((e) => e.toJson()).toList(),
      'prediction': prediction,
      'energyForecast': energyForecast.map((e) => e.toJson()).toList(),
      'tasksCompleted': tasksCompleted,
      'streakDays': streakDays,
    };
  }
}

/// A single hour in the energy forecast.
@immutable
class EnergyHour {
  /// Hour of day (0-23).
  final int hour;

  /// Energy level (1-5).
  final double energy;

  /// Confidence in the prediction.
  final double confidence;

  const EnergyHour({
    required this.hour,
    required this.energy,
    required this.confidence,
  });

  factory EnergyHour.fromJson(Map<String, dynamic> json) {
    return EnergyHour(
      hour: json['hour'] as int? ?? 0,
      energy: (json['energy'] as num?)?.toDouble() ?? 3.0,
      confidence: (json['confidence'] as num?)?.toDouble() ?? 0.5,
    );
  }

  Map<String, dynamic> toJson() {
    return {'hour': hour, 'energy': energy, 'confidence': confidence};
  }
}
