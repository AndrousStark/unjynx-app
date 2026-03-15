import 'package:unjynx_core/utils/result.dart';

import '../repositories/todo_repository.dart';

/// Use case: Delete a TODO by ID.
class DeleteTodo {
  final TodoRepository _repository;

  const DeleteTodo(this._repository);

  Future<Result<void>> call(String id) {
    if (id.isEmpty) {
      return Future.value(Result.err('Invalid TODO ID'));
    }

    return _repository.delete(id);
  }
}
