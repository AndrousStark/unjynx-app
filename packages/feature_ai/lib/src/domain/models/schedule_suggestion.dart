import 'package:flutter/foundation.dart';

/// A suggested time slot for a task.
@immutable
class ScheduleSlot {
  /// The task ID this suggestion is for.
  final String taskId;

  /// The task title (for display).
  final String taskTitle;

  /// Suggested start time (HH:MM format).
  final String suggestedStart;

  /// Suggested end time (HH:MM format).
  final String suggestedEnd;

  /// AI's reason for this time slot.
  final String reason;

  /// Whether the user has accepted this suggestion.
  final bool accepted;

  /// Whether the user has rejected this suggestion.
  final bool rejected;

  const ScheduleSlot({
    required this.taskId,
    required this.taskTitle,
    required this.suggestedStart,
    required this.suggestedEnd,
    required this.reason,
    this.accepted = false,
    this.rejected = false,
  });

  factory ScheduleSlot.fromJson(Map<String, dynamic> json) {
    return ScheduleSlot(
      taskId: json['taskId'] as String? ?? '',
      taskTitle: json['taskTitle'] as String? ?? '',
      suggestedStart: json['suggestedStart'] as String? ?? '',
      suggestedEnd: json['suggestedEnd'] as String? ?? '',
      reason: json['reason'] as String? ?? '',
      accepted: json['accepted'] as bool? ?? false,
      rejected: json['rejected'] as bool? ?? false,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'taskId': taskId,
      'taskTitle': taskTitle,
      'suggestedStart': suggestedStart,
      'suggestedEnd': suggestedEnd,
      'reason': reason,
      'accepted': accepted,
      'rejected': rejected,
    };
  }

  ScheduleSlot copyWith({
    String? taskId,
    String? taskTitle,
    String? suggestedStart,
    String? suggestedEnd,
    String? reason,
    bool? accepted,
    bool? rejected,
  }) {
    return ScheduleSlot(
      taskId: taskId ?? this.taskId,
      taskTitle: taskTitle ?? this.taskTitle,
      suggestedStart: suggestedStart ?? this.suggestedStart,
      suggestedEnd: suggestedEnd ?? this.suggestedEnd,
      reason: reason ?? this.reason,
      accepted: accepted ?? this.accepted,
      rejected: rejected ?? this.rejected,
    );
  }

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is ScheduleSlot &&
          runtimeType == other.runtimeType &&
          taskId == other.taskId &&
          accepted == other.accepted &&
          rejected == other.rejected;

  @override
  int get hashCode => Object.hash(taskId, accepted, rejected);
}

/// The full schedule suggestion result from AI.
@immutable
class ScheduleResult {
  /// List of suggested time slots.
  final List<ScheduleSlot> slots;

  /// AI's scheduling insights / rationale.
  final String insights;

  const ScheduleResult({required this.slots, required this.insights});

  factory ScheduleResult.fromJson(Map<String, dynamic> json) {
    return ScheduleResult(
      slots:
          (json['slots'] as List<dynamic>?)
              ?.map((e) => ScheduleSlot.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
      insights: json['insights'] as String? ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'slots': slots.map((e) => e.toJson()).toList(),
      'insights': insights,
    };
  }
}
