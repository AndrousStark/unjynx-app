import 'package:flutter_test/flutter_test.dart';
import 'package:feature_todos/src/data/repositories/todo_repository_impl.dart';
import 'package:feature_todos/src/domain/entities/todo.dart';
import 'package:feature_todos/src/domain/entities/todo_filter.dart';

void main() {
  late TodoRepositoryImpl repository;

  setUp(() {
    repository = TodoRepositoryImpl();
  });

  group('TodoRepositoryImpl', () {
    test('create returns a new todo', () async {
      final result = await repository.create(title: 'Test task');
      expect(result.isOk, isTrue);

      final todo = result.unwrap();
      expect(todo.title, 'Test task');
      expect(todo.status, TodoStatus.pending);
      expect(todo.id, isNotEmpty);
    });

    test('getAll returns all todos', () async {
      await repository.create(title: 'Task 1');
      await repository.create(title: 'Task 2');
      await repository.create(title: 'Task 3');

      final result = await repository.getAll();
      expect(result.unwrap(), hasLength(3));
    });

    test('getAll with filter returns matching todos', () async {
      await repository.create(title: 'Low', priority: TodoPriority.low);
      await repository.create(title: 'High', priority: TodoPriority.high);
      await repository.create(title: 'Low 2', priority: TodoPriority.low);

      final result = await repository.getAll(
        filter: const TodoFilter(priority: TodoPriority.low),
      );

      expect(result.unwrap(), hasLength(2));
    });

    test('getById returns the correct todo', () async {
      final created = (await repository.create(title: 'Find me')).unwrap();
      final result = await repository.getById(created.id);

      expect(result.isOk, isTrue);
      expect(result.unwrap().title, 'Find me');
    });

    test('getById returns error for missing todo', () async {
      final result = await repository.getById('nonexistent');
      expect(result.isErr, isTrue);
    });

    test('update modifies a todo', () async {
      final created = (await repository.create(title: 'Original')).unwrap();
      final updated = created.copyWith(title: 'Updated');

      final result = await repository.update(updated);
      expect(result.unwrap().title, 'Updated');
    });

    test('delete removes a todo', () async {
      final created = (await repository.create(title: 'Delete me')).unwrap();
      final deleteResult = await repository.delete(created.id);

      expect(deleteResult.isOk, isTrue);

      final getResult = await repository.getById(created.id);
      expect(getResult.isErr, isTrue);
    });

    test('complete marks a todo as completed', () async {
      final created = (await repository.create(title: 'Complete me')).unwrap();
      final result = await repository.complete(created.id);

      expect(result.unwrap().status, TodoStatus.completed);
      expect(result.unwrap().completedAt, isNotNull);
    });

    test('search filter works', () async {
      await repository.create(title: 'Buy groceries');
      await repository.create(title: 'Walk the dog');
      await repository.create(title: 'Buy milk');

      final result = await repository.getAll(
        filter: const TodoFilter(searchQuery: 'buy'),
      );

      expect(result.unwrap(), hasLength(2));
    });
  });
}
