import 'package:unjynx_core/utils/result.dart';

import '../entities/todo.dart';
import '../repositories/todo_repository.dart';

/// Use case: Mark a TODO as completed.
class CompleteTodo {
  final TodoRepository _repository;

  const CompleteTodo(this._repository);

  Future<Result<Todo>> call(String id) {
    if (id.isEmpty) {
      return Future.value(Result.err('Invalid TODO ID'));
    }

    return _repository.complete(id);
  }
}
