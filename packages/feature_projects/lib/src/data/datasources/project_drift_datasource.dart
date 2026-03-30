import 'package:drift/drift.dart';
import 'package:service_database/service_database.dart';
import 'package:unjynx_core/models/project.dart';

/// Drift-backed datasource for project persistence.
class ProjectDriftDatasource {
  final AppDatabase _db;

  const ProjectDriftDatasource(this._db);

  /// Get all projects, optionally including archived ones.
  Future<List<Project>> getAll({bool includeArchived = false}) async {
    final query = _db.select(_db.localProjects);
    if (!includeArchived) {
      query.where((p) => p.isArchived.equals(false));
    }
    query.orderBy([
      (p) => OrderingTerm.asc(p.sortOrder),
      (p) => OrderingTerm.desc(p.createdAt),
    ]);

    final rows = await query.get();
    return rows.map(_toProject).toList();
  }

  /// Get a single project by ID.
  Future<Project?> getById(String id) async {
    final query = _db.select(_db.localProjects)
      ..where((p) => p.id.equals(id));

    final row = await query.getSingleOrNull();
    return row == null ? null : _toProject(row);
  }

  /// Insert a new project.
  Future<void> insert(LocalProjectsCompanion companion) {
    return _db.into(_db.localProjects).insert(companion);
  }

  /// Update an existing project.
  Future<void> update(String id, LocalProjectsCompanion companion) {
    return (_db.update(_db.localProjects)
          ..where((p) => p.id.equals(id)))
        .write(companion);
  }

  /// Archive a project by ID.
  Future<void> archive(String id) {
    return (_db.update(_db.localProjects)
          ..where((p) => p.id.equals(id)))
        .write(
      LocalProjectsCompanion(
        isArchived: const Value(true),
        updatedAt: Value(DateTime.now()),
        needsSync: const Value(true),
      ),
    );
  }

  /// Batch update sort orders.
  Future<void> reorder(List<String> orderedIds) async {
    await _db.transaction(() async {
      for (var i = 0; i < orderedIds.length; i++) {
        await (_db.update(_db.localProjects)
              ..where((p) => p.id.equals(orderedIds[i])))
            .write(
          LocalProjectsCompanion(
            sortOrder: Value(i),
            updatedAt: Value(DateTime.now()),
            needsSync: const Value(true),
          ),
        );
      }
    });
  }

  /// Get projects with pending sync changes.
  Future<List<LocalProject>> getPendingSync() async {
    final query = _db.select(_db.localProjects)
      ..where((p) => p.needsSync.equals(true));
    return query.get();
  }

  /// Mark projects as synced.
  Future<void> markSynced(List<String> ids) async {
    if (ids.isEmpty) return;
    await (_db.update(_db.localProjects)
          ..where((p) => p.id.isIn(ids)))
        .write(const LocalProjectsCompanion(needsSync: Value(false)));
  }

  /// Count active (non-completed) tasks in a project.
  Future<int> taskCount(String projectId) async {
    // Simpler approach: just count non-completed tasks
    final countQuery = _db.selectOnly(_db.localTasks)
      ..addColumns([_db.localTasks.id.count()])
      ..where(
        _db.localTasks.projectId.equals(projectId) &
            _db.localTasks.status.isNotIn(['completed', 'cancelled']),
      );

    final result = await countQuery.getSingle();
    return result.read(_db.localTasks.id.count()) ?? 0;
  }

  Project _toProject(LocalProject row) {
    return Project(
      id: row.id,
      userId: '', // Local-only for now, no user context
      name: row.name,
      description: row.description,
      color: row.color,
      icon: row.icon,
      isArchived: row.isArchived,
      sortOrder: row.sortOrder,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    );
  }
}
