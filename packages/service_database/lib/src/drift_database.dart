import 'dart:io';

import 'package:drift/drift.dart';
import 'package:drift/native.dart';
import 'package:path/path.dart' as p;
import 'package:path_provider/path_provider.dart';

part 'drift_database.g.dart';

// =============================================================================
// Phase 1 Tables (existing)
// =============================================================================

class LocalTasks extends Table {
  TextColumn get id => text()();
  TextColumn get title => text().withLength(min: 1, max: 500)();
  TextColumn get description => text().withDefault(const Constant(''))();
  TextColumn get status =>
      text().withDefault(const Constant('pending'))();
  TextColumn get priority =>
      text().withDefault(const Constant('none'))();
  TextColumn get projectId => text().named('project_id').nullable()();
  DateTimeColumn get dueDate =>
      dateTime().named('due_date').nullable()();
  DateTimeColumn get completedAt =>
      dateTime().named('completed_at').nullable()();
  TextColumn get rrule => text().nullable()();
  IntColumn get sortOrder =>
      integer().named('sort_order').withDefault(const Constant(0))();
  DateTimeColumn get createdAt =>
      dateTime().named('created_at').withDefault(currentDateAndTime)();
  DateTimeColumn get updatedAt =>
      dateTime().named('updated_at').withDefault(currentDateAndTime)();
  BoolColumn get needsSync =>
      boolean().named('needs_sync').withDefault(const Constant(true))();

  @override
  Set<Column> get primaryKey => {id};
}

class LocalProjects extends Table {
  TextColumn get id => text()();
  TextColumn get name => text().withLength(min: 1, max: 200)();
  TextColumn get description => text().nullable()();
  TextColumn get color =>
      text().withDefault(const Constant('#6C5CE7'))();
  TextColumn get icon =>
      text().withDefault(const Constant('folder'))();
  BoolColumn get isArchived =>
      boolean().named('is_archived').withDefault(const Constant(false))();
  IntColumn get sortOrder =>
      integer().named('sort_order').withDefault(const Constant(0))();
  DateTimeColumn get createdAt =>
      dateTime().named('created_at').withDefault(currentDateAndTime)();
  DateTimeColumn get updatedAt =>
      dateTime().named('updated_at').withDefault(currentDateAndTime)();

  @override
  Set<Column> get primaryKey => {id};
}

// =============================================================================
// Phase 2 Tables (new in schema v2)
// =============================================================================

/// Cached daily content entries (last 30 fetched from backend).
class LocalDailyContent extends Table {
  TextColumn get id => text()();
  TextColumn get category => text()();
  TextColumn get body => text()();
  TextColumn get author => text().nullable()();
  TextColumn get source => text().nullable()();
  TextColumn get language =>
      text().withDefault(const Constant('en'))();
  BoolColumn get isSaved =>
      boolean().named('is_saved').withDefault(const Constant(false))();
  DateTimeColumn get fetchedAt =>
      dateTime().named('fetched_at').withDefault(currentDateAndTime)();

  @override
  Set<Column> get primaryKey => {id};
}

/// User content delivery preferences (categories + delivery time).
class LocalContentPreferences extends Table {
  TextColumn get category => text()();
  TextColumn get deliverAt =>
      text().named('deliver_at').withDefault(const Constant('07:00'))();
  BoolColumn get isActive =>
      boolean().named('is_active').withDefault(const Constant(true))();

  @override
  Set<Column> get primaryKey => {category};
}

/// Morning/evening ritual log entries.
class LocalRitualLog extends Table {
  TextColumn get id => text()();

  /// 'morning' or 'evening'
  TextColumn get ritualType => text().named('ritual_type')();
  IntColumn get mood => integer().nullable()();
  TextColumn get gratitudeText =>
      text().named('gratitude_text').nullable()();
  TextColumn get intentionText =>
      text().named('intention_text').nullable()();
  TextColumn get reflectionText =>
      text().named('reflection_text').nullable()();
  DateTimeColumn get completedAt =>
      dateTime().named('completed_at').withDefault(currentDateAndTime)();

  /// Date of the ritual (no time, for dedup).
  DateTimeColumn get ritualDate => dateTime().named('ritual_date')();
  BoolColumn get needsSync =>
      boolean().named('needs_sync').withDefault(const Constant(true))();

  @override
  Set<Column> get primaryKey => {id};
}

/// Daily progress snapshots (one per day).
class LocalProgressSnapshots extends Table {
  TextColumn get id => text()();
  DateTimeColumn get snapshotDate => dateTime().named('snapshot_date')();
  IntColumn get tasksCreated =>
      integer().named('tasks_created').withDefault(const Constant(0))();
  IntColumn get tasksCompleted =>
      integer().named('tasks_completed').withDefault(const Constant(0))();
  IntColumn get focusMinutes =>
      integer().named('focus_minutes').withDefault(const Constant(0))();
  IntColumn get habitsDone =>
      integer().named('habits_done').withDefault(const Constant(0))();
  IntColumn get pomodorosCompleted =>
      integer().named('pomodoros_completed').withDefault(const Constant(0))();
  BoolColumn get needsSync =>
      boolean().named('needs_sync').withDefault(const Constant(true))();

  @override
  Set<Column> get primaryKey => {id};
}

/// Pomodoro focus session records.
class LocalPomodoroSessions extends Table {
  TextColumn get id => text()();
  TextColumn get taskId => text().named('task_id').nullable()();
  IntColumn get durationSeconds =>
      integer().named('duration_seconds')();
  IntColumn get focusRating =>
      integer().named('focus_rating').nullable()();
  TextColumn get ambientSound =>
      text().named('ambient_sound').nullable()();
  DateTimeColumn get startedAt => dateTime().named('started_at')();
  DateTimeColumn get completedAt =>
      dateTime().named('completed_at').nullable()();
  BoolColumn get needsSync =>
      boolean().named('needs_sync').withDefault(const Constant(true))();

  @override
  Set<Column> get primaryKey => {id};
}

/// Ghost mode session tracking.
class LocalGhostModeSessions extends Table {
  TextColumn get id => text()();
  DateTimeColumn get startedAt => dateTime().named('started_at')();
  DateTimeColumn get endedAt =>
      dateTime().named('ended_at').nullable()();
  IntColumn get tasksCompleted =>
      integer().named('tasks_completed').withDefault(const Constant(0))();
  IntColumn get focusMinutes =>
      integer().named('focus_minutes').withDefault(const Constant(0))();

  @override
  Set<Column> get primaryKey => {id};
}

/// User streak data (current + longest).
class LocalStreaks extends Table {
  TextColumn get id => text()();
  IntColumn get current =>
      integer().withDefault(const Constant(0))();
  IntColumn get longest =>
      integer().withDefault(const Constant(0))();
  DateTimeColumn get lastActiveDate =>
      dateTime().named('last_active_date').nullable()();
  IntColumn get freezeUsed =>
      integer().named('freeze_used').withDefault(const Constant(0))();
  IntColumn get freezeAvailable =>
      integer().named('freeze_available').withDefault(const Constant(0))();
  BoolColumn get needsSync =>
      boolean().named('needs_sync').withDefault(const Constant(true))();

  @override
  Set<Column> get primaryKey => {id};
}

/// Personal best milestone records.
class LocalPersonalBests extends Table {
  TextColumn get id => text()();

  /// e.g. 'most_tasks_day', 'longest_streak', 'fastest_project'
  TextColumn get metricKey => text().named('metric_key')();
  IntColumn get value => integer()();
  TextColumn get detail => text().nullable()();
  DateTimeColumn get achievedAt =>
      dateTime().named('achieved_at').withDefault(currentDateAndTime)();

  @override
  Set<Column> get primaryKey => {id};
}

/// Cached task templates (system + user-created).
class LocalTaskTemplates extends Table {
  TextColumn get id => text()();
  TextColumn get name => text().withLength(min: 1, max: 200)();
  TextColumn get description => text().nullable()();

  /// JSON: default field values (priority, tags, etc.)
  TextColumn get fieldsJson => text().named('fields_json').nullable()();

  /// JSON: list of subtask titles
  TextColumn get subtasksJson =>
      text().named('subtasks_json').nullable()();
  TextColumn get category =>
      text().withDefault(const Constant('personal'))();
  BoolColumn get isSystem =>
      boolean().named('is_system').withDefault(const Constant(false))();

  /// null = system template, non-null = user-created
  TextColumn get userId => text().named('user_id').nullable()();
  TextColumn get industryMode =>
      text().named('industry_mode').nullable()();

  @override
  Set<Column> get primaryKey => {id};
}

/// Local recurring rule storage (RRULE strings + next occurrence).
class LocalRecurringRules extends Table {
  TextColumn get id => text()();
  TextColumn get taskId => text().named('task_id')();
  TextColumn get rruleStr => text().named('rrule_str')();
  DateTimeColumn get nextAt => dateTime().named('next_at').nullable()();
  DateTimeColumn get lastGeneratedAt =>
      dateTime().named('last_generated_at').nullable()();

  @override
  Set<Column> get primaryKey => {id};
}

/// Subtasks belonging to a parent task.
class LocalSubtasks extends Table {
  TextColumn get id => text()();
  TextColumn get taskId => text().named('task_id')();
  TextColumn get title => text().withLength(min: 1, max: 500)();
  BoolColumn get isCompleted =>
      boolean().named('is_completed').withDefault(const Constant(false))();
  IntColumn get sortOrder =>
      integer().named('sort_order').withDefault(const Constant(0))();
  DateTimeColumn get createdAt =>
      dateTime().named('created_at').withDefault(currentDateAndTime)();
  DateTimeColumn get updatedAt =>
      dateTime().named('updated_at').withDefault(currentDateAndTime)();
  BoolColumn get needsSync =>
      boolean().named('needs_sync').withDefault(const Constant(true))();

  @override
  Set<Column> get primaryKey => {id};
}

/// Tags for categorizing tasks.
class LocalTags extends Table {
  TextColumn get id => text()();
  TextColumn get name => text().withLength(min: 1, max: 100)();
  TextColumn get color =>
      text().withDefault(const Constant('#6C5CE7'))();
  DateTimeColumn get createdAt =>
      dateTime().named('created_at').withDefault(currentDateAndTime)();

  @override
  Set<Column> get primaryKey => {id};
}

/// Many-to-many join table between tasks and tags.
class LocalTaskTags extends Table {
  TextColumn get taskId => text().named('task_id')();
  TextColumn get tagId => text().named('tag_id')();

  @override
  Set<Column> get primaryKey => {taskId, tagId};
}

/// Time blocks for the time blocking feature (F2).
class LocalTimeBlocks extends Table {
  TextColumn get id => text()();
  TextColumn get taskId => text().named('task_id')();
  DateTimeColumn get blockDate => dateTime().named('block_date')();
  IntColumn get startHour => integer().named('start_hour')();
  IntColumn get startMinute => integer().named('start_minute')();
  IntColumn get durationMinutes => integer().named('duration_minutes')();
  DateTimeColumn get createdAt =>
      dateTime().named('created_at').withDefault(currentDateAndTime)();
  BoolColumn get needsSync =>
      boolean().named('needs_sync').withDefault(const Constant(true))();

  @override
  Set<Column> get primaryKey => {id};
}

/// Locally scheduled reminders (for offline-first notification scheduling).
class LocalReminders extends Table {
  TextColumn get id => text()();
  TextColumn get taskId => text().named('task_id')();

  /// 'push', 'telegram', 'email', 'whatsapp', 'sms', etc.
  TextColumn get channel => text()();
  IntColumn get offsetMinutes => integer().named('offset_minutes')();
  DateTimeColumn get scheduledAt => dateTime().named('scheduled_at')();
  DateTimeColumn get sentAt =>
      dateTime().named('sent_at').nullable()();

  /// 'pending', 'sent', 'failed', 'cancelled'
  TextColumn get status =>
      text().withDefault(const Constant('pending'))();
  BoolColumn get needsSync =>
      boolean().named('needs_sync').withDefault(const Constant(true))();

  @override
  Set<Column> get primaryKey => {id};
}

// =============================================================================
// Database
// =============================================================================

@DriftDatabase(tables: [
  // Phase 1
  LocalTasks,
  LocalProjects,
  // Phase 2
  LocalDailyContent,
  LocalContentPreferences,
  LocalRitualLog,
  LocalProgressSnapshots,
  LocalPomodoroSessions,
  LocalGhostModeSessions,
  LocalStreaks,
  LocalPersonalBests,
  LocalTaskTemplates,
  LocalRecurringRules,
  LocalReminders,
  // Phase 2 additions (schema v3)
  LocalSubtasks,
  LocalTags,
  LocalTaskTags,
  LocalTimeBlocks,
])
class AppDatabase extends _$AppDatabase {
  AppDatabase() : super(_openConnection());

  AppDatabase.forTesting(super.e);

  @override
  int get schemaVersion => 3;

  @override
  MigrationStrategy get migration {
    return MigrationStrategy(
      onCreate: (Migrator m) async {
        await m.createAll();
      },
      onUpgrade: (Migrator m, int from, int to) async {
        if (from < 2) {
          // v1 -> v2: Add all Phase 2 tables
          await m.createTable(localDailyContent);
          await m.createTable(localContentPreferences);
          await m.createTable(localRitualLog);
          await m.createTable(localProgressSnapshots);
          await m.createTable(localPomodoroSessions);
          await m.createTable(localGhostModeSessions);
          await m.createTable(localStreaks);
          await m.createTable(localPersonalBests);
          await m.createTable(localTaskTemplates);
          await m.createTable(localRecurringRules);
          await m.createTable(localReminders);
        }
        if (from < 3) {
          // v2 -> v3: Add subtasks, tags, task_tags, time_blocks
          await m.createTable(localSubtasks);
          await m.createTable(localTags);
          await m.createTable(localTaskTags);
          await m.createTable(localTimeBlocks);
        }
      },
    );
  }
}

LazyDatabase _openConnection() {
  return LazyDatabase(() async {
    final dbFolder = await getApplicationDocumentsDirectory();
    final file = File(p.join(dbFolder.path, 'unjynx.db'));
    return NativeDatabase.createInBackground(file);
  });
}
