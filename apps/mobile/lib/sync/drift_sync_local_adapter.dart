import 'package:drift/drift.dart';
import 'package:service_database/service_database.dart';
import 'package:service_sync/service_sync.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Drift-backed implementation of [SyncLocalPort].
///
/// Reads pending tasks from the local Drift database, converts them
/// to [SyncRecord]s for the [SyncEngine], and writes merged records
/// back after conflict resolution.
///
/// Uses [SharedPreferences] for lightweight last-sync-timestamp storage
/// (one key per entity type).
class DriftSyncLocalAdapter implements SyncLocalPort {
  final AppDatabase _db;
  final SharedPreferences _prefs;

  /// Prefix for SharedPreferences keys storing last sync timestamps.
  static const _syncTimestampPrefix = 'sync_last_';

  const DriftSyncLocalAdapter(this._db, this._prefs);

  // ---------------------------------------------------------------------------
  // getPendingSync
  // ---------------------------------------------------------------------------

  @override
  Future<List<SyncRecord>> getPendingSync(String entityType) async {
    switch (entityType) {
      case 'task':
        return _getPendingTasks();
      case 'project':
        return _getPendingProjects();
      default:
        return const [];
    }
  }

  Future<List<SyncRecord>> _getPendingTasks() async {
    final query = _db.select(_db.localTasks)
      ..where((t) => t.needsSync.equals(true));
    final rows = await query.get();
    return rows.map(_taskToSyncRecord).toList();
  }

  Future<List<SyncRecord>> _getPendingProjects() async {
    final query = _db.select(_db.localProjects)
      ..where((p) => p.needsSync.equals(true));
    final rows = await query.get();
    return rows.map(_projectToSyncRecord).toList();
  }

  // ---------------------------------------------------------------------------
  // getById
  // ---------------------------------------------------------------------------

  @override
  Future<SyncRecord?> getById(String entityType, String id) async {
    switch (entityType) {
      case 'task':
        return _getTaskById(id);
      case 'project':
        return _getProjectById(id);
      default:
        return null;
    }
  }

  Future<SyncRecord?> _getTaskById(String id) async {
    final query = _db.select(_db.localTasks)
      ..where((t) => t.id.equals(id));
    final row = await query.getSingleOrNull();
    return row == null ? null : _taskToSyncRecord(row);
  }

  Future<SyncRecord?> _getProjectById(String id) async {
    final query = _db.select(_db.localProjects)
      ..where((p) => p.id.equals(id));
    final row = await query.getSingleOrNull();
    return row == null ? null : _projectToSyncRecord(row);
  }

  // ---------------------------------------------------------------------------
  // save
  // ---------------------------------------------------------------------------

  @override
  Future<void> save(SyncRecord record) async {
    switch (record.entityType) {
      case 'task':
        await _saveTask(record);
      case 'project':
        await _saveProject(record);
    }
  }

  Future<void> _saveTask(SyncRecord record) async {
    final fields = record.fields;
    final companion = LocalTasksCompanion(
      id: Value(record.id),
      title: Value(fields['title'] as String? ?? ''),
      description: Value(fields['description'] as String? ?? ''),
      status: Value(fields['status'] as String? ?? 'pending'),
      priority: Value(fields['priority'] as String? ?? 'none'),
      projectId: Value(fields['projectId'] as String?),
      dueDate: Value(_parseDateTime(fields['dueDate'])),
      completedAt: Value(_parseDateTime(fields['completedAt'])),
      rrule: Value(fields['rrule'] as String?),
      sortOrder: Value(fields['sortOrder'] as int? ?? 0),
      createdAt: Value(record.createdAt),
      updatedAt: Value(record.updatedAt),
      needsSync: Value(record.needsSync),
    );
    await _db.into(_db.localTasks).insertOnConflictUpdate(companion);
  }

  Future<void> _saveProject(SyncRecord record) async {
    final fields = record.fields;
    final companion = LocalProjectsCompanion(
      id: Value(record.id),
      name: Value(fields['name'] as String? ?? ''),
      description: Value(fields['description'] as String?),
      color: Value(fields['color'] as String? ?? '#6C5CE7'),
      icon: Value(fields['icon'] as String? ?? 'folder'),
      isArchived: Value(fields['isArchived'] as bool? ?? false),
      sortOrder: Value(fields['sortOrder'] as int? ?? 0),
      createdAt: Value(record.createdAt),
      updatedAt: Value(record.updatedAt),
      needsSync: Value(record.needsSync),
    );
    await _db.into(_db.localProjects).insertOnConflictUpdate(companion);
  }

  // ---------------------------------------------------------------------------
  // saveAll
  // ---------------------------------------------------------------------------

  @override
  Future<void> saveAll(List<SyncRecord> records) async {
    for (final record in records) {
      await save(record);
    }
  }

  // ---------------------------------------------------------------------------
  // markSynced
  // ---------------------------------------------------------------------------

  @override
  Future<void> markSynced(String entityType, List<String> ids) async {
    if (ids.isEmpty) return;

    switch (entityType) {
      case 'task':
        await (_db.update(_db.localTasks)
              ..where((t) => t.id.isIn(ids)))
            .write(const LocalTasksCompanion(needsSync: Value(false)));
      case 'project':
        await (_db.update(_db.localProjects)
              ..where((p) => p.id.isIn(ids)))
            .write(const LocalProjectsCompanion(needsSync: Value(false)));
    }
  }

  // ---------------------------------------------------------------------------
  // Timestamps (SharedPreferences)
  // ---------------------------------------------------------------------------

  @override
  Future<DateTime?> getLastSyncTimestamp(String entityType) async {
    final key = '$_syncTimestampPrefix$entityType';
    final iso = _prefs.getString(key);
    if (iso == null || iso.isEmpty) return null;
    return DateTime.tryParse(iso);
  }

  @override
  Future<void> setLastSyncTimestamp(
    String entityType,
    DateTime timestamp,
  ) async {
    final key = '$_syncTimestampPrefix$entityType';
    await _prefs.setString(key, timestamp.toUtc().toIso8601String());
  }

  // ---------------------------------------------------------------------------
  // Conversion helpers
  // ---------------------------------------------------------------------------

  SyncRecord _taskToSyncRecord(LocalTask row) {
    final now = row.updatedAt;
    final fieldTimestamps = <String, DateTime>{
      'title': now,
      'description': now,
      'status': now,
      'priority': now,
      'projectId': now,
      'dueDate': now,
      'completedAt': now,
      'rrule': now,
      'sortOrder': now,
    };

    return SyncRecord(
      id: row.id,
      entityType: 'task',
      fields: <String, Object?>{
        'title': row.title,
        'description': row.description,
        'status': row.status,
        'priority': row.priority,
        'projectId': row.projectId,
        'dueDate': row.dueDate?.toIso8601String(),
        'completedAt': row.completedAt?.toIso8601String(),
        'rrule': row.rrule,
        'sortOrder': row.sortOrder,
      },
      fieldTimestamps: fieldTimestamps,
      updatedAt: row.updatedAt,
      createdAt: row.createdAt,
      needsSync: row.needsSync,
    );
  }

  SyncRecord _projectToSyncRecord(LocalProject row) {
    final now = row.updatedAt;
    final fieldTimestamps = <String, DateTime>{
      'name': now,
      'description': now,
      'color': now,
      'icon': now,
      'isArchived': now,
      'sortOrder': now,
    };

    return SyncRecord(
      id: row.id,
      entityType: 'project',
      fields: <String, Object?>{
        'name': row.name,
        'description': row.description,
        'color': row.color,
        'icon': row.icon,
        'isArchived': row.isArchived,
        'sortOrder': row.sortOrder,
      },
      fieldTimestamps: fieldTimestamps,
      updatedAt: row.updatedAt,
      createdAt: row.createdAt,
      needsSync: row.needsSync,
    );
  }

  DateTime? _parseDateTime(Object? value) {
    if (value == null) return null;
    if (value is DateTime) return value;
    if (value is String) return DateTime.tryParse(value);
    return null;
  }
}
