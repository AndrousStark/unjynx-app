import 'package:unjynx_core/utils/result.dart';
import 'package:uuid/uuid.dart';

import '../../domain/entities/todo.dart';
import '../../domain/entities/todo_filter.dart';
import '../../domain/repositories/todo_repository.dart';

/// In-memory TODO repository for Phase 1.
///
/// Will be replaced with proper local+remote datasource implementation
/// when Drift and API integration are connected.
class TodoRepositoryImpl implements TodoRepository {
  final _uuid = const Uuid();
  List<Todo> _todos = [];

  @override
  Future<Result<List<Todo>>> getAll({TodoFilter? filter}) async {
    var items = List<Todo>.from(_todos);

    if (filter != null) {
      if (filter.status != null) {
        items = items.where((t) => t.status == filter.status).toList();
      }
      if (filter.priority != null) {
        items = items.where((t) => t.priority == filter.priority).toList();
      }
      if (filter.projectId != null) {
        items = items.where((t) => t.projectId == filter.projectId).toList();
      }
      if (filter.searchQuery != null && filter.searchQuery!.isNotEmpty) {
        final query = filter.searchQuery!.toLowerCase();
        items = items
            .where(
              (t) =>
                  t.title.toLowerCase().contains(query) ||
                  t.description.toLowerCase().contains(query),
            )
            .toList();
      }
      if (filter.dateRange != null) {
        final now = DateTime.now();
        final todayStart = DateTime(now.year, now.month, now.day);
        final tomorrowStart = todayStart.add(const Duration(days: 1));
        items = switch (filter.dateRange!) {
          DateRange.today => items
              .where((t) =>
                  t.dueDate != null &&
                  !t.dueDate!.isBefore(todayStart) &&
                  t.dueDate!.isBefore(tomorrowStart))
              .toList(),
          DateRange.upcoming => items
              .where((t) =>
                  t.dueDate != null &&
                  !t.dueDate!.isBefore(tomorrowStart))
              .toList(),
          DateRange.overdue => items
              .where((t) =>
                  t.dueDate != null &&
                  t.dueDate!.isBefore(todayStart) &&
                  t.status != TodoStatus.completed)
              .toList(),
          DateRange.noDate => items
              .where((t) => t.dueDate == null)
              .toList(),
        };
      }

      items.sort((a, b) => _compareBySort(a, b, filter.sortBy, filter.ascending));
    }

    return Result.ok(items);
  }

  @override
  Future<Result<Todo>> getById(String id) async {
    final index = _todos.indexWhere((t) => t.id == id);
    if (index == -1) {
      return Result.err('TODO not found');
    }
    return Result.ok(_todos[index]);
  }

  @override
  Future<Result<Todo>> create({
    required String title,
    String description = '',
    TodoPriority priority = TodoPriority.none,
    TodoType taskType = TodoType.task,
    String? orgId,
    String? projectId,
    String? assigneeId,
    String? sprintId,
    int? estimatePoints,
    DateTime? dueDate,
    String? rrule,
  }) async {
    final now = DateTime.now().toUtc();
    final todo = Todo(
      id: _uuid.v4(),
      title: title,
      description: description,
      priority: priority,
      projectId: projectId,
      dueDate: dueDate?.toUtc(),
      rrule: rrule,
      sortOrder: _todos.length,
      createdAt: now,
      updatedAt: now,
    );

    _todos = [..._todos, todo];
    return Result.ok(todo);
  }

  @override
  Future<Result<Todo>> update(Todo todo) async {
    final index = _todos.indexWhere((t) => t.id == todo.id);
    if (index == -1) {
      return Result.err('TODO not found');
    }

    _todos = [
      for (var i = 0; i < _todos.length; i++)
        if (i == index) todo else _todos[i],
    ];
    return Result.ok(todo);
  }

  @override
  Future<Result<void>> delete(String id) async {
    final index = _todos.indexWhere((t) => t.id == id);
    if (index == -1) {
      return Result.err('TODO not found');
    }

    _todos = _todos.where((t) => t.id != id).toList();
    return Result.ok(null);
  }

  @override
  Future<Result<Todo>> complete(String id) async {
    final index = _todos.indexWhere((t) => t.id == id);
    if (index == -1) {
      return Result.err('TODO not found');
    }

    final now = DateTime.now().toUtc();
    final completed = _todos[index].copyWith(
      status: TodoStatus.completed,
      completedAt: now,
      updatedAt: now,
    );

    _todos = [
      for (var i = 0; i < _todos.length; i++)
        if (i == index) completed else _todos[i],
    ];
    return Result.ok(completed);
  }

  @override
  Future<Result<void>> reorder(List<String> orderedIds) async {
    final now = DateTime.now().toUtc();
    final idToOrder = {
      for (var i = 0; i < orderedIds.length; i++) orderedIds[i]: i,
    };
    _todos = _todos.map((t) {
      final newOrder = idToOrder[t.id];
      return newOrder != null
          ? t.copyWith(sortOrder: newOrder, updatedAt: now)
          : t;
    }).toList();
    return Result.ok(null);
  }

  int _compareBySort(Todo a, Todo b, TodoSortBy sortBy, bool ascending) {
    final multiplier = ascending ? 1 : -1;
    return switch (sortBy) {
      TodoSortBy.title => a.title.compareTo(b.title) * multiplier,
      TodoSortBy.priority =>
        a.priority.index.compareTo(b.priority.index) * multiplier,
      TodoSortBy.dueDate => _compareDates(a.dueDate, b.dueDate) * multiplier,
      TodoSortBy.createdAt =>
        a.createdAt.compareTo(b.createdAt) * multiplier,
      TodoSortBy.updatedAt =>
        a.updatedAt.compareTo(b.updatedAt) * multiplier,
      TodoSortBy.sortOrder =>
        a.sortOrder.compareTo(b.sortOrder) * multiplier,
    };
  }

  int _compareDates(DateTime? a, DateTime? b) {
    if (a == null && b == null) return 0;
    if (a == null) return 1;
    if (b == null) return -1;
    return a.compareTo(b);
  }
}
