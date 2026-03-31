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

/// Issue type for Jira-like task hierarchy.
enum TodoType {
  epic,
  story,
  task,
  bug,
  subtask,
  improvement,
}

/// Immutable TODO entity.
@freezed
abstract class Todo with _$Todo {
  const factory Todo({
    required String id,
    /// Organization this task belongs to (null = personal/legacy).
    String? orgId,
    required String title,
    @Default('') String description,
    @Default(TodoStatus.pending) TodoStatus status,
    @Default(TodoPriority.none) TodoPriority priority,
    @Default(TodoType.task) TodoType taskType,
    /// Jira-style issue key: UNJX-42.
    String? issueKey,
    String? projectId,
    /// Parent task for hierarchy (Epic → Story → Task → Subtask).
    String? parentId,
    /// Epic this task belongs to.
    String? epicId,
    /// Person doing the work.
    String? assigneeId,
    /// Person who reported/created the issue.
    String? reporterId,
    /// Sprint this task is assigned to.
    String? sprintId,
    /// Workflow-based status ID (replaces legacy status enum for custom workflows).
    String? statusId,
    /// Story points estimate.
    int? estimatePoints,
    DateTime? dueDate,
    DateTime? startDate,
    DateTime? completedAt,
    /// Resolution reason (done, wontfix, duplicate, cannot_reproduce).
    String? resolution,
    String? rrule,
    @Default(0) int sortOrder,
    @Default(0) int commentCount,
    @Default(0) int attachmentCount,
    @Default(false) bool isArchived,
    required DateTime createdAt,
    required DateTime updatedAt,
  }) = _Todo;

  factory Todo.fromJson(Map<String, dynamic> json) => _$TodoFromJson(json);
}
