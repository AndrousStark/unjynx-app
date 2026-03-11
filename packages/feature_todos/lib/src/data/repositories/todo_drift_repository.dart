import 'package:feature_todos/src/data/datasources/todo_drift_datasource.dart';
import 'package:feature_todos/src/data/dtos/todo_dto.dart';
import 'package:feature_todos/src/domain/entities/todo.dart';
import 'package:feature_todos/src/domain/entities/todo_filter.dart';
import 'package:feature_todos/src/domain/repositories/todo_repository.dart';
import 'package:unjynx_core/utils/result.dart';
import 'package:uuid/uuid.dart';

/// Drift-backed implementation of [TodoRepository].
///
/// Persists all TODO data to SQLite via [TodoDriftDatasource].
/// Filtering and sorting use in-memory operations on the
/// fetched result set — Drift handles persistence, Dart handles
/// presentation logic.
class TodoDriftRepository implements TodoRepository {
  TodoDriftRepository(this._datasource);

  final TodoDriftDatasource _datasource;
  static const _uuid = Uuid();

  @override
  Future<Result<List<Todo>>> getAll({TodoFilter? filter}) async {
    try {
      final dtos = await _datasource.getAll();
      var todos = dtos.map((dto) => dto.toDomain()).toList();

      if (filter != null) {
        todos = _applyFilter(todos, filter);
      }

      return Result.ok(todos);
    } on Exception catch (e) {
      return Result.err('Failed to fetch todos', e);
    }
  }

  @override
  Future<Result<Todo>> getById(String id) async {
    try {
      final dto = await _datasource.getById(id);
      if (dto == null) {
        return Result.err('Todo not found: $id');
      }
      return Result.ok(dto.toDomain());
    } on Exception catch (e) {
      return Result.err('Failed to fetch todo', e);
    }
  }

  @override
  Future<Result<Todo>> create({
    required String title,
    String description = '',
    TodoPriority priority = TodoPriority.none,
    String? projectId,
    DateTime? dueDate,
    String? rrule,
  }) async {
    try {
      final now = DateTime.now().toUtc();
      final dto = TodoDto(
        id: _uuid.v4(),
        title: title,
        description: description,
        priority: priority.name,
        projectId: projectId,
        dueDate: dueDate?.toUtc().toIso8601String(),
        rrule: rrule,
        createdAt: now.toIso8601String(),
        updatedAt: now.toIso8601String(),
      );

      await _datasource.upsert(dto);
      return Result.ok(dto.toDomain());
    } on Exception catch (e) {
      return Result.err('Failed to create todo', e);
    }
  }

  @override
  Future<Result<Todo>> update(Todo todo) async {
    try {
      final existing = await _datasource.getById(todo.id);
      if (existing == null) {
        return Result.err('Todo not found: ${todo.id}');
      }

      final updated = todo.copyWith(updatedAt: DateTime.now().toUtc());
      await _datasource.upsert(TodoMapper.fromDomain(updated));
      return Result.ok(updated);
    } on Exception catch (e) {
      return Result.err('Failed to update todo', e);
    }
  }

  @override
  Future<Result<void>> delete(String id) async {
    try {
      final existing = await _datasource.getById(id);
      if (existing == null) {
        return Result.err('Todo not found: $id');
      }

      await _datasource.delete(id);
      return Result.ok(null);
    } on Exception catch (e) {
      return Result.err('Failed to delete todo', e);
    }
  }

  @override
  Future<Result<Todo>> complete(String id) async {
    try {
      final existing = await _datasource.getById(id);
      if (existing == null) {
        return Result.err('Todo not found: $id');
      }

      final now = DateTime.now().toUtc();
      final todo = existing.toDomain();
      final isAlreadyCompleted = todo.status == TodoStatus.completed;

      final updated = todo.copyWith(
        status:
            isAlreadyCompleted ? TodoStatus.pending : TodoStatus.completed,
        completedAt: isAlreadyCompleted ? null : now,
        updatedAt: now,
      );

      await _datasource.upsert(TodoMapper.fromDomain(updated));
      return Result.ok(updated);
    } on Exception catch (e) {
      return Result.err('Failed to complete todo', e);
    }
  }

  @override
  Future<Result<void>> reorder(List<String> orderedIds) async {
    try {
      final now = DateTime.now().toUtc();
      final dtos = <TodoDto>[];

      for (var i = 0; i < orderedIds.length; i++) {
        final existing = await _datasource.getById(orderedIds[i]);
        if (existing != null) {
          dtos.add(existing.copyWith(
            sortOrder: i,
            updatedAt: now.toIso8601String(),
          ));
        }
      }

      await _datasource.upsertAll(dtos);
      return Result.ok(null);
    } on Exception catch (e) {
      return Result.err('Failed to reorder todos', e);
    }
  }

  List<Todo> _applyFilter(List<Todo> todos, TodoFilter filter) {
    var result = todos;

    if (filter.status != null) {
      result = result.where((t) => t.status == filter.status).toList();
    }
    if (filter.priority != null) {
      result =
          result.where((t) => t.priority == filter.priority).toList();
    }
    if (filter.projectId != null) {
      result =
          result.where((t) => t.projectId == filter.projectId).toList();
    }
    if (filter.searchQuery case final query?
        when query.isNotEmpty) {
      final lowerQuery = query.toLowerCase();
      result = result
          .where(
            (t) =>
                t.title.toLowerCase().contains(lowerQuery) ||
                t.description.toLowerCase().contains(lowerQuery),
          )
          .toList();
    }

    result.sort(
      (a, b) => _compareBySort(a, b, filter.sortBy, filter.ascending),
    );
    return result;
  }

  int _compareBySort(
    Todo a,
    Todo b,
    TodoSortBy sortBy,
    bool ascending,
  ) {
    final multiplier = ascending ? 1 : -1;
    return switch (sortBy) {
      TodoSortBy.title => a.title.compareTo(b.title) * multiplier,
      TodoSortBy.priority =>
        a.priority.index.compareTo(b.priority.index) * multiplier,
      TodoSortBy.dueDate =>
        _compareDates(a.dueDate, b.dueDate) * multiplier,
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
