import 'package:unjynx_core/utils/result.dart';

import '../entities/todo.dart';
import '../entities/todo_filter.dart';

/// Abstract repository for TODO operations.
///
/// Implementations:
/// - [TodoRepositoryImpl] - combines local + remote datasources
abstract class TodoRepository {
  /// Get all TODOs matching the filter.
  /// When [orgId] is set in the filter, results are scoped to that org.
  Future<Result<List<Todo>>> getAll({TodoFilter? filter});

  /// Get a single TODO by ID.
  Future<Result<Todo>> getById(String id);

  /// Create a new TODO.
  Future<Result<Todo>> create({
    required String title,
    String description,
    TodoPriority priority,
    TodoType taskType,
    String? orgId,
    String? projectId,
    String? assigneeId,
    String? sprintId,
    int? estimatePoints,
    DateTime? dueDate,
    String? rrule,
  });

  /// Update an existing TODO.
  Future<Result<Todo>> update(Todo todo);

  /// Delete a TODO by ID.
  Future<Result<void>> delete(String id);

  /// Mark a TODO as completed.
  Future<Result<Todo>> complete(String id);

  /// Reorder TODOs.
  Future<Result<void>> reorder(List<String> orderedIds);
}
