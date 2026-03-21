import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:meta/meta.dart';
import 'package:unjynx_core/core.dart';

// ---------------------------------------------------------------------------
// State providers for the first-task onboarding screen
// ---------------------------------------------------------------------------

/// Notifier for the NLP input text field.
class _StringNotifier extends Notifier<String> {
  @override
  String build() => '';
  void set(String value) => state = value;
}

/// Notifier for a boolean flag.
class _BoolNotifier extends Notifier<bool> {
  @override
  bool build() => false;
  void set(bool value) => state = value;
}

/// Raw text the user has typed into the NLP input field.
final nlpInputProvider =
    NotifierProvider<_StringNotifier, String>(_StringNotifier.new);

/// Whether the first task is currently being submitted.
final firstTaskSubmittingProvider =
    NotifierProvider<_BoolNotifier, bool>(_BoolNotifier.new);

/// Whether the first task was successfully created (triggers success anim).
final firstTaskCreatedProvider =
    NotifierProvider<_BoolNotifier, bool>(_BoolNotifier.new);

// ---------------------------------------------------------------------------
// Adapter: wraps core NlpParser for the onboarding UI
// ---------------------------------------------------------------------------

/// Lightweight result of parsing a natural-language task string.
///
/// All fields except [title] are nullable and only populated when the
/// parser successfully extracts them from the input.
///
/// Unlike [ParsedTask] from core (which returns [DateTime] / [TimeOfDay]),
/// this adapter returns human-readable display strings so the onboarding
/// UI can render them directly without formatting logic.
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

  /// Priority label: "P1", "P2", "P3", "P4".
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
/// Delegates to [NlpParser.parse] from core and converts the result
/// into a [ParsedTaskResult] with human-readable display strings.
ParsedTaskResult parseTaskInput(String text) {
  final parsed = NlpParser.parse(text);

  return ParsedTaskResult(
    title: parsed.title,
    date: _formatDate(parsed.dueDate),
    time: _formatTime(parsed.dueTime),
    priority: _formatPriority(parsed.priority),
  );
}

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

/// Convert a [DateTime] to a human-readable date label.
String? _formatDate(DateTime? date) {
  if (date == null) return null;

  final now = DateTime.now();
  final today = DateTime(now.year, now.month, now.day);
  final dateOnly = DateTime(date.year, date.month, date.day);

  if (dateOnly == today) return 'Today';
  if (dateOnly == today.add(const Duration(days: 1))) return 'Tomorrow';

  // Check if within the next 7 days — show weekday name
  final diff = dateOnly.difference(today).inDays;
  if (diff > 0 && diff <= 7) {
    const weekdays = [
      'Monday', 'Tuesday', 'Wednesday', 'Thursday',
      'Friday', 'Saturday', 'Sunday',
    ];
    return weekdays[date.weekday - 1];
  }

  // Check for "next week" range (8-14 days)
  if (diff > 7 && diff <= 14) {
    const weekdays = [
      'Monday', 'Tuesday', 'Wednesday', 'Thursday',
      'Friday', 'Saturday', 'Sunday',
    ];
    return 'Next ${weekdays[date.weekday - 1]}';
  }

  // Fall back to "Mon DD" format
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];
  return '${months[date.month - 1]} ${date.day}';
}

/// Convert a [TimeOfDay] to a human-readable time label.
String? _formatTime(TimeOfDay? time) {
  if (time == null) return null;

  final period = time.hour >= 12 ? 'PM' : 'AM';
  final displayHour = time.hour == 0
      ? 12
      : time.hour > 12
          ? time.hour - 12
          : time.hour;
  final min = time.minute.toString().padLeft(2, '0');
  return '$displayHour:$min $period';
}

/// Convert a core priority string to a compact UI label.
String? _formatPriority(String? priority) {
  return switch (priority?.toLowerCase()) {
    'urgent' => 'P1',
    'high' => 'P2',
    'medium' => 'P3',
    'low' => 'P4',
    _ => null,
  };
}
