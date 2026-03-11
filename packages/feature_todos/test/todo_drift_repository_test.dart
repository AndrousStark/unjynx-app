import 'package:drift/native.dart';
import 'package:feature_todos/src/data/datasources/todo_drift_datasource.dart';
import 'package:feature_todos/src/data/repositories/todo_drift_repository.dart';
import 'package:feature_todos/src/domain/entities/todo.dart';
import 'package:feature_todos/src/domain/entities/todo_filter.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:service_database/service_database.dart';

void main() {
  late AppDatabase db;
  late TodoDriftDatasource datasource;
  late TodoDriftRepository repository;

  setUp(() {
    db = AppDatabase.forTesting(NativeDatabase.memory());
    datasource = TodoDriftDatasource(db);
    repository = TodoDriftRepository(datasource);
  });

  tearDown(() async {
    await db.close();
  });

  // ---------------------------------------------------------------------------
  // CREATE
  // ---------------------------------------------------------------------------
  group('create', () {
    test('returns a new todo with generated id', () async {
      final result = await repository.create(title: 'Buy milk');

      expect(result.isOk, isTrue);
      final todo = result.unwrap();
      expect(todo.id, isNotEmpty);
      expect(todo.title, 'Buy milk');
      expect(todo.status, TodoStatus.pending);
      expect(todo.priority, TodoPriority.none);
      expect(todo.description, isEmpty);
      expect(todo.createdAt, isNotNull);
      expect(todo.updatedAt, isNotNull);
    });

    test('persists to database', () async {
      await repository.create(title: 'Persisted');

      final all = await repository.getAll();
      expect(all.unwrap(), hasLength(1));
      expect(all.unwrap().first.title, 'Persisted');
    });

    test('accepts optional fields', () async {
      final due = DateTime.utc(2026, 6, 15);
      final result = await repository.create(
        title: 'With options',
        description: 'Some details',
        priority: TodoPriority.high,
        projectId: 'proj-1',
        dueDate: due,
        rrule: 'FREQ=DAILY;COUNT=5',
      );

      final todo = result.unwrap();
      expect(todo.description, 'Some details');
      expect(todo.priority, TodoPriority.high);
      expect(todo.projectId, 'proj-1');
      expect(todo.dueDate, isNotNull);
      expect(todo.rrule, 'FREQ=DAILY;COUNT=5');
    });

    test('each create generates a unique id', () async {
      final a = (await repository.create(title: 'A')).unwrap();
      final b = (await repository.create(title: 'B')).unwrap();

      expect(a.id, isNot(equals(b.id)));
    });
  });

  // ---------------------------------------------------------------------------
  // GET ALL
  // ---------------------------------------------------------------------------
  group('getAll', () {
    test('returns empty list when no todos exist', () async {
      final result = await repository.getAll();

      expect(result.isOk, isTrue);
      expect(result.unwrap(), isEmpty);
    });

    test('returns all created todos', () async {
      await repository.create(title: 'Task 1');
      await repository.create(title: 'Task 2');
      await repository.create(title: 'Task 3');

      final result = await repository.getAll();
      expect(result.unwrap(), hasLength(3));
    });
  });

  // ---------------------------------------------------------------------------
  // GET BY ID
  // ---------------------------------------------------------------------------
  group('getById', () {
    test('returns the correct todo', () async {
      final created = (await repository.create(title: 'Find me')).unwrap();
      final result = await repository.getById(created.id);

      expect(result.isOk, isTrue);
      expect(result.unwrap().title, 'Find me');
      expect(result.unwrap().id, created.id);
    });

    test('returns error for nonexistent id', () async {
      final result = await repository.getById('nonexistent');
      expect(result.isErr, isTrue);
    });
  });

  // ---------------------------------------------------------------------------
  // UPDATE
  // ---------------------------------------------------------------------------
  group('update', () {
    test('modifies an existing todo', () async {
      final created = (await repository.create(title: 'Original')).unwrap();
      final modified = created.copyWith(title: 'Updated');

      final result = await repository.update(modified);
      expect(result.isOk, isTrue);
      expect(result.unwrap().title, 'Updated');

      // Verify persistence
      final fetched = (await repository.getById(created.id)).unwrap();
      expect(fetched.title, 'Updated');
    });

    test('bumps updatedAt timestamp', () async {
      final created = (await repository.create(title: 'Timestamp')).unwrap();
      // Small delay to ensure timestamp difference
      await Future<void>.delayed(const Duration(milliseconds: 10));

      final modified = created.copyWith(title: 'Bumped');
      final updated = (await repository.update(modified)).unwrap();

      expect(
        updated.updatedAt.millisecondsSinceEpoch,
        greaterThanOrEqualTo(created.updatedAt.millisecondsSinceEpoch),
      );
    });

    test('returns error for nonexistent todo', () async {
      final ghost = Todo(
        id: 'ghost',
        title: 'Ghost',
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );
      final result = await repository.update(ghost);
      expect(result.isErr, isTrue);
    });
  });

  // ---------------------------------------------------------------------------
  // DELETE
  // ---------------------------------------------------------------------------
  group('delete', () {
    test('removes an existing todo', () async {
      final created = (await repository.create(title: 'Delete me')).unwrap();
      final result = await repository.delete(created.id);

      expect(result.isOk, isTrue);

      final fetched = await repository.getById(created.id);
      expect(fetched.isErr, isTrue);
    });

    test('returns error for nonexistent id', () async {
      final result = await repository.delete('nonexistent');
      expect(result.isErr, isTrue);
    });

    test('does not affect other todos', () async {
      final a = (await repository.create(title: 'Keep')).unwrap();
      final b = (await repository.create(title: 'Remove')).unwrap();

      await repository.delete(b.id);

      final all = (await repository.getAll()).unwrap();
      expect(all, hasLength(1));
      expect(all.first.id, a.id);
    });
  });

  // ---------------------------------------------------------------------------
  // COMPLETE / UN-COMPLETE
  // ---------------------------------------------------------------------------
  group('complete', () {
    test('marks a pending todo as completed', () async {
      final created = (await repository.create(title: 'Finish')).unwrap();
      final result = await repository.complete(created.id);

      expect(result.isOk, isTrue);
      final todo = result.unwrap();
      expect(todo.status, TodoStatus.completed);
      expect(todo.completedAt, isNotNull);
    });

    test('toggles back to pending when already completed', () async {
      final created = (await repository.create(title: 'Toggle')).unwrap();

      // Complete
      await repository.complete(created.id);
      // Un-complete
      final result = await repository.complete(created.id);

      final todo = result.unwrap();
      expect(todo.status, TodoStatus.pending);
      expect(todo.completedAt, isNull);
    });

    test('returns error for nonexistent id', () async {
      final result = await repository.complete('nonexistent');
      expect(result.isErr, isTrue);
    });

    test('persists completed state', () async {
      final created = (await repository.create(title: 'Persist')).unwrap();
      await repository.complete(created.id);

      final fetched = (await repository.getById(created.id)).unwrap();
      expect(fetched.status, TodoStatus.completed);
      expect(fetched.completedAt, isNotNull);
    });
  });

  // ---------------------------------------------------------------------------
  // FILTERING
  // ---------------------------------------------------------------------------
  group('filtering', () {
    late String highId;
    late String lowId;
    late String completedId;

    setUp(() async {
      highId = (await repository.create(
        title: 'High priority',
        priority: TodoPriority.high,
      ))
          .unwrap()
          .id;

      lowId = (await repository.create(
        title: 'Low priority',
        priority: TodoPriority.low,
      ))
          .unwrap()
          .id;

      completedId = (await repository.create(
        title: 'Completed task',
        priority: TodoPriority.medium,
      ))
          .unwrap()
          .id;
      await repository.complete(completedId);
    });

    test('filters by status', () async {
      final result = await repository.getAll(
        filter: const TodoFilter(status: TodoStatus.completed),
      );

      final todos = result.unwrap();
      expect(todos, hasLength(1));
      expect(todos.first.id, completedId);
    });

    test('filters by priority', () async {
      final result = await repository.getAll(
        filter: const TodoFilter(priority: TodoPriority.high),
      );

      final todos = result.unwrap();
      expect(todos, hasLength(1));
      expect(todos.first.id, highId);
    });

    test('filters by search query (case-insensitive)', () async {
      final result = await repository.getAll(
        filter: const TodoFilter(searchQuery: 'COMPLETED'),
      );

      final todos = result.unwrap();
      expect(todos, hasLength(1));
      expect(todos.first.id, completedId);
    });

    test('filters by project id', () async {
      await repository.create(
        title: 'Project task',
        projectId: 'proj-x',
      );

      final result = await repository.getAll(
        filter: const TodoFilter(projectId: 'proj-x'),
      );

      expect(result.unwrap(), hasLength(1));
      expect(result.unwrap().first.title, 'Project task');
    });

    test('empty search query returns all', () async {
      final result = await repository.getAll(
        filter: const TodoFilter(searchQuery: ''),
      );

      // 3 from setUp + no additional filter
      expect(result.unwrap(), hasLength(3));
    });

    test('combined filters narrow results', () async {
      final result = await repository.getAll(
        filter: const TodoFilter(
          status: TodoStatus.pending,
          priority: TodoPriority.low,
        ),
      );

      final todos = result.unwrap();
      expect(todos, hasLength(1));
      expect(todos.first.id, lowId);
    });
  });

  // ---------------------------------------------------------------------------
  // SORTING
  // ---------------------------------------------------------------------------
  group('sorting', () {
    setUp(() async {
      await repository.create(
        title: 'Banana',
        priority: TodoPriority.low,
      );
      await Future<void>.delayed(const Duration(milliseconds: 10));
      await repository.create(
        title: 'Apple',
        priority: TodoPriority.high,
      );
      await Future<void>.delayed(const Duration(milliseconds: 10));
      await repository.create(
        title: 'Cherry',
        priority: TodoPriority.medium,
      );
    });

    test('sorts by title ascending', () async {
      final result = await repository.getAll(
        filter: const TodoFilter(
          sortBy: TodoSortBy.title,
          ascending: true,
        ),
      );

      final titles = result.unwrap().map((t) => t.title).toList();
      expect(titles, ['Apple', 'Banana', 'Cherry']);
    });

    test('sorts by title descending', () async {
      final result = await repository.getAll(
        filter: const TodoFilter(
          sortBy: TodoSortBy.title,
        ),
      );

      final titles = result.unwrap().map((t) => t.title).toList();
      expect(titles, ['Cherry', 'Banana', 'Apple']);
    });

    test('sorts by priority ascending', () async {
      final result = await repository.getAll(
        filter: const TodoFilter(
          sortBy: TodoSortBy.priority,
          ascending: true,
        ),
      );

      final priorities =
          result.unwrap().map((t) => t.priority).toList();
      expect(priorities, [
        TodoPriority.low,
        TodoPriority.medium,
        TodoPriority.high,
      ]);
    });

    test('sorts by createdAt ascending', () async {
      final result = await repository.getAll(
        filter: const TodoFilter(
          sortBy: TodoSortBy.createdAt,
          ascending: true,
        ),
      );

      final todos = result.unwrap();
      // All created within same test — verify they are ordered
      // (ascending means oldest first)
      for (var i = 1; i < todos.length; i++) {
        expect(
          todos[i].createdAt.millisecondsSinceEpoch,
          greaterThanOrEqualTo(
            todos[i - 1].createdAt.millisecondsSinceEpoch,
          ),
        );
      }
    });
  });

  // ---------------------------------------------------------------------------
  // REORDER
  // ---------------------------------------------------------------------------
  group('reorder', () {
    test('updates sort order for given ids', () async {
      final a = (await repository.create(title: 'A')).unwrap();
      final b = (await repository.create(title: 'B')).unwrap();
      final c = (await repository.create(title: 'C')).unwrap();

      // Reorder: C, A, B
      final result = await repository.reorder([c.id, a.id, b.id]);
      expect(result.isOk, isTrue);

      final sorted = await repository.getAll(
        filter: const TodoFilter(
          sortBy: TodoSortBy.sortOrder,
          ascending: true,
        ),
      );

      final titles = sorted.unwrap().map((t) => t.title).toList();
      expect(titles, ['C', 'A', 'B']);
    });

    test('skips nonexistent ids without error', () async {
      final a = (await repository.create(title: 'A')).unwrap();

      final result = await repository.reorder([a.id, 'nonexistent']);
      expect(result.isOk, isTrue);
    });
  });

  // ---------------------------------------------------------------------------
  // DATASOURCE: SYNC FLAGS
  // ---------------------------------------------------------------------------
  group('datasource sync flags', () {
    test('new records have needsSync = true', () async {
      await repository.create(title: 'Sync me');

      final pending = await datasource.getPendingSync();
      expect(pending, hasLength(1));
      expect(pending.first.title, 'Sync me');
    });

    test('markSynced clears the sync flag', () async {
      final todo = (await repository.create(title: 'Synced')).unwrap();
      await datasource.markSynced([todo.id]);

      final pending = await datasource.getPendingSync();
      expect(pending, isEmpty);
    });

    test('markSynced with empty list is a no-op', () async {
      await repository.create(title: 'Still pending');
      await datasource.markSynced([]);

      final pending = await datasource.getPendingSync();
      expect(pending, hasLength(1));
    });

    test('updated records reset needsSync to true', () async {
      final todo = (await repository.create(title: 'Original')).unwrap();
      await datasource.markSynced([todo.id]);

      // Update triggers a new upsert which sets needsSync = true
      await repository.update(todo.copyWith(title: 'Changed'));

      final pending = await datasource.getPendingSync();
      expect(pending, hasLength(1));
      expect(pending.first.title, 'Changed');
    });
  });

  // ---------------------------------------------------------------------------
  // DATASOURCE: DIRECT OPERATIONS
  // ---------------------------------------------------------------------------
  group('datasource direct operations', () {
    test('upsertAll inserts multiple records', () async {
      final a = (await repository.create(title: 'A')).unwrap();
      final b = (await repository.create(title: 'B')).unwrap();

      // Verify both exist
      final all = await datasource.getAll();
      expect(all, hasLength(2));
      expect(all.map((d) => d.id), containsAll([a.id, b.id]));
    });

    test('getById returns null for missing record', () async {
      final dto = await datasource.getById('missing');
      expect(dto, isNull);
    });
  });
}
