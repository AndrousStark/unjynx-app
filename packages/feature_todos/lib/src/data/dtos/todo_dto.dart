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
    required String title,
    @Default('') String description,
    @Default('pending') String status,
    @Default('none') String priority,
    @JsonKey(name: 'project_id') String? projectId,
    @JsonKey(name: 'due_date') String? dueDate,
    @JsonKey(name: 'completed_at') String? completedAt,
    String? rrule,
    @JsonKey(name: 'sort_order') @Default(0) int sortOrder,
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
      title: title,
      description: description,
      status: _parseStatus(status),
      priority: _parsePriority(priority),
      projectId: projectId,
      dueDate: dueDate != null ? DateTime.parse(dueDate!) : null,
      completedAt: completedAt != null ? DateTime.parse(completedAt!) : null,
      rrule: rrule,
      sortOrder: sortOrder,
      createdAt: DateTime.parse(createdAt),
      updatedAt: DateTime.parse(updatedAt),
    );
  }

  static TodoDto fromDomain(Todo todo) {
    return TodoDto(
      id: todo.id,
      title: todo.title,
      description: todo.description,
      status: todo.status.name,
      priority: todo.priority.name,
      projectId: todo.projectId,
      dueDate: todo.dueDate?.toIso8601String(),
      completedAt: todo.completedAt?.toIso8601String(),
      rrule: todo.rrule,
      sortOrder: todo.sortOrder,
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
