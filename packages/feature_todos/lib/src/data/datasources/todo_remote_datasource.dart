import '../dtos/todo_dto.dart';

/// Remote data source for TODOs (Hono API server).
///
/// All operations require authentication and go through
/// the API envelope format.
abstract class TodoRemoteDatasource {
  /// Fetch all TODOs from the API.
  Future<List<TodoDto>> getAll({
    int page = 1,
    int limit = 20,
    String? status,
    String? priority,
    String? projectId,
  });

  /// Fetch a single TODO by ID.
  Future<TodoDto> getById(String id);

  /// Create a new TODO.
  Future<TodoDto> create(Map<String, dynamic> data);

  /// Update an existing TODO.
  Future<TodoDto> update(String id, Map<String, dynamic> data);

  /// Delete a TODO.
  Future<void> delete(String id);
}
