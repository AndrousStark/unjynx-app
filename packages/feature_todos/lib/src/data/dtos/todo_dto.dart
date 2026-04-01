import 'package:freezed_annotation/freezed_annotation.dart';

import '../../domain/entities/todo.dart';

part 'todo_dto.freezed.dart';
part 'todo_dto.g.dart';

/// Data Transfer Object for TODO items.
///
/// Maps between API/DB representation and domain [Todo] entity.
@freezed
abstract class TodoDto with _$TodoDto {
  const factory TodoDto({
    required String id,
    @JsonKey(name: 'org_id') String? orgId,
    required String title,
    @Default('') String description,
    @Default('pending') String status,
    @Default('none') String priority,
    @JsonKey(name: 'task_type') @Default('task') String? taskType,
    @JsonKey(name: 'issue_key') String? issueKey,
    @JsonKey(name: 'project_id') String? projectId,
    @JsonKey(name: 'parent_id') String? parentId,
    @JsonKey(name: 'epic_id') String? epicId,
    @JsonKey(name: 'assignee_id') String? assigneeId,
    @JsonKey(name: 'reporter_id') String? reporterId,
    @JsonKey(name: 'sprint_id') String? sprintId,
    @JsonKey(name: 'status_id') String? statusId,
    @JsonKey(name: 'estimate_points') int? estimatePoints,
    @JsonKey(name: 'due_date') String? dueDate,
    @JsonKey(name: 'start_date') String? startDate,
    @JsonKey(name: 'completed_at') String? completedAt,
    String? resolution,
    String? rrule,
    @JsonKey(name: 'sort_order') @Default(0) int sortOrder,
    @JsonKey(name: 'comment_count') @Default(0) int? commentCount,
    @JsonKey(name: 'attachment_count') @Default(0) int? attachmentCount,
    @JsonKey(name: 'is_archived') @Default(false) bool? isArchived,
    @JsonKey(name: 'created_at') required String createdAt,
    @JsonKey(name: 'updated_at') required String updatedAt,
  }) = _TodoDto;

  factory TodoDto.fromJson(Map<String, dynamic> json) =>
      _$TodoDtoFromJson(json);
}

/// Maps between [TodoDto] and domain [Todo].
extension TodoMapper on TodoDto {
  Todo toDomain() {
    return Todo(
      id: id,
      orgId: orgId,
      title: title,
      description: description,
      status: _parseStatus(status),
      priority: _parsePriority(priority),
      taskType: _parseTaskType(taskType ?? 'task'),
      issueKey: issueKey,
      projectId: projectId,
      parentId: parentId,
      epicId: epicId,
      assigneeId: assigneeId,
      reporterId: reporterId,
      sprintId: sprintId,
      statusId: statusId,
      estimatePoints: estimatePoints,
      dueDate: dueDate != null ? DateTime.parse(dueDate!) : null,
      startDate: startDate != null ? DateTime.parse(startDate!) : null,
      completedAt: completedAt != null ? DateTime.parse(completedAt!) : null,
      resolution: resolution,
      rrule: rrule,
      sortOrder: sortOrder,
      commentCount: commentCount ?? 0,
      attachmentCount: attachmentCount ?? 0,
      isArchived: isArchived ?? false,
      createdAt: DateTime.parse(createdAt),
      updatedAt: DateTime.parse(updatedAt),
    );
  }

  static TodoDto fromDomain(Todo todo) {
    return TodoDto(
      id: todo.id,
      orgId: todo.orgId,
      title: todo.title,
      description: todo.description,
      status: todo.status.name,
      priority: todo.priority.name,
      taskType: todo.taskType.name,
      issueKey: todo.issueKey,
      projectId: todo.projectId,
      parentId: todo.parentId,
      epicId: todo.epicId,
      assigneeId: todo.assigneeId,
      reporterId: todo.reporterId,
      sprintId: todo.sprintId,
      statusId: todo.statusId,
      estimatePoints: todo.estimatePoints,
      dueDate: todo.dueDate?.toIso8601String(),
      startDate: todo.startDate?.toIso8601String(),
      completedAt: todo.completedAt?.toIso8601String(),
      resolution: todo.resolution,
      rrule: todo.rrule,
      sortOrder: todo.sortOrder,
      commentCount: todo.commentCount,
      attachmentCount: todo.attachmentCount,
      isArchived: todo.isArchived,
      createdAt: todo.createdAt.toIso8601String(),
      updatedAt: todo.updatedAt.toIso8601String(),
    );
  }
}

TodoStatus _parseStatus(String value) {
  return switch (value) {
    'in_progress' => TodoStatus.inProgress,
    'completed' => TodoStatus.completed,
    'cancelled' => TodoStatus.cancelled,
    _ => TodoStatus.pending,
  };
}

TodoPriority _parsePriority(String value) {
  return switch (value) {
    'low' => TodoPriority.low,
    'medium' => TodoPriority.medium,
    'high' => TodoPriority.high,
    'urgent' => TodoPriority.urgent,
    _ => TodoPriority.none,
  };
}

TodoType _parseTaskType(String value) {
  return switch (value) {
    'epic' => TodoType.epic,
    'story' => TodoType.story,
    'bug' => TodoType.bug,
    'subtask' => TodoType.subtask,
    'improvement' => TodoType.improvement,
    _ => TodoType.task,
  };
}
