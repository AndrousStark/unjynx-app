import 'package:unjynx_core/utils/result.dart';

import '../entities/todo.dart';
import '../repositories/todo_repository.dart';

/// Use case: Create a new TODO.
class CreateTodo {
  final TodoRepository _repository;

  const CreateTodo(this._repository);

  Future<Result<Todo>> call({
    required String title,
    String description = '',
    TodoPriority priority = TodoPriority.none,
    String? projectId,
    DateTime? dueDate,
    String? rrule,
  }) {
    if (title.trim().isEmpty) {
      return Future.value(Result.err('Title cannot be empty'));
    }

    return _repository.create(
      title: title.trim(),
      description: description.trim(),
      priority: priority,
      projectId: projectId,
      dueDate: dueDate,
      rrule: rrule,
    );
  }
}
