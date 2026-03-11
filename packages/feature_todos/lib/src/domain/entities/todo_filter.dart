import 'package:freezed_annotation/freezed_annotation.dart';

import 'todo.dart';

part 'todo_filter.freezed.dart';

/// Date range presets for filtering tasks.
enum DateRange {
  today,
  upcoming,
  overdue,
  noDate,
}

/// Immutable filter criteria for querying TODOs.
@freezed
abstract class TodoFilter with _$TodoFilter {
  const factory TodoFilter({
    TodoStatus? status,
    TodoPriority? priority,
    String? projectId,
    String? searchQuery,
    DateRange? dateRange,
    @Default(TodoSortBy.createdAt) TodoSortBy sortBy,
    @Default(false) bool ascending,
  }) = _TodoFilter;
}

/// Sort options for TODO lists.
enum TodoSortBy {
  createdAt,
  updatedAt,
  dueDate,
  priority,
  title,
  sortOrder,
}
