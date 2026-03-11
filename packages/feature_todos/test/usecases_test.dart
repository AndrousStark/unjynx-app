import 'package:flutter_test/flutter_test.dart';
import 'package:feature_todos/src/data/repositories/todo_repository_impl.dart';
import 'package:feature_todos/src/domain/usecases/create_todo.dart';
import 'package:feature_todos/src/domain/usecases/complete_todo.dart';
import 'package:feature_todos/src/domain/usecases/delete_todo.dart';
import 'package:feature_todos/src/domain/usecases/get_todos.dart';
import 'package:feature_todos/src/domain/entities/todo.dart';

void main() {
  late TodoRepositoryImpl repository;

  setUp(() {
    repository = TodoRepositoryImpl();
  });

  group('CreateTodo', () {
    test('creates a todo with valid title', () async {
      final useCase = CreateTodo(repository);
      final result = await useCase(title: 'New task');

      expect(result.isOk, isTrue);
      expect(result.unwrap().title, 'New task');
    });

    test('rejects empty title', () async {
      final useCase = CreateTodo(repository);
      final result = await useCase(title: '   ');

      expect(result.isErr, isTrue);
    });

    test('trims whitespace from title', () async {
      final useCase = CreateTodo(repository);
      final result = await useCase(title: '  Buy milk  ');

      expect(result.unwrap().title, 'Buy milk');
    });
  });

  group('CompleteTodo', () {
    test('marks todo as completed', () async {
      final create = CreateTodo(repository);
      final complete = CompleteTodo(repository);

      final created = (await create(title: 'Do something')).unwrap();
      final result = await complete(created.id);

      expect(result.unwrap().status, TodoStatus.completed);
    });

    test('rejects empty id', () async {
      final useCase = CompleteTodo(repository);
      final result = await useCase('');

      expect(result.isErr, isTrue);
    });
  });

  group('DeleteTodo', () {
    test('deletes existing todo', () async {
      final create = CreateTodo(repository);
      final delete = DeleteTodo(repository);
      final getTodos = GetTodos(repository);

      final created = (await create(title: 'Temp task')).unwrap();
      await delete(created.id);

      final all = (await getTodos()).unwrap();
      expect(all, isEmpty);
    });
  });

  group('GetTodos', () {
    test('returns empty list initially', () async {
      final useCase = GetTodos(repository);
      final result = await useCase();

      expect(result.unwrap(), isEmpty);
    });
  });
}
