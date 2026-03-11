import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:meta/meta.dart';

// ---------------------------------------------------------------------------
// State providers for the first-task onboarding screen
// ---------------------------------------------------------------------------

/// Raw text the user has typed into the NLP input field.
final nlpInputProvider = StateProvider<String>((ref) => '');

/// Whether the first task is currently being submitted.
final firstTaskSubmittingProvider = StateProvider<bool>((ref) => false);

/// Whether the first task was successfully created (triggers success anim).
final firstTaskCreatedProvider = StateProvider<bool>((ref) => false);

// ---------------------------------------------------------------------------
// Self-contained NLP parser (no dependency on feature_todos)
// ---------------------------------------------------------------------------

/// Lightweight result of parsing a natural-language task string.
///
/// All fields except [title] are nullable and only populated when the
/// parser successfully extracts them from the input.
@immutable
class ParsedTaskResult {
  const ParsedTaskResult({
    required this.title,
    this.date,
    this.time,
    this.priority,
  });

  /// Cleaned title with all extracted tokens removed.
  final String title;

  /// Human-readable date string (e.g. "Tomorrow", "Monday").
  final String? date;

  /// Human-readable time string (e.g. "9:00 AM", "3:30 PM").
  final String? time;

  /// Priority label: "P1", "P2", "P4".
  final String? priority;

  /// True when nothing meaningful has been parsed yet.
  bool get isEmpty => title.isEmpty && date == null && time == null && priority == null;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is ParsedTaskResult &&
          runtimeType == other.runtimeType &&
          title == other.title &&
          date == other.date &&
          time == other.time &&
          priority == other.priority;

  @override
  int get hashCode => Object.hash(title, date, time, priority);

  @override
  String toString() =>
      'ParsedTaskResult(title: "$title", date: $date, '
      'time: $time, priority: $priority)';
}

/// Parse a natural-language task string into structured fields.
///
/// Extraction order: priority -> time -> date -> remaining = title.
/// Each step removes matched tokens so later patterns see cleaner input.
ParsedTaskResult parseTaskInput(String text) {
  if (text.trim().isEmpty) {
    return const ParsedTaskResult(title: '');
  }

  var working = text;

  // 1. Priority
  final priorityResult = _extractPriority(working);
  working = priorityResult.remaining;
  final priority = priorityResult.value;

  // 2. Time (before date so "at 3pm" is consumed first)
  final timeResult = _extractTime(working);
  working = timeResult.remaining;
  final time = timeResult.value;

  // 3. Date
  final dateResult = _extractDate(working);
  working = dateResult.remaining;
  final date = dateResult.value;

  // 4. Clean up title
  final title = _cleanTitle(working);

  return ParsedTaskResult(
    title: title,
    date: date,
    time: time,
    priority: priority,
  );
}

// ---------------------------------------------------------------------------
// Priority extraction
// ---------------------------------------------------------------------------

_Extracted<String?> _extractPriority(String input) {
  final patterns = <RegExp, String>{
    RegExp(r'\burgent\b', caseSensitive: false): 'P1',
    RegExp(r'\bimportant\b', caseSensitive: false): 'P1',
    RegExp(r'\bhigh\b', caseSensitive: false): 'P2',
    RegExp(r'\blow\b', caseSensitive: false): 'P4',
  };

  for (final entry in patterns.entries) {
    final match = entry.key.firstMatch(input);
    if (match != null) {
      return _Extracted(_removeMatch(input, match), entry.value);
    }
  }

  return _Extracted(input, null);
}

// ---------------------------------------------------------------------------
// Time extraction
// ---------------------------------------------------------------------------

_Extracted<String?> _extractTime(String input) {
  // "at 3pm", "3pm", "at 3:30pm", "3:30 PM", "at 15:00", "15:00"
  final timeRegex = RegExp(
    r'(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b'
    '|'
    r'(?:at\s+)?(\d{1,2}):(\d{2})\b(?!\s*(am|pm))',
    caseSensitive: false,
  );
  final match = timeRegex.firstMatch(input);
  if (match == null) return _Extracted(input, null);

  if (match.group(1) != null) {
    // 12-hour format
    var hour = int.parse(match.group(1)!);
    final minute = match.group(2) != null ? int.parse(match.group(2)!) : 0;
    final period = match.group(3)!.toLowerCase();

    if (period == 'pm' && hour != 12) hour += 12;
    if (period == 'am' && hour == 12) hour = 0;

    if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
      final label = _formatTime(hour, minute);
      return _Extracted(_removeMatch(input, match), label);
    }
  } else if (match.group(4) != null) {
    // 24-hour format
    final hour = int.parse(match.group(4)!);
    final minute = int.parse(match.group(5)!);

    if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
      final label = _formatTime(hour, minute);
      return _Extracted(_removeMatch(input, match), label);
    }
  }

  return _Extracted(input, null);
}

String _formatTime(int hour, int minute) {
  final period = hour >= 12 ? 'PM' : 'AM';
  final displayHour = hour == 0
      ? 12
      : hour > 12
          ? hour - 12
          : hour;
  final min = minute.toString().padLeft(2, '0');
  return '$displayHour:$min $period';
}

// ---------------------------------------------------------------------------
// Date extraction
// ---------------------------------------------------------------------------

_Extracted<String?> _extractDate(String input) {
  // "today"
  var regex = RegExp(r'\btoday\b', caseSensitive: false);
  var match = regex.firstMatch(input);
  if (match != null) {
    return _Extracted(_removeMatch(input, match), 'Today');
  }

  // "tomorrow"
  regex = RegExp(r'\btomorrow\b', caseSensitive: false);
  match = regex.firstMatch(input);
  if (match != null) {
    return _Extracted(_removeMatch(input, match), 'Tomorrow');
  }

  // "next week"
  regex = RegExp(r'\bnext\s+week\b', caseSensitive: false);
  match = regex.firstMatch(input);
  if (match != null) {
    return _Extracted(_removeMatch(input, match), 'Next week');
  }

  // Day names: "monday", "tuesday", etc.
  regex = RegExp(
    r'(?:\bby\s+|\bnext\s+)?'
    r'(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b',
    caseSensitive: false,
  );
  match = regex.firstMatch(input);
  if (match != null) {
    final rawDay = match.group(1)!;
    final capitalized = rawDay[0].toUpperCase() + rawDay.substring(1).toLowerCase();
    final prefix = match.group(0)!.toLowerCase().startsWith('next')
        ? 'Next '
        : '';
    return _Extracted(_removeMatch(input, match), '$prefix$capitalized');
  }

  return _Extracted(input, null);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

String _removeMatch(String input, Match match) {
  return input
      .replaceRange(match.start, match.end, ' ')
      .replaceAll(RegExp(r'\s{2,}'), ' ')
      .trim();
}

String _cleanTitle(String input) {
  var result = input.trim();
  // Remove dangling "by" at the end (from "report by Friday")
  result = result.replaceAll(RegExp(r'\s+by\s*$', caseSensitive: false), '');
  // Remove dangling "at" at the end (from "meeting at 3pm")
  result = result.replaceAll(RegExp(r'\s+at\s*$', caseSensitive: false), '');
  // Collapse multiple spaces
  result = result.replaceAll(RegExp(r'\s{2,}'), ' ');
  return result.trim();
}

/// Internal helper for returning both the remaining text and extracted value.
class _Extracted<T> {
  const _Extracted(this.remaining, this.value);

  final String remaining;
  final T value;
}
