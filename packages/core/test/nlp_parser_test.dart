import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:unjynx_core/services/nlp_parser.dart';

void main() {
  // All tests use a fixed reference date so day-of-week calculations
  // are deterministic. 2026-03-09 is a Monday.
  final monday = DateTime(2026, 3, 9);

  // Helper to parse with fixed date
  ParsedTask parse(String input) =>
      NlpParser.parse(input, referenceDate: monday);

  // -------------------------------------------------------------------------
  // Date extraction
  // -------------------------------------------------------------------------

  group('Date extraction', () {
    test('extracts "today"', () {
      final result = parse('Buy milk today');
      expect(result.dueDate, DateTime(2026, 3, 9));
      expect(result.title, 'Buy milk');
    });

    test('extracts "tomorrow"', () {
      final result = parse('Buy milk tomorrow');
      expect(result.dueDate, DateTime(2026, 3, 10));
      expect(result.title, 'Buy milk');
    });

    test('extracts "day after tomorrow"', () {
      final result = parse('Call dentist day after tomorrow');
      expect(result.dueDate, DateTime(2026, 3, 11));
      expect(result.title, 'Call dentist');
    });

    test('extracts standalone day name "Monday"', () {
      // Reference is Monday, so next Monday is 7 days later
      final result = parse('Call dentist Monday');
      expect(result.dueDate, DateTime(2026, 3, 16));
      expect(result.title, 'Call dentist');
    });

    test('extracts standalone day name "Friday"', () {
      // Reference is Monday Mar 9, next Friday is Mar 13
      final result = parse('Report Friday');
      expect(result.dueDate, DateTime(2026, 3, 13));
      expect(result.title, 'Report');
    });

    test('extracts "by Friday"', () {
      final result = parse('Finish report by Friday');
      expect(result.dueDate, DateTime(2026, 3, 13));
      expect(result.title, 'Finish report');
    });

    test('extracts "next week"', () {
      // Next Monday from Monday Mar 9 is Mar 16
      final result = parse('Read chapter 5 next week');
      expect(result.dueDate, DateTime(2026, 3, 16));
      expect(result.title, 'Read chapter 5');
    });

    test('extracts "next Monday"', () {
      // "next monday" skips the current week
      final result = parse('Meeting next Monday');
      // From Monday Mar 9, next occurrence is Mar 16,
      // but since it's <= 7 days and uses "next", it goes to Mar 23
      expect(result.dueDate, DateTime(2026, 3, 23));
      expect(result.title, 'Meeting');
    });

    test('extracts "next Thursday"', () {
      // Reference Monday Mar 9, next Thursday = Mar 12 (3 days),
      // but "next thursday" means the week after, so Mar 19
      final result = parse('Dentist next Thursday');
      expect(result.dueDate, DateTime(2026, 3, 19));
      expect(result.title, 'Dentist');
    });

    test('extracts "in 3 days"', () {
      final result = parse('Deliver package in 3 days');
      expect(result.dueDate, DateTime(2026, 3, 12));
      expect(result.title, 'Deliver package');
    });

    test('extracts "in 2 weeks"', () {
      final result = parse('Review code in 2 weeks');
      expect(result.dueDate, DateTime(2026, 3, 23));
      expect(result.title, 'Review code');
    });

    test('extracts "jan 15" (month name + day)', () {
      // Jan 15 already passed in 2026 (ref is Mar 9), so it wraps to 2027
      final result = parse('Birthday jan 15');
      expect(result.dueDate, DateTime(2027, 1, 15));
      expect(result.title, 'Birthday');
    });

    test('extracts "march 15" (same month, future day)', () {
      final result = parse('Submit march 15');
      expect(result.dueDate, DateTime(2026, 3, 15));
      expect(result.title, 'Submit');
    });

    test('extracts "15th march" (day + month name)', () {
      final result = parse('Submit 15th march');
      expect(result.dueDate, DateTime(2026, 3, 15));
      expect(result.title, 'Submit');
    });

    test('extracts "5th jan" (day + abbreviated month, wraps year)', () {
      final result = parse('Renew license 5th jan');
      expect(result.dueDate, DateTime(2027, 1, 5));
      expect(result.title, 'Renew license');
    });

    test('handles case-insensitive day names', () {
      final result = parse('Meeting WEDNESDAY');
      expect(result.dueDate, DateTime(2026, 3, 11));
      expect(result.title, 'Meeting');
    });

    test('handles case-insensitive "Today"', () {
      final result = parse('Buy groceries Today');
      expect(result.dueDate, DateTime(2026, 3, 9));
      expect(result.title, 'Buy groceries');
    });
  });

  // -------------------------------------------------------------------------
  // Time extraction
  // -------------------------------------------------------------------------

  group('Time extraction', () {
    test('extracts "9am"', () {
      final result = parse('Meeting 9am');
      expect(result.dueTime, const TimeOfDay(hour: 9, minute: 0));
      expect(result.title, 'Meeting');
    });

    test('extracts "3pm"', () {
      final result = parse('Call 3pm');
      expect(result.dueTime, const TimeOfDay(hour: 15, minute: 0));
      expect(result.title, 'Call');
    });

    test('extracts "at 3pm"', () {
      final result = parse('Call at 3pm');
      expect(result.dueTime, const TimeOfDay(hour: 15, minute: 0));
      expect(result.title, 'Call');
    });

    test('extracts "at 3:30pm"', () {
      final result = parse('Call at 3:30pm');
      expect(result.dueTime, const TimeOfDay(hour: 15, minute: 30));
      expect(result.title, 'Call');
    });

    test('extracts "9:00am"', () {
      final result = parse('Standup 9:00am');
      expect(result.dueTime, const TimeOfDay(hour: 9, minute: 0));
      expect(result.title, 'Standup');
    });

    test('extracts "9:00 AM" with space', () {
      final result = parse('Standup 9:00 AM');
      expect(result.dueTime, const TimeOfDay(hour: 9, minute: 0));
      expect(result.title, 'Standup');
    });

    test('extracts "14:00" (24-hour)', () {
      final result = parse('Meeting at 14:00');
      expect(result.dueTime, const TimeOfDay(hour: 14, minute: 0));
      expect(result.title, 'Meeting');
    });

    test('extracts "noon"', () {
      final result = parse('Lunch noon');
      expect(result.dueTime, const TimeOfDay(hour: 12, minute: 0));
      expect(result.title, 'Lunch');
    });

    test('extracts "midnight"', () {
      final result = parse('Deploy midnight');
      expect(result.dueTime, const TimeOfDay(hour: 0, minute: 0));
      expect(result.title, 'Deploy');
    });

    test('extracts "12pm" correctly', () {
      final result = parse('Lunch 12pm');
      expect(result.dueTime, const TimeOfDay(hour: 12, minute: 0));
      expect(result.title, 'Lunch');
    });

    test('extracts "12am" correctly', () {
      final result = parse('Deploy 12am');
      expect(result.dueTime, const TimeOfDay(hour: 0, minute: 0));
      expect(result.title, 'Deploy');
    });
  });

  // -------------------------------------------------------------------------
  // Priority extraction
  // -------------------------------------------------------------------------

  group('Priority extraction', () {
    test('extracts #p1 as urgent', () {
      final result = parse('Fix bug #p1');
      expect(result.priority, 'urgent');
      expect(result.title, 'Fix bug');
    });

    test('extracts #p2 as high', () {
      final result = parse('Review PR #p2');
      expect(result.priority, 'high');
      expect(result.title, 'Review PR');
    });

    test('extracts #p3 as medium', () {
      final result = parse('Update docs #p3');
      expect(result.priority, 'medium');
      expect(result.title, 'Update docs');
    });

    test('extracts #p4 as low', () {
      final result = parse('Organize files #p4');
      expect(result.priority, 'low');
      expect(result.title, 'Organize files');
    });

    test('extracts !urgent as urgent', () {
      final result = parse('Server down !urgent');
      expect(result.priority, 'urgent');
      expect(result.title, 'Server down');
    });

    test('extracts !important as high', () {
      final result = parse('Client meeting !important');
      expect(result.priority, 'high');
      expect(result.title, 'Client meeting');
    });

    test('handles case-insensitive priority', () {
      final result = parse('Task #P1');
      expect(result.priority, 'urgent');
    });

    test('handles case-insensitive !URGENT', () {
      final result = parse('Task !URGENT');
      expect(result.priority, 'urgent');
    });
  });

  // -------------------------------------------------------------------------
  // Project hint extraction
  // -------------------------------------------------------------------------

  group('Project hint extraction', () {
    test('extracts @work', () {
      final result = parse('Meeting @work');
      expect(result.projectHint, 'work');
      expect(result.title, 'Meeting');
    });

    test('extracts @personal', () {
      final result = parse('Buy groceries @personal');
      expect(result.projectHint, 'personal');
      expect(result.title, 'Buy groceries');
    });

    test('extracts @project_name with underscore', () {
      final result = parse('Deploy @side_project');
      expect(result.projectHint, 'side_project');
      expect(result.title, 'Deploy');
    });

    test('extracts @project in middle of text', () {
      final result = parse('Task @work tomorrow');
      expect(result.projectHint, 'work');
      expect(result.title, 'Task');
    });
  });

  // -------------------------------------------------------------------------
  // Combined extraction
  // -------------------------------------------------------------------------

  group('Combined extraction', () {
    test('extracts all fields: date, time, priority, project', () {
      final result = parse('Buy milk tomorrow 9am #p2 @personal');
      expect(result.title, 'Buy milk');
      expect(result.dueDate, DateTime(2026, 3, 10));
      expect(result.dueTime, const TimeOfDay(hour: 9, minute: 0));
      expect(result.priority, 'high');
      expect(result.projectHint, 'personal');
    });

    test('extracts day name + time + priority marker', () {
      final result = parse('Call dentist Monday at 3pm !urgent');
      expect(result.title, 'Call dentist');
      expect(result.dueDate, DateTime(2026, 3, 16));
      expect(result.dueTime, const TimeOfDay(hour: 15, minute: 0));
      expect(result.priority, 'urgent');
    });

    test('extracts date + project in natural sentence', () {
      final result = parse('Meeting @work Thursday 2pm');
      expect(result.title, 'Meeting');
      expect(result.projectHint, 'work');
      expect(result.dueDate, DateTime(2026, 3, 12));
      expect(result.dueTime, const TimeOfDay(hour: 14, minute: 0));
    });

    test('extracts "by Friday" with priority', () {
      final result = parse('Finish report by Friday #p1');
      expect(result.title, 'Finish report');
      expect(result.dueDate, DateTime(2026, 3, 13));
      expect(result.priority, 'urgent');
    });

    test('extracts tomorrow + time without "at"', () {
      final result = parse('Standup tomorrow 9:30am');
      expect(result.title, 'Standup');
      expect(result.dueDate, DateTime(2026, 3, 10));
      expect(result.dueTime, const TimeOfDay(hour: 9, minute: 30));
    });

    test('handles priority at start', () {
      final result = parse('#p3 Buy groceries today');
      expect(result.title, 'Buy groceries');
      expect(result.priority, 'medium');
      expect(result.dueDate, DateTime(2026, 3, 9));
    });

    test('handles project at start', () {
      final result = parse('@work Daily standup 9am');
      expect(result.title, 'Daily standup');
      expect(result.projectHint, 'work');
      expect(result.dueTime, const TimeOfDay(hour: 9, minute: 0));
    });
  });

  // -------------------------------------------------------------------------
  // Edge cases
  // -------------------------------------------------------------------------

  group('Edge cases', () {
    test('empty string returns empty title', () {
      final result = parse('');
      expect(result.title, '');
      expect(result.dueDate, isNull);
      expect(result.dueTime, isNull);
      expect(result.priority, isNull);
      expect(result.projectHint, isNull);
    });

    test('whitespace-only string returns empty title', () {
      final result = parse('   ');
      expect(result.title, '');
    });

    test('simple task with no special markers', () {
      final result = parse('Just a simple task');
      expect(result.title, 'Just a simple task');
      expect(result.dueDate, isNull);
      expect(result.dueTime, isNull);
      expect(result.priority, isNull);
      expect(result.projectHint, isNull);
    });

    test('task with no special markers preserves text', () {
      final result = parse('task with no special markers');
      expect(result.title, 'task with no special markers');
    });

    test('only priority returns cleaned title', () {
      final result = parse('#p1');
      expect(result.title, '');
      expect(result.priority, 'urgent');
    });

    test('only date returns cleaned title', () {
      final result = parse('today');
      expect(result.title, '');
      expect(result.dueDate, DateTime(2026, 3, 9));
    });

    test('preserves numbers that are not dates/times', () {
      final result = parse('Read chapter 5');
      expect(result.title, 'Read chapter 5');
      expect(result.dueDate, isNull);
      expect(result.dueTime, isNull);
    });

    test('preserves text with "at" that is not time-related', () {
      final result = parse('Look at the budget');
      expect(result.title, 'Look at the budget');
    });

    test('does not parse partial day names', () {
      // "sun" inside "sunshine" should not be parsed as Sunday
      final result = parse('Buy sunscreen');
      expect(result.title, 'Buy sunscreen');
      expect(result.dueDate, isNull);
    });

    test('handles multiple spaces gracefully', () {
      final result = parse('Buy   milk   tomorrow   9am');
      expect(result.title, 'Buy milk');
      expect(result.dueDate, DateTime(2026, 3, 10));
      expect(result.dueTime, const TimeOfDay(hour: 9, minute: 0));
    });

    test('invalid month-day combination returns no date', () {
      // Feb 30 does not exist
      final result = parse('Party feb 30');
      expect(result.dueDate, isNull);
      expect(result.title, 'Party feb 30');
    });
  });

  // -------------------------------------------------------------------------
  // ParsedTask equality
  // -------------------------------------------------------------------------

  group('ParsedTask', () {
    test('equals works for identical tasks', () {
      const a = ParsedTask(title: 'Hello');
      const b = ParsedTask(title: 'Hello');
      expect(a, equals(b));
    });

    test('equals works with all fields', () {
      final a = ParsedTask(
        title: 'Test',
        dueDate: DateTime(2026, 3, 10),
        dueTime: const TimeOfDay(hour: 9, minute: 0),
        priority: 'high',
        projectHint: 'work',
      );
      final b = ParsedTask(
        title: 'Test',
        dueDate: DateTime(2026, 3, 10),
        dueTime: const TimeOfDay(hour: 9, minute: 0),
        priority: 'high',
        projectHint: 'work',
      );
      expect(a, equals(b));
    });

    test('not equals with different titles', () {
      const a = ParsedTask(title: 'A');
      const b = ParsedTask(title: 'B');
      expect(a, isNot(equals(b)));
    });

    test('toString includes all fields', () {
      const task = ParsedTask(title: 'Test', priority: 'high');
      expect(task.toString(), contains('Test'));
      expect(task.toString(), contains('high'));
    });
  });
}
