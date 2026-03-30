import 'package:drift/drift.dart';
import 'package:unjynx_core/contracts/database_port.dart';

import 'drift_database.dart';

/// Allowed table names — prevents SQL injection via table name.
const _allowedTables = {
  // Phase 1
  'local_tasks',
  'local_projects',
  'sync_queue',
  // Phase 2
  'local_daily_content',
  'local_content_preferences',
  'local_ritual_log',
  'local_progress_snapshots',
  'local_pomodoro_sessions',
  'local_ghost_mode_sessions',
  'local_streaks',
  'local_personal_bests',
  'local_task_templates',
  'local_recurring_rules',
  'local_reminders',
  // Phase 2 additions (schema v3)
  'local_subtasks',
  'local_tags',
  'local_task_tags',
  'local_time_blocks',
};

/// Allowed column names — prevents SQL injection via column/orderBy names.
const _allowedColumns = {
  // Common
  'id',
  'user_id',
  'title',
  'description',
  'status',
  'priority',
  'created_at',
  'updated_at',
  'needs_sync',
  'sort_order',
  // Tasks
  'project_id',
  'due_date',
  'completed_at',
  'rrule',
  // Projects
  'name',
  'color',
  'icon',
  'is_archived',
  // Daily content
  'category',
  'body',
  'author',
  'source',
  'language',
  'is_saved',
  'fetched_at',
  // Content preferences
  'deliver_at',
  'is_active',
  // Ritual log
  'ritual_type',
  'mood',
  'gratitude_text',
  'intention_text',
  'reflection_text',
  'ritual_date',
  // Progress snapshots
  'snapshot_date',
  'tasks_created',
  'tasks_completed',
  'focus_minutes',
  'habits_done',
  'pomodoros_completed',
  // Pomodoro sessions
  'task_id',
  'duration_seconds',
  'focus_rating',
  'ambient_sound',
  'started_at',
  // Ghost mode sessions
  'ended_at',
  // Streaks
  'current',
  'longest',
  'last_active_date',
  'freeze_used',
  'freeze_available',
  // Personal bests
  'metric_key',
  'value',
  'detail',
  'achieved_at',
  // Task templates
  'fields_json',
  'subtasks_json',
  'is_system',
  'industry_mode',
  // Recurring rules
  'rrule_str',
  'next_at',
  'last_generated_at',
  // Reminders
  'channel',
  'offset_minutes',
  'scheduled_at',
  'sent_at',
  // Subtasks
  'is_completed',
  // Tags
  'tag_id',
  // Time blocks
  'block_date',
  'start_hour',
  'start_minute',
  'duration_minutes',
};

String _validateTable(String table) {
  if (!_allowedTables.contains(table)) {
    throw ArgumentError('Invalid table name: $table');
  }
  return table;
}

String _validateColumn(String column) {
  if (!_allowedColumns.contains(column)) {
    throw ArgumentError('Invalid column name: $column');
  }
  return column;
}

/// Drift implementation of [DatabasePort].
///
/// Provides local SQLite storage with offline-first capabilities.
/// All table/column names are whitelisted to prevent SQL injection.
class DriftDatabasePort implements DatabasePort {
  AppDatabase? _db;

  AppDatabase get db {
    if (_db == null) {
      throw StateError('Database not initialized. Call initialize() first.');
    }
    return _db!;
  }

  @override
  Future<void> initialize() async {
    _db = AppDatabase();
  }

  /// Initialize with an existing database instance (for testing).
  void initializeWith(AppDatabase database) {
    _db = database;
  }

  @override
  Future<void> close() async {
    await _db?.close();
    _db = null;
  }

  @override
  Future<List<Map<String, dynamic>>> query(
    String table, {
    Map<String, dynamic>? where,
    String? orderBy,
    int? limit,
    int? offset,
  }) async {
    final safeTable = _validateTable(table);
    final query = db.customSelect(
      _buildSelectQuery(
        safeTable,
        where: where,
        orderBy: orderBy,
        limit: limit,
        offset: offset,
      ),
      variables: _buildVariables(where),
    );

    final rows = await query.get();
    return rows.map((row) => row.data).toList();
  }

  @override
  Future<String> insert(String table, Map<String, dynamic> data) async {
    final safeTable = _validateTable(table);
    final id = data['id'] as String;
    final columns = data.keys.map(_validateColumn).join(', ');
    final placeholders = data.keys.map((_) => '?').join(', ');

    await db.customStatement(
      'INSERT OR REPLACE INTO $safeTable ($columns) VALUES ($placeholders)',
      data.values.toList(),
    );

    return id;
  }

  @override
  Future<int> update(
    String table,
    Map<String, dynamic> data, {
    required Map<String, dynamic> where,
  }) async {
    final safeTable = _validateTable(table);
    final setClause =
        data.keys.map((k) => '${_validateColumn(k)} = ?').join(', ');
    final whereClause =
        where.keys.map((k) => '${_validateColumn(k)} = ?').join(' AND ');

    final result = await db.customUpdate(
      'UPDATE $safeTable SET $setClause WHERE $whereClause',
      variables: [
        ...data.values.map(_toVariable),
        ...where.values.map(_toVariable),
      ],
      updates: _allTableSets,
    );

    return result;
  }

  @override
  Future<int> delete(
    String table, {
    required Map<String, dynamic> where,
  }) async {
    final safeTable = _validateTable(table);
    final whereClause =
        where.keys.map((k) => '${_validateColumn(k)} = ?').join(' AND ');

    final result = await db.customUpdate(
      'DELETE FROM $safeTable WHERE $whereClause',
      variables: where.values.map(_toVariable).toList(),
      updates: _allTableSets,
    );

    return result;
  }

  /// All table references for Drift stream invalidation.
  Set<TableInfo<Table, dynamic>> get _allTableSets => {
        db.localTasks,
        db.localProjects,
        db.localDailyContent,
        db.localContentPreferences,
        db.localRitualLog,
        db.localProgressSnapshots,
        db.localPomodoroSessions,
        db.localGhostModeSessions,
        db.localStreaks,
        db.localPersonalBests,
        db.localTaskTemplates,
        db.localRecurringRules,
        db.localReminders,
        db.localSubtasks,
        db.localTags,
        db.localTaskTags,
        db.localTimeBlocks,
      };

  String _buildSelectQuery(
    String table, {
    Map<String, dynamic>? where,
    String? orderBy,
    int? limit,
    int? offset,
  }) {
    final buffer = StringBuffer('SELECT * FROM $table');

    if (where != null && where.isNotEmpty) {
      final conditions =
          where.keys.map((k) => '${_validateColumn(k)} = ?').join(' AND ');
      buffer.write(' WHERE $conditions');
    }

    if (orderBy != null) {
      final parts = orderBy.split(' ');
      final col = _validateColumn(parts.first);
      final dir = (parts.length > 1 && parts[1].toUpperCase() == 'DESC')
          ? 'DESC'
          : 'ASC';
      buffer.write(' ORDER BY $col $dir');
    }

    if (limit != null) {
      buffer.write(' LIMIT ?');
    }

    if (offset != null) {
      buffer.write(' OFFSET ?');
    }

    return buffer.toString();
  }

  List<Variable<Object>> _buildVariables(Map<String, dynamic>? where) {
    if (where == null) return [];
    return where.values.map(_toVariable).toList();
  }

  Variable<Object> _toVariable(dynamic value) {
    if (value is int) return Variable.withInt(value);
    if (value is bool) return Variable.withBool(value);
    if (value is DateTime) return Variable.withDateTime(value);
    if (value is double) return Variable.withReal(value);
    return Variable.withString(value.toString());
  }
}
