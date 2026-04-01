import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:feature_todos/src/domain/entities/todo.dart';
import 'package:feature_todos/src/domain/entities/todo_filter.dart';
import 'package:feature_todos/src/domain/repositories/todo_repository.dart';
import 'package:feature_todos/src/presentation/providers/todo_providers.dart';
import 'package:unjynx_core/utils/result.dart';

/// Minimal fake repository for testing filter integration.
class _FakeTodoRepository implements TodoRepository {
  final List<Todo> _todos;

  _FakeTodoRepository(this._todos);

  @override
  Future<Result<List<Todo>>> getAll({TodoFilter? filter}) async {
    var items = List<Todo>.from(_todos);
    final query = filter?.searchQuery?.toLowerCase();
    if (query != null && query.isNotEmpty) {
      items = items
          .where((t) =>
              t.title.toLowerCase().contains(query) ||
              t.description.toLowerCase().contains(query))
          .toList();
    }
    if (filter?.status != null) {
      items = items.where((t) => t.status == filter!.status).toList();
    }
    if (filter?.priority != null) {
      items = items.where((t) => t.priority == filter!.priority).toList();
    }
    return Result.ok(items);
  }

  @override
  Future<Result<Todo>> getById(String id) async {
    final found = _todos.where((t) => t.id == id);
    if (found.isEmpty) return Result.err('Not found');
    return Result.ok(found.first);
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
    return Result.err('Not implemented in fake');
  }

  @override
  Future<Result<Todo>> update(Todo todo) async {
    return Result.err('Not implemented in fake');
  }

  @override
  Future<Result<void>> delete(String id) async {
    return Result.err('Not implemented in fake');
  }

  @override
  Future<Result<Todo>> complete(String id) async {
    return Result.err('Not implemented in fake');
  }

  @override
  Future<Result<void>> reorder(List<String> orderedIds) async {
    return Result.err('Not implemented in fake');
  }
}

final _now = DateTime.now();

final _sampleTodos = [
  Todo(
    id: 'todo-1',
    title: 'Buy groceries',
    description: 'Milk, eggs, bread',
    status: TodoStatus.pending,
    priority: TodoPriority.medium,
    createdAt: _now,
    updatedAt: _now,
  ),
  Todo(
    id: 'todo-2',
    title: 'Write tests',
    description: 'Unit tests for search',
    status: TodoStatus.pending,
    priority: TodoPriority.high,
    createdAt: _now,
    updatedAt: _now,
  ),
  Todo(
    id: 'todo-3',
    title: 'Review PR',
    description: '',
    status: TodoStatus.completed,
    priority: TodoPriority.none,
    createdAt: _now,
    updatedAt: _now,
  ),
];

void main() {
  group('Search filter integration', () {
    late ProviderContainer container;

    setUp(() {
      container = ProviderContainer(
        overrides: [
          todoRepositoryProvider
              .overrideWithValue(_FakeTodoRepository(_sampleTodos)),
        ],
      );
    });

    tearDown(() => container.dispose());

    test('returns all todos with no filter', () async {
      final todos = await container.read(todoListProvider.future);

      expect(todos, hasLength(3));
    });

    test('filters by searchQuery on title', () async {
      container.read(todoFilterProvider.notifier).set(
        const TodoFilter(searchQuery: 'groceries'),
      );

      final todos = await container.read(todoListProvider.future);

      expect(todos, hasLength(1));
      expect(todos.first.title, 'Buy groceries');
    });

    test('filters by searchQuery on description', () async {
      container.read(todoFilterProvider.notifier).set(
        const TodoFilter(searchQuery: 'unit tests'),
      );

      final todos = await container.read(todoListProvider.future);

      expect(todos, hasLength(1));
      expect(todos.first.title, 'Write tests');
    });

    test('search is case-insensitive', () async {
      container.read(todoFilterProvider.notifier).set(
        const TodoFilter(searchQuery: 'BUY'),
      );

      final todos = await container.read(todoListProvider.future);

      expect(todos, hasLength(1));
      expect(todos.first.title, 'Buy groceries');
    });

    test('empty search returns all todos', () async {
      container.read(todoFilterProvider.notifier).set(
        const TodoFilter(searchQuery: ''),
      );

      final todos = await container.read(todoListProvider.future);

      expect(todos, hasLength(3));
    });

    test('null search returns all todos', () async {
      container.read(todoFilterProvider.notifier).set(const TodoFilter());

      final todos = await container.read(todoListProvider.future);

      expect(todos, hasLength(3));
    });

    test('no results for non-matching query', () async {
      container.read(todoFilterProvider.notifier).set(
        const TodoFilter(searchQuery: 'xyznonexistent'),
      );

      final todos = await container.read(todoListProvider.future);

      expect(todos, isEmpty);
    });

    test('combined search and status filter', () async {
      container.read(todoFilterProvider.notifier).set(const TodoFilter(
        searchQuery: 'review',
        status: TodoStatus.completed,
      ));

      final todos = await container.read(todoListProvider.future);

      expect(todos, hasLength(1));
      expect(todos.first.title, 'Review PR');
    });

    test('combined search and status with no match', () async {
      container.read(todoFilterProvider.notifier).set(const TodoFilter(
        searchQuery: 'groceries',
        status: TodoStatus.completed,
      ));

      final todos = await container.read(todoListProvider.future);

      expect(todos, isEmpty);
    });

    test('clearing search restores full list', () async {
      // First, apply a search
      container.read(todoFilterProvider.notifier).set(
        const TodoFilter(searchQuery: 'groceries'),
      );

      var todos = await container.read(todoListProvider.future);
      expect(todos, hasLength(1));

      // Clear the search
      container.read(todoFilterProvider.notifier).set(const TodoFilter());

      todos = await container.read(todoListProvider.future);
      expect(todos, hasLength(3));
    });
  });
}
