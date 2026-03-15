import 'package:flutter/material.dart';
import 'package:meta/meta.dart';

/// Result of parsing a natural language task string.
///
/// All fields except [title] are optional and only populated
/// when the parser successfully extracts them from the input.
@immutable
class ParsedTask {
  const ParsedTask({
    required this.title,
    this.dueDate,
    this.dueTime,
    this.priority,
    this.projectHint,
  });

  /// Cleaned title with all extracted tokens removed.
  final String title;

  /// Extracted due date (date portion only).
  final DateTime? dueDate;

  /// Extracted time of day.
  final TimeOfDay? dueTime;

  /// Extracted priority level: none, low, medium, high, urgent.
  final String? priority;

  /// Extracted project name hint (from @project syntax).
  final String? projectHint;

  @override
  String toString() =>
      'ParsedTask(title: "$title", dueDate: $dueDate, '
      'dueTime: $dueTime, priority: $priority, '
      'projectHint: $projectHint)';

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is ParsedTask &&
          runtimeType == other.runtimeType &&
          title == other.title &&
          dueDate == other.dueDate &&
          dueTime == other.dueTime &&
          priority == other.priority &&
          projectHint == other.projectHint;

  @override
  int get hashCode =>
      Object.hash(title, dueDate, dueTime, priority, projectHint);
}

/// Regex-based NLP parser that extracts structured data from
/// natural language task input.
///
/// Extraction order matters -- each step removes matched tokens
/// from the working string so later patterns see a cleaner input.
///
/// Examples:
/// ```dart
/// // "Buy milk Monday 9am" -> title: "Buy milk", next Monday, 9:00
/// // "Call dentist tomorrow at 3pm" -> title: "Call dentist", 15:00
/// // "Finish report by Friday #p1" -> title: "Finish report", urgent
/// // "Meeting @work Thursday 2pm" -> project: "work", Thursday, 14:00
/// // "Read chapter 5 next week" -> title: "Read chapter 5", next Monday
/// ```
class NlpParser {
  const NlpParser._();

  /// Parse a natural language task string into structured fields.
  ///
  /// Accepts an optional [referenceDate] for testing; defaults to
  /// [DateTime.now] when not provided.
  static ParsedTask parse(String input, {DateTime? referenceDate}) {
    if (input.trim().isEmpty) {
      return const ParsedTask(title: '');
    }

    final now = referenceDate ?? DateTime.now();
    var working = input;

    // 1. Extract priority
    final priorityResult = _extractPriority(working);
    working = priorityResult.remaining;
    final priority = priorityResult.value;

    // 2. Extract project hint
    final projectResult = _extractProject(working);
    working = projectResult.remaining;
    final projectHint = projectResult.value;

    // 3. Extract time (before date, so "at 3pm" is consumed first)
    final timeResult = _extractTime(working);
    working = timeResult.remaining;
    final dueTime = timeResult.value;

    // 4. Extract date
    final dateResult = _extractDate(working, now);
    working = dateResult.remaining;
    final dueDate = dateResult.value;

    // 5. Clean up title
    final title = _cleanTitle(working);

    return ParsedTask(
      title: title,
      dueDate: dueDate,
      dueTime: dueTime,
      priority: priority,
      projectHint: projectHint,
    );
  }

  // ---------------------------------------------------------------------------
  // Priority extraction
  // ---------------------------------------------------------------------------

  static _ExtractionResult<String?> _extractPriority(String input) {
    // #p1 / !urgent -> urgent
    // #p2 / !important -> high
    // #p3 -> medium
    // #p4 -> low
    final patterns = <RegExp, String>{
      RegExp(r'#p1\b', caseSensitive: false): 'urgent',
      RegExp(r'!urgent\b', caseSensitive: false): 'urgent',
      RegExp(r'#p2\b', caseSensitive: false): 'high',
      RegExp(r'!important\b', caseSensitive: false): 'high',
      RegExp(r'#p3\b', caseSensitive: false): 'medium',
      RegExp(r'#p4\b', caseSensitive: false): 'low',
    };

    for (final entry in patterns.entries) {
      final match = entry.key.firstMatch(input);
      if (match != null) {
        final remaining = _removeMatch(input, match);
        return _ExtractionResult(remaining, entry.value);
      }
    }

    return _ExtractionResult(input, null);
  }

  // ---------------------------------------------------------------------------
  // Project extraction
  // ---------------------------------------------------------------------------

  static _ExtractionResult<String?> _extractProject(String input) {
    // @word -> project hint
    final regex = RegExp(r'@(\w+)');
    final match = regex.firstMatch(input);
    if (match != null) {
      final project = match.group(1)!;
      final remaining = _removeMatch(input, match);
      return _ExtractionResult(remaining, project);
    }
    return _ExtractionResult(input, null);
  }

  // ---------------------------------------------------------------------------
  // Time extraction
  // ---------------------------------------------------------------------------

  static _ExtractionResult<TimeOfDay?> _extractTime(String input) {
    // "noon" -> 12:00
    final noonRegex = RegExp(r'\bnoon\b', caseSensitive: false);
    var match = noonRegex.firstMatch(input);
    if (match != null) {
      return _ExtractionResult(
        _removeMatch(input, match),
        const TimeOfDay(hour: 12, minute: 0),
      );
    }

    // "midnight" -> 0:00
    final midnightRegex = RegExp(r'\bmidnight\b', caseSensitive: false);
    match = midnightRegex.firstMatch(input);
    if (match != null) {
      return _ExtractionResult(
        _removeMatch(input, match),
        const TimeOfDay(hour: 0, minute: 0),
      );
    }

    // "at 3pm", "at 3:30pm", "at 14:00", "3pm", "3:30 PM", "14:00"
    // Pattern: optional "at " + hour + optional (:minutes) + optional am/pm
    final timeRegex = RegExp(
      r'(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b'
      '|'
      r'(?:at\s+)?(\d{1,2}):(\d{2})\b(?!\s*(am|pm))',
      caseSensitive: false,
    );
    match = timeRegex.firstMatch(input);
    if (match != null) {
      TimeOfDay? time;

      if (match.group(1) != null) {
        // 12-hour format: 3pm, 3:30pm, at 3pm
        var hour = int.parse(match.group(1)!);
        final minute = match.group(2) != null ? int.parse(match.group(2)!) : 0;
        final period = match.group(3)!.toLowerCase();

        if (period == 'pm' && hour != 12) {
          hour += 12;
        } else if (period == 'am' && hour == 12) {
          hour = 0;
        }

        if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
          time = TimeOfDay(hour: hour, minute: minute);
        }
      } else if (match.group(4) != null) {
        // 24-hour format: 14:00, at 14:00
        final hour = int.parse(match.group(4)!);
        final minute = int.parse(match.group(5)!);

        if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
          time = TimeOfDay(hour: hour, minute: minute);
        }
      }

      if (time != null) {
        return _ExtractionResult(_removeMatch(input, match), time);
      }
    }

    return _ExtractionResult(input, null);
  }

  // ---------------------------------------------------------------------------
  // Date extraction
  // ---------------------------------------------------------------------------

  static _ExtractionResult<DateTime?> _extractDate(
    String input,
    DateTime now,
  ) {
    final today = DateTime(now.year, now.month, now.day);

    // "today"
    var regex = RegExp(r'\btoday\b', caseSensitive: false);
    var match = regex.firstMatch(input);
    if (match != null) {
      return _ExtractionResult(_removeMatch(input, match), today);
    }

    // "day after tomorrow" (must come before "tomorrow" to avoid partial match)
    regex = RegExp(r'\bday\s+after\s+tomorrow\b', caseSensitive: false);
    match = regex.firstMatch(input);
    if (match != null) {
      return _ExtractionResult(
        _removeMatch(input, match),
        today.add(const Duration(days: 2)),
      );
    }

    // "tomorrow"
    regex = RegExp(r'\btomorrow\b', caseSensitive: false);
    match = regex.firstMatch(input);
    if (match != null) {
      return _ExtractionResult(
        _removeMatch(input, match),
        today.add(const Duration(days: 1)),
      );
    }

    // "in N days/weeks"
    regex = RegExp(
      r'\bin\s+(\d+)\s+(days?|weeks?)\b',
      caseSensitive: false,
    );
    match = regex.firstMatch(input);
    if (match != null) {
      final n = int.parse(match.group(1)!);
      final unit = match.group(2)!.toLowerCase();
      final days = unit.startsWith('week') ? n * 7 : n;
      return _ExtractionResult(
        _removeMatch(input, match),
        today.add(Duration(days: days)),
      );
    }

    // "next week" (next Monday)
    regex = RegExp(r'\bnext\s+week\b', caseSensitive: false);
    match = regex.firstMatch(input);
    if (match != null) {
      final nextMonday = _nextWeekday(today, DateTime.monday);
      return _ExtractionResult(_removeMatch(input, match), nextMonday);
    }

    // "next monday", "next tuesday", etc.
    regex = RegExp(
      r'\bnext\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b',
      caseSensitive: false,
    );
    match = regex.firstMatch(input);
    if (match != null) {
      final dayName = match.group(1)!.toLowerCase();
      final targetWeekday = _weekdayFromName(dayName);
      // "next <day>" means the occurrence in the following week
      final nextOccurrence = _nextWeekday(today, targetWeekday);
      // If the next occurrence is this week, add 7 days
      final daysAhead = nextOccurrence.difference(today).inDays;
      final date = daysAhead <= 7
          ? nextOccurrence.add(const Duration(days: 7))
          : nextOccurrence;
      return _ExtractionResult(_removeMatch(input, match), date);
    }

    // "by <dayname>" or standalone day name: "monday", "friday", etc.
    regex = RegExp(
      r'(?:\bby\s+)?(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b',
      caseSensitive: false,
    );
    match = regex.firstMatch(input);
    if (match != null) {
      final dayName = match.group(1)!.toLowerCase();
      final targetWeekday = _weekdayFromName(dayName);
      final date = _nextWeekday(today, targetWeekday);
      return _ExtractionResult(_removeMatch(input, match), date);
    }

    // Month day: "jan 5", "january 15", "5th jan", "march 15th"
    // Pattern 1: month name + day
    regex = RegExp(
      r'\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|'
      'may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|'
      'oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)'
      r'\s+(\d{1,2})(?:st|nd|rd|th)?\b',
      caseSensitive: false,
    );
    match = regex.firstMatch(input);
    if (match != null) {
      final month = _monthFromName(match.group(1)!);
      final day = int.parse(match.group(2)!);
      final date = _resolveMonthDay(now, month, day);
      if (date != null) {
        return _ExtractionResult(_removeMatch(input, match), date);
      }
    }

    // Pattern 2: day + month name: "5th jan", "15 march"
    regex = RegExp(
      r'\b(\d{1,2})(?:st|nd|rd|th)?\s+'
      '(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|'
      'may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|'
      r'oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\b',
      caseSensitive: false,
    );
    match = regex.firstMatch(input);
    if (match != null) {
      final day = int.parse(match.group(1)!);
      final month = _monthFromName(match.group(2)!);
      final date = _resolveMonthDay(now, month, day);
      if (date != null) {
        return _ExtractionResult(_removeMatch(input, match), date);
      }
    }

    return _ExtractionResult(input, null);
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  /// Remove a regex match from the input and collapse extra whitespace.
  static String _removeMatch(String input, Match match) {
    return input
        .replaceRange(match.start, match.end, ' ')
        .replaceAll(RegExp(r'\s{2,}'), ' ')
        .trim();
  }

  /// Clean up the final title: remove leading/trailing "by", extra spaces.
  static String _cleanTitle(String input) {
    var result = input.trim();
    // Remove dangling "by" at the end (from "report by Friday")
    result = result.replaceAll(RegExp(r'\s+by\s*$', caseSensitive: false), '');
    // Remove dangling "at" at the end (from "meeting at 3pm")
    result = result.replaceAll(RegExp(r'\s+at\s*$', caseSensitive: false), '');
    // Collapse multiple spaces
    result = result.replaceAll(RegExp(r'\s{2,}'), ' ');
    return result.trim();
  }

  /// Get the next occurrence of [weekday] on or after [from].
  /// If [from] is that weekday, returns the next week's occurrence.
  static DateTime _nextWeekday(DateTime from, int weekday) {
    var daysAhead = weekday - from.weekday;
    if (daysAhead <= 0) {
      daysAhead += 7;
    }
    return from.add(Duration(days: daysAhead));
  }

  /// Convert a day name to a [DateTime] weekday constant.
  static int _weekdayFromName(String name) {
    return switch (name.toLowerCase()) {
      'monday' => DateTime.monday,
      'tuesday' => DateTime.tuesday,
      'wednesday' => DateTime.wednesday,
      'thursday' => DateTime.thursday,
      'friday' => DateTime.friday,
      'saturday' => DateTime.saturday,
      'sunday' => DateTime.sunday,
      _ => DateTime.monday,
    };
  }

  /// Convert a month name (or abbreviation) to a month number (1-12).
  static int _monthFromName(String name) {
    return switch (name.toLowerCase()) {
      'jan' || 'january' => 1,
      'feb' || 'february' => 2,
      'mar' || 'march' => 3,
      'apr' || 'april' => 4,
      'may' => 5,
      'jun' || 'june' => 6,
      'jul' || 'july' => 7,
      'aug' || 'august' => 8,
      'sep' || 'september' => 9,
      'oct' || 'october' => 10,
      'nov' || 'november' => 11,
      'dec' || 'december' => 12,
      _ => 1,
    };
  }

  /// Resolve a month+day to a full DateTime. If the date has already
  /// passed this year, returns the same date next year.
  static DateTime? _resolveMonthDay(DateTime now, int month, int day) {
    if (day < 1 || day > 31 || month < 1 || month > 12) return null;

    var candidate = DateTime(now.year, month, day);
    // Check if the day is valid for the month (e.g. Feb 30)
    if (candidate.month != month || candidate.day != day) return null;

    final today = DateTime(now.year, now.month, now.day);
    if (candidate.isBefore(today)) {
      candidate = DateTime(now.year + 1, month, day);
    }
    return candidate;
  }
}

/// Internal helper for returning both the remaining text and extracted value.
class _ExtractionResult<T> {
  const _ExtractionResult(this.remaining, this.value);

  final String remaining;
  final T value;
}
