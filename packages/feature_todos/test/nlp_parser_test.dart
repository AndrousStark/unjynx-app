import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

// The canonical NLP parser now lives in unjynx_core.
// Full test suite: packages/core/test/nlp_parser_test.dart (68 tests)
//
// This file contains regression tests to ensure the re-export from
// feature_todos still resolves correctly.
import 'package:feature_todos/src/domain/services/nlp_parser.dart';

void main() {
  // Fixed reference date: 2026-03-09 (Monday)
  final monday = DateTime(2026, 3, 9);

  ParsedTask parse(String input) =>
      NlpParser.parse(input, referenceDate: monday);

  group('NLP parser re-export regression', () {
    test('extracts date + time + priority + project', () {
      final result = parse('Buy milk tomorrow 9am #p2 @personal');
      expect(result.title, 'Buy milk');
      expect(result.dueDate, DateTime(2026, 3, 10));
      expect(result.dueTime, const TimeOfDay(hour: 9, minute: 0));
      expect(result.priority, 'high');
      expect(result.projectHint, 'personal');
    });

    test('empty input returns empty title', () {
      final result = parse('');
      expect(result.title, '');
      expect(result.dueDate, isNull);
      expect(result.dueTime, isNull);
      expect(result.priority, isNull);
      expect(result.projectHint, isNull);
    });

    test('plain text preserves title unchanged', () {
      final result = parse('Just a simple task');
      expect(result.title, 'Just a simple task');
      expect(result.dueDate, isNull);
    });

    test('"by Friday" extracts date and cleans title', () {
      final result = parse('Finish report by Friday #p1');
      expect(result.title, 'Finish report');
      expect(result.dueDate, DateTime(2026, 3, 13));
      expect(result.priority, 'urgent');
    });

    test('24-hour time format works', () {
      final result = parse('Meeting at 14:00');
      expect(result.dueTime, const TimeOfDay(hour: 14, minute: 0));
      expect(result.title, 'Meeting');
    });
  });
}
