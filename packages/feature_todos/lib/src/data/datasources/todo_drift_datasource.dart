import 'package:drift/drift.dart';
import 'package:feature_todos/src/data/datasources/todo_local_datasource.dart';
import 'package:feature_todos/src/data/dtos/todo_dto.dart';
import 'package:service_database/service_database.dart';

/// Drift (SQLite) implementation of [TodoLocalDatasource].
///
/// Uses Drift's type-safe query API for all operations.
/// Every write sets `needsSync = true` so the sync engine
/// knows which records to push to the server.
class TodoDriftDatasource implements TodoLocalDatasource {
  TodoDriftDatasource(this._db);

  final AppDatabase _db;

  @override
  Future<List<TodoDto>> getAll() async {
    final rows = await _db.select(_db.localTasks).get();
    return rows.map(_rowToDto).toList();
  }

  @override
  Future<TodoDto?> getById(String id) async {
    final query = _db.select(_db.localTasks)
      ..where((t) => t.id.equals(id));
    final row = await query.getSingleOrNull();
    return row == null ? null : _rowToDto(row);
  }

  @override
  Future<void> upsert(TodoDto dto) async {
    await _db.into(_db.localTasks).insertOnConflictUpdate(
          _dtoToRow(dto),
        );
  }

  @override
  Future<void> upsertAll(List<TodoDto> dtos) async {
    await _db.batch((batch) {
      batch.insertAllOnConflictUpdate(
        _db.localTasks,
        dtos.map(_dtoToRow).toList(),
      );
    });
  }

  @override
  Future<void> delete(String id) async {
    await (_db.delete(_db.localTasks)
          ..where((t) => t.id.equals(id)))
        .go();
  }

  @override
  Future<List<TodoDto>> getPendingSync() async {
    final query = _db.select(_db.localTasks)
      ..where((t) => t.needsSync.equals(true));
    final rows = await query.get();
    return rows.map(_rowToDto).toList();
  }

  /// Mark records as synced after successful push to server.
  Future<void> markSynced(List<String> ids) async {
    if (ids.isEmpty) return;
    await (_db.update(_db.localTasks)
          ..where((t) => t.id.isIn(ids)))
        .write(const LocalTasksCompanion(needsSync: Value(false)));
  }
}

TodoDto _rowToDto(LocalTask row) {
  return TodoDto(
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status,
    priority: row.priority,
    projectId: row.projectId,
    dueDate: row.dueDate?.toIso8601String(),
    completedAt: row.completedAt?.toIso8601String(),
    rrule: row.rrule,
    sortOrder: row.sortOrder,
    createdAt: row.createdAt.toIso8601String(),
    updatedAt: row.updatedAt.toIso8601String(),
  );
}

LocalTask _dtoToRow(TodoDto dto) {
  return LocalTask(
    id: dto.id,
    title: dto.title,
    description: dto.description,
    status: dto.status,
    priority: dto.priority,
    projectId: dto.projectId,
    dueDate: dto.dueDate != null ? DateTime.parse(dto.dueDate!) : null,
    completedAt:
        dto.completedAt != null ? DateTime.parse(dto.completedAt!) : null,
    rrule: dto.rrule,
    sortOrder: dto.sortOrder,
    createdAt: DateTime.parse(dto.createdAt),
    updatedAt: DateTime.parse(dto.updatedAt),
    needsSync: true,
  );
}
