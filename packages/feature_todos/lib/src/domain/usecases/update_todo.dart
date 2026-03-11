import 'package:unjynx_core/utils/result.dart';

import '../entities/todo.dart';
import '../repositories/todo_repository.dart';

/// Use case: Update an existing TODO.
class UpdateTodo {
  final TodoRepository _repository;

  const UpdateTodo(this._repository);

  Future<Result<Todo>> call(Todo todo) {
    if (todo.title.trim().isEmpty) {
      return Future.value(Result.err('Title cannot be empty'));
    }

    final updated = todo.copyWith(
      title: todo.title.trim(),
      description: todo.description.trim(),
      updatedAt: DateTime.now(),
    );

    return _repository.update(updated);
  }
}
