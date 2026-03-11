import 'package:unjynx_core/utils/result.dart';

import '../entities/todo.dart';
import '../entities/todo_filter.dart';
import '../repositories/todo_repository.dart';

/// Use case: Get filtered list of TODOs.
class GetTodos {
  final TodoRepository _repository;

  const GetTodos(this._repository);

  Future<Result<List<Todo>>> call({TodoFilter? filter}) {
    return _repository.getAll(filter: filter);
  }
}
