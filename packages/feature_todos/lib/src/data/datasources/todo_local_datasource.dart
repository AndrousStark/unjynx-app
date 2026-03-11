import '../dtos/todo_dto.dart';

/// Local data source for TODOs (Drift database).
///
/// Provides offline-first data access. Data syncs to remote
/// when connectivity is available.
abstract class TodoLocalDatasource {
  /// Get all TODOs from local storage.
  Future<List<TodoDto>> getAll();

  /// Get a TODO by ID from local storage.
  Future<TodoDto?> getById(String id);

  /// Insert or replace a TODO in local storage.
  Future<void> upsert(TodoDto dto);

  /// Insert or replace multiple TODOs.
  Future<void> upsertAll(List<TodoDto> dtos);

  /// Delete a TODO from local storage.
  Future<void> delete(String id);

  /// Get TODOs that need syncing (modified since last sync).
  Future<List<TodoDto>> getPendingSync();
}
