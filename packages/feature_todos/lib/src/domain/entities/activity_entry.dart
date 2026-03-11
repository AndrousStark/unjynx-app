import 'package:flutter/foundation.dart';

/// Type of activity logged for a task.
enum ActivityType {
  created,
  updated,
  completed,
  uncompleted,
  priorityChanged,
  dueDateChanged,
  projectChanged,
  subtaskAdded,
  subtaskCompleted,
  duplicated,
  moved,
}

/// A single entry in a task's activity log.
@immutable
class ActivityEntry {
  const ActivityEntry({
    required this.id,
    required this.todoId,
    required this.type,
    required this.description,
    required this.timestamp,
  });

  final String id;
  final String todoId;
  final ActivityType type;
  final String description;
  final DateTime timestamp;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is ActivityEntry &&
          runtimeType == other.runtimeType &&
          id == other.id;

  @override
  int get hashCode => id.hashCode;
}
