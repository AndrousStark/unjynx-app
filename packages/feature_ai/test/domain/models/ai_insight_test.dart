import 'package:feature_ai/feature_ai.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('InsightPattern', () {
    test('fromJson parses correctly', () {
      final pattern = InsightPattern.fromJson({
        'type': 'positive',
        'description': 'Completion rate up 15%',
        'confidence': 0.92,
      });

      expect(pattern.type, 'positive');
      expect(pattern.description, 'Completion rate up 15%');
      expect(pattern.confidence, 0.92);
    });

    test('fromJson handles missing fields gracefully', () {
      final pattern = InsightPattern.fromJson({});

      expect(pattern.type, 'neutral');
      expect(pattern.description, '');
      expect(pattern.confidence, 0.0);
    });
  });

  group('InsightSuggestion', () {
    test('fromJson parses correctly', () {
      final suggestion = InsightSuggestion.fromJson({
        'title': 'Start earlier',
        'description': 'Your peak hours are 8-11 AM',
        'impact': 'high',
      });

      expect(suggestion.title, 'Start earlier');
      expect(suggestion.impact, 'high');
    });

    test('fromJson defaults impact to medium', () {
      final suggestion = InsightSuggestion.fromJson({
        'title': 'Test',
        'description': 'Desc',
      });

      expect(suggestion.impact, 'medium');
    });
  });

  group('EnergyHour', () {
    test('fromJson parses correctly', () {
      final hour = EnergyHour.fromJson({
        'hour': 14,
        'energy': 4.2,
        'confidence': 0.85,
      });

      expect(hour.hour, 14);
      expect(hour.energy, 4.2);
      expect(hour.confidence, 0.85);
    });

    test('fromJson provides defaults for missing fields', () {
      final hour = EnergyHour.fromJson({});

      expect(hour.hour, 0);
      expect(hour.energy, 3.0);
      expect(hour.confidence, 0.5);
    });
  });

  group('AiInsightReport', () {
    test('creates with default empty lists', () {
      const report = AiInsightReport(
        summary: 'Test summary',
        patterns: [],
        suggestions: [],
        prediction: 'Looking good',
      );

      expect(report.energyForecast, isEmpty);
      expect(report.tasksCompleted, 0);
      expect(report.streakDays, 0);
    });
  });
}
