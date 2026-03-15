import 'package:freezed_annotation/freezed_annotation.dart';

part 'todo.freezed.dart';
part 'todo.g.dart';

/// Priority levels for a TODO item.
enum TodoPriority {
  none,
  low,
  medium,
  high,
  urgent,
}

/// Status of a TODO item.
enum TodoStatus {
  pending,
  inProgress,
  completed,
  cancelled,
}

/// Immutable TODO entity.
@freezed
abstract class Todo with _$Todo {
  const factory Todo({
    required String id,
    required String title,
    @Default('') String description,
    @Default(TodoStatus.pending) TodoStatus status,
    @Default(TodoPriority.none) TodoPriority priority,
    String? projectId,
    DateTime? dueDate,
    DateTime? completedAt,
    String? rrule,
    @Default(0) int sortOrder,
    required DateTime createdAt,
    required DateTime updatedAt,
  }) = _Todo;

  factory Todo.fromJson(Map<String, dynamic> json) => _$TodoFromJson(json);
}
