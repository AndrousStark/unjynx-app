import 'dart:async';

import 'package:feature_todos/src/data/datasources/todo_drift_datasource.dart';
import 'package:feature_todos/src/data/dtos/todo_dto.dart';
import 'package:feature_todos/src/domain/entities/todo.dart';
import 'package:feature_todos/src/domain/entities/todo_filter.dart';
import 'package:feature_todos/src/domain/repositories/todo_repository.dart';
import 'package:service_api/service_api.dart';
import 'package:unjynx_core/events/event_bus.dart';
import 'package:unjynx_core/events/app_events.dart';
import 'package:unjynx_core/utils/result.dart';
import 'package:uuid/uuid.dart';

/// Offline-first [TodoRepository] that wraps [TodoDriftDatasource] (local)
/// and [TaskApiService] (remote).
///
/// Every read returns data from the local Drift database immediately.
/// Writes go to Drift first, then fire-and-forget to the API in the
/// background. If the API call fails (network down, server error, etc.),
/// the record stays marked `needsSync=true` and the sync engine will
/// retry later.
///
/// When [_taskApi] is null, this behaves identically to
/// [TodoDriftRepository] (pure local mode).
class TodoSyncRepository implements TodoRepository {
  TodoSyncRepository(this._datasource, this._taskApi, {EventBus? eventBus})
      : _eventBus = eventBus;

  final TodoDriftDatasource _datasource;
  final TaskApiService? _taskApi;
  final EventBus? _eventBus;
  static const _uuid = Uuid();

  // ---------------------------------------------------------------------------
  // Reads
  // ---------------------------------------------------------------------------

  @override
  Future<Result<List<Todo>>> getAll({TodoFilter? filter}) async {
    try {
      final dtos = await _datasource.getAll();
      var todos = dtos.map((dto) => dto.toDomain()).toList();

      if (filter != null) {
        todos = _applyFilter(todos, filter);
      }

      // Background: pull latest from API and upsert into Drift.
      _backgroundFetchAll();

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

  // ---------------------------------------------------------------------------
  // Writes
  // ---------------------------------------------------------------------------

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
    try {
      final now = DateTime.now().toUtc();
      final id = _uuid.v4();

      final dto = TodoDto(
        id: id,
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
      _eventBus?.publish(TaskCreated(taskId: id, title: title, dueDate: dueDate));

      // Fire-and-forget push to API.
      _backgroundCreateTask(id, dto);

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
      _eventBus?.publish(TaskUpdated(taskId: todo.id, changes: {'title': todo.title}));

      // Fire-and-forget push to API.
      _backgroundUpdateTask(updated);

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
      _eventBus?.publish(TaskDeleted(taskId: id));

      // Fire-and-forget delete on API.
      _backgroundDeleteTask(id);

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
      if (!isAlreadyCompleted) {
        _eventBus?.publish(TaskCompleted(taskId: id, title: todo.title));
      } else {
        _eventBus?.publish(TaskUpdated(taskId: id, changes: {'status': 'pending'}));
      }

      // Fire-and-forget complete/uncomplete on API.
      _backgroundCompleteTask(id, isAlreadyCompleted);

      return Result.ok(updated);
    } on Exception catch (e) {
      return Result.err('Failed to complete todo', e);
    }
  }

  @override
  Future<Result<void>> reorder(List<String> orderedIds) async {
    // Reorder is local-only UX; not synced to server individually.
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

  // ---------------------------------------------------------------------------
  // Background API operations (fire-and-forget)
  // ---------------------------------------------------------------------------

  void _backgroundFetchAll() {
    final api = _taskApi;
    if (api == null) return;

    unawaited(() async {
      try {
        final response = await api.getTasks(limit: 200);
        if (response.success && response.data != null) {
          final remoteDtos = response.data!
              .whereType<Map<String, dynamic>>()
              .map(_apiJsonToDto)
              .toList();

          if (remoteDtos.isNotEmpty) {
            await _datasource.upsertAll(remoteDtos);
            // Mark API-sourced records as synced since they came from server.
            await _datasource.markSynced(
              remoteDtos.map((d) => d.id).toList(),
            );
          }
        }
      } on Exception catch (_) {
        // Silently ignore — sync engine will reconcile later.
      }
    }());
  }

  void _backgroundCreateTask(String id, TodoDto dto) {
    final api = _taskApi;
    if (api == null) return;

    unawaited(() async {
      try {
        await api.createTask({
          'id': dto.id,
          'title': dto.title,
          'description': dto.description,
          'priority': dto.priority,
          if (dto.projectId != null) 'projectId': dto.projectId,
          if (dto.dueDate != null) 'dueDate': dto.dueDate,
          if (dto.rrule != null) 'rrule': dto.rrule,
        });
        await _datasource.markSynced([id]);
      } on Exception catch (_) {
        // Stays needsSync=true; sync engine handles later.
      }
    }());
  }

  void _backgroundUpdateTask(Todo todo) {
    final api = _taskApi;
    if (api == null) return;

    unawaited(() async {
      try {
        await api.updateTask(todo.id, {
          'title': todo.title,
          'description': todo.description,
          'priority': todo.priority.name,
          'status': todo.status.name == 'inProgress'
              ? 'in_progress'
              : todo.status.name,
          if (todo.projectId != null) 'projectId': todo.projectId,
          if (todo.dueDate != null)
            'dueDate': todo.dueDate!.toIso8601String(),
          if (todo.rrule != null) 'rrule': todo.rrule,
        });
        await _datasource.markSynced([todo.id]);
      } on Exception catch (_) {
        // Stays needsSync=true; sync engine handles later.
      }
    }());
  }

  void _backgroundDeleteTask(String id) {
    final api = _taskApi;
    if (api == null) return;

    unawaited(() async {
      try {
        await api.deleteTask(id);
      } on Exception catch (_) {
        // Best-effort; if offline, server still has the record
        // but it will be cleaned up on next full sync.
      }
    }());
  }

  void _backgroundCompleteTask(String id, bool wasAlreadyCompleted) {
    final api = _taskApi;
    if (api == null) return;

    unawaited(() async {
      try {
        if (wasAlreadyCompleted) {
          await api.uncompleteTask(id);
        } else {
          await api.completeTask(id);
        }
        await _datasource.markSynced([id]);
      } on Exception catch (_) {
        // Stays needsSync=true; sync engine handles later.
      }
    }());
  }

  // ---------------------------------------------------------------------------
  // API JSON -> DTO mapping
  // ---------------------------------------------------------------------------

  /// Convert a raw API JSON map into a [TodoDto].
  ///
  /// The API may use snake_case keys; TodoDto.fromJson handles that via
  /// @JsonKey annotations, so we delegate to the generated factory.
  TodoDto _apiJsonToDto(Map<String, dynamic> json) {
    return TodoDto.fromJson(json);
  }

  // ---------------------------------------------------------------------------
  // Filter & sort (identical to TodoDriftRepository)
  // ---------------------------------------------------------------------------

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
    if (filter.dateRange != null) {
      final now = DateTime.now();
      final todayStart = DateTime(now.year, now.month, now.day);
      final tomorrowStart = todayStart.add(const Duration(days: 1));
      result = switch (filter.dateRange!) {
        DateRange.today => result
            .where((t) =>
                t.dueDate != null &&
                !t.dueDate!.isBefore(todayStart) &&
                t.dueDate!.isBefore(tomorrowStart))
            .toList(),
        DateRange.upcoming => result
            .where((t) =>
                t.dueDate != null &&
                !t.dueDate!.isBefore(tomorrowStart))
            .toList(),
        DateRange.overdue => result
            .where((t) =>
                t.dueDate != null &&
                t.dueDate!.isBefore(todayStart) &&
                t.status != TodoStatus.completed)
            .toList(),
        DateRange.noDate => result
            .where((t) => t.dueDate == null)
            .toList(),
      };
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
