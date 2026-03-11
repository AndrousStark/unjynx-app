import 'package:drift/drift.dart' hide isNotNull, isNull;
import 'package:drift/native.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:service_database/src/drift_database.dart';

AppDatabase _createTestDb() {
  return AppDatabase.forTesting(
    NativeDatabase.memory(logStatements: false),
  );
}

void main() {
  group('Schema v3 - Table creation', () {
    late AppDatabase db;

    setUp(() {
      db = _createTestDb();
    });

    tearDown(() async {
      await db.close();
    });

    test('schema version is 3', () {
      expect(db.schemaVersion, 3);
    });

    test('all 17 tables exist', () async {
      // Query sqlite_master for all tables
      final rows = await db.customSelect(
        "SELECT name FROM sqlite_master WHERE type='table' "
        "AND name NOT LIKE 'sqlite_%' ORDER BY name",
      ).get();

      final tables = rows.map((r) => r.data['name'] as String).toSet();

      expect(tables, containsAll([
        'local_tasks',
        'local_projects',
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
        'local_subtasks',
        'local_tags',
        'local_task_tags',
        'local_time_blocks',
      ]));
    });
  });

  group('LocalDailyContent CRUD', () {
    late AppDatabase db;

    setUp(() {
      db = _createTestDb();
    });

    tearDown(() async {
      await db.close();
    });

    test('insert and query content', () async {
      await db.into(db.localDailyContent).insert(
        LocalDailyContentCompanion.insert(
          id: 'c1',
          category: 'stoic',
          body: 'The obstacle is the way.',
          author: const Value('Marcus Aurelius'),
          source: const Value('Meditations'),
        ),
      );

      final rows = await db.select(db.localDailyContent).get();
      expect(rows.length, 1);
      expect(rows.first.category, 'stoic');
      expect(rows.first.body, 'The obstacle is the way.');
      expect(rows.first.author, 'Marcus Aurelius');
      expect(rows.first.isSaved, false);
    });

    test('mark content as saved', () async {
      await db.into(db.localDailyContent).insert(
        LocalDailyContentCompanion.insert(
          id: 'c2',
          category: 'growth',
          body: 'Growth mindset.',
        ),
      );

      await (db.update(db.localDailyContent)
            ..where((t) => t.id.equals('c2')))
          .write(
        const LocalDailyContentCompanion(isSaved: Value(true)),
      );

      final row = await (db.select(db.localDailyContent)
            ..where((t) => t.id.equals('c2')))
          .getSingle();
      expect(row.isSaved, true);
    });
  });

  group('LocalRitualLog CRUD', () {
    late AppDatabase db;

    setUp(() {
      db = _createTestDb();
    });

    tearDown(() async {
      await db.close();
    });

    test('insert morning ritual', () async {
      final date = DateTime(2026, 3, 9);
      await db.into(db.localRitualLog).insert(
        LocalRitualLogCompanion.insert(
          id: 'r1',
          ritualType: 'morning',
          ritualDate: date,
          mood: const Value(4),
          gratitudeText: const Value('Family'),
          intentionText: const Value('Ship feature'),
        ),
      );

      final rows = await db.select(db.localRitualLog).get();
      expect(rows.length, 1);
      expect(rows.first.ritualType, 'morning');
      expect(rows.first.mood, 4);
      expect(rows.first.gratitudeText, 'Family');
    });
  });

  group('LocalPomodoroSessions CRUD', () {
    late AppDatabase db;

    setUp(() {
      db = _createTestDb();
    });

    tearDown(() async {
      await db.close();
    });

    test('insert and complete pomodoro session', () async {
      final start = DateTime(2026, 3, 9, 14, 0);
      await db.into(db.localPomodoroSessions).insert(
        LocalPomodoroSessionsCompanion.insert(
          id: 'p1',
          taskId: const Value('task-1'),
          durationSeconds: 1500, // 25 min
          startedAt: start,
        ),
      );

      // Complete session
      final end = start.add(const Duration(minutes: 25));
      await (db.update(db.localPomodoroSessions)
            ..where((t) => t.id.equals('p1')))
          .write(
        LocalPomodoroSessionsCompanion(
          completedAt: Value(end),
          focusRating: const Value(4),
        ),
      );

      final row = await (db.select(db.localPomodoroSessions)
            ..where((t) => t.id.equals('p1')))
          .getSingle();
      expect(row.durationSeconds, 1500);
      expect(row.focusRating, 4);
      expect(row.completedAt, end);
    });
  });

  group('LocalStreaks CRUD', () {
    late AppDatabase db;

    setUp(() {
      db = _createTestDb();
    });

    tearDown(() async {
      await db.close();
    });

    test('insert and update streak', () async {
      await db.into(db.localStreaks).insert(
        LocalStreaksCompanion.insert(
          id: 'streak-user-1',
          lastActiveDate: Value(DateTime(2026, 3, 8)),
        ),
      );

      // Bump streak
      await (db.update(db.localStreaks)
            ..where((t) => t.id.equals('streak-user-1')))
          .write(
        LocalStreaksCompanion(
          current: const Value(5),
          longest: const Value(10),
          lastActiveDate: Value(DateTime(2026, 3, 9)),
        ),
      );

      final row = await (db.select(db.localStreaks)
            ..where((t) => t.id.equals('streak-user-1')))
          .getSingle();
      expect(row.current, 5);
      expect(row.longest, 10);
    });
  });

  group('LocalProgressSnapshots CRUD', () {
    late AppDatabase db;

    setUp(() {
      db = _createTestDb();
    });

    tearDown(() async {
      await db.close();
    });

    test('insert daily snapshot', () async {
      await db.into(db.localProgressSnapshots).insert(
        LocalProgressSnapshotsCompanion.insert(
          id: 'snap-2026-03-09',
          snapshotDate: DateTime(2026, 3, 9),
          tasksCreated: const Value(8),
          tasksCompleted: const Value(5),
          focusMinutes: const Value(120),
          pomodorosCompleted: const Value(4),
        ),
      );

      final rows = await db.select(db.localProgressSnapshots).get();
      expect(rows.length, 1);
      expect(rows.first.tasksCompleted, 5);
      expect(rows.first.focusMinutes, 120);
    });
  });

  group('LocalTaskTemplates CRUD', () {
    late AppDatabase db;

    setUp(() {
      db = _createTestDb();
    });

    tearDown(() async {
      await db.close();
    });

    test('insert system template', () async {
      await db.into(db.localTaskTemplates).insert(
        LocalTaskTemplatesCompanion.insert(
          id: 'tmpl-1',
          name: 'Weekly Review',
          description: const Value('End-of-week review checklist'),
          subtasksJson: const Value(
            '["Review goals","Check metrics","Plan next week"]',
          ),
          isSystem: const Value(true),
        ),
      );

      final rows = await db.select(db.localTaskTemplates).get();
      expect(rows.length, 1);
      expect(rows.first.name, 'Weekly Review');
      expect(rows.first.isSystem, true);
      expect(rows.first.subtasksJson, contains('Review goals'));
    });
  });

  group('LocalRecurringRules CRUD', () {
    late AppDatabase db;

    setUp(() {
      db = _createTestDb();
    });

    tearDown(() async {
      await db.close();
    });

    test('insert recurring rule', () async {
      await db.into(db.localRecurringRules).insert(
        LocalRecurringRulesCompanion.insert(
          id: 'rr-1',
          taskId: 'task-daily',
          rruleStr: 'FREQ=DAILY;INTERVAL=1',
          nextAt: Value(DateTime(2026, 3, 10, 9, 0)),
        ),
      );

      final rows = await db.select(db.localRecurringRules).get();
      expect(rows.length, 1);
      expect(rows.first.rruleStr, 'FREQ=DAILY;INTERVAL=1');
    });
  });

  group('LocalReminders CRUD', () {
    late AppDatabase db;

    setUp(() {
      db = _createTestDb();
    });

    tearDown(() async {
      await db.close();
    });

    test('insert and mark reminder as sent', () async {
      final scheduled = DateTime(2026, 3, 10, 8, 30);
      await db.into(db.localReminders).insert(
        LocalRemindersCompanion.insert(
          id: 'rem-1',
          taskId: 'task-1',
          channel: 'push',
          offsetMinutes: 30,
          scheduledAt: scheduled,
        ),
      );

      // Mark as sent
      await (db.update(db.localReminders)
            ..where((t) => t.id.equals('rem-1')))
          .write(
        LocalRemindersCompanion(
          status: const Value('sent'),
          sentAt: Value(DateTime(2026, 3, 10, 8, 30, 5)),
        ),
      );

      final row = await (db.select(db.localReminders)
            ..where((t) => t.id.equals('rem-1')))
          .getSingle();
      expect(row.status, 'sent');
      expect(row.sentAt, isNotNull);
    });
  });

  group('LocalGhostModeSessions CRUD', () {
    late AppDatabase db;

    setUp(() {
      db = _createTestDb();
    });

    tearDown(() async {
      await db.close();
    });

    test('track ghost mode session', () async {
      final start = DateTime(2026, 3, 9, 15, 0);
      await db.into(db.localGhostModeSessions).insert(
        LocalGhostModeSessionsCompanion.insert(
          id: 'gm-1',
          startedAt: start,
        ),
      );

      // End session
      final end = start.add(const Duration(minutes: 45));
      await (db.update(db.localGhostModeSessions)
            ..where((t) => t.id.equals('gm-1')))
          .write(
        LocalGhostModeSessionsCompanion(
          endedAt: Value(end),
          tasksCompleted: const Value(3),
          focusMinutes: const Value(45),
        ),
      );

      final row = await (db.select(db.localGhostModeSessions)
            ..where((t) => t.id.equals('gm-1')))
          .getSingle();
      expect(row.tasksCompleted, 3);
      expect(row.focusMinutes, 45);
    });
  });

  group('LocalContentPreferences CRUD', () {
    late AppDatabase db;

    setUp(() {
      db = _createTestDb();
    });

    tearDown(() async {
      await db.close();
    });

    test('set content preferences', () async {
      await db.into(db.localContentPreferences).insert(
        LocalContentPreferencesCompanion.insert(
          category: 'stoic',
          deliverAt: const Value('08:00'),
        ),
      );

      final rows = await db.select(db.localContentPreferences).get();
      expect(rows.length, 1);
      expect(rows.first.category, 'stoic');
      expect(rows.first.deliverAt, '08:00');
      expect(rows.first.isActive, true);
    });

    test('disable category', () async {
      await db.into(db.localContentPreferences).insert(
        LocalContentPreferencesCompanion.insert(category: 'humor'),
      );

      await (db.update(db.localContentPreferences)
            ..where((t) => t.category.equals('humor')))
          .write(
        const LocalContentPreferencesCompanion(
          isActive: Value(false),
        ),
      );

      final row = await (db.select(db.localContentPreferences)
            ..where((t) => t.category.equals('humor')))
          .getSingle();
      expect(row.isActive, false);
    });
  });

  group('LocalPersonalBests CRUD', () {
    late AppDatabase db;

    setUp(() {
      db = _createTestDb();
    });

    tearDown(() async {
      await db.close();
    });

    test('record personal best', () async {
      await db.into(db.localPersonalBests).insert(
        LocalPersonalBestsCompanion.insert(
          id: 'pb-1',
          metricKey: 'most_tasks_day',
          value: 15,
          detail: const Value('March 5, 2026'),
        ),
      );

      final rows = await db.select(db.localPersonalBests).get();
      expect(rows.length, 1);
      expect(rows.first.metricKey, 'most_tasks_day');
      expect(rows.first.value, 15);
    });
  });

  // ===========================================================================
  // Schema v3 tables
  // ===========================================================================

  group('LocalSubtasks CRUD', () {
    late AppDatabase db;

    setUp(() {
      db = _createTestDb();
    });

    tearDown(() async {
      await db.close();
    });

    test('insert subtask', () async {
      await db.into(db.localSubtasks).insert(
        LocalSubtasksCompanion.insert(
          id: 'sub-1',
          taskId: 'task-1',
          title: 'Write tests',
        ),
      );

      final rows = await db.select(db.localSubtasks).get();
      expect(rows.length, 1);
      expect(rows.first.title, 'Write tests');
      expect(rows.first.isCompleted, false);
      expect(rows.first.sortOrder, 0);
    });

    test('complete subtask', () async {
      await db.into(db.localSubtasks).insert(
        LocalSubtasksCompanion.insert(
          id: 'sub-2',
          taskId: 'task-1',
          title: 'Review code',
        ),
      );

      await (db.update(db.localSubtasks)
            ..where((t) => t.id.equals('sub-2')))
          .write(
        const LocalSubtasksCompanion(isCompleted: Value(true)),
      );

      final row = await (db.select(db.localSubtasks)
            ..where((t) => t.id.equals('sub-2')))
          .getSingle();
      expect(row.isCompleted, true);
    });

    test('reorder subtasks', () async {
      await db.batch((batch) {
        batch.insertAll(db.localSubtasks, [
          LocalSubtasksCompanion.insert(
            id: 'sub-a', taskId: 'task-1', title: 'First',
          ),
          LocalSubtasksCompanion.insert(
            id: 'sub-b', taskId: 'task-1', title: 'Second',
            sortOrder: const Value(1),
          ),
        ]);
      });

      final rows = await (db.select(db.localSubtasks)
            ..orderBy([(t) => OrderingTerm.asc(t.sortOrder)]))
          .get();
      expect(rows.first.title, 'First');
      expect(rows.last.title, 'Second');
    });
  });

  group('LocalTags CRUD', () {
    late AppDatabase db;

    setUp(() {
      db = _createTestDb();
    });

    tearDown(() async {
      await db.close();
    });

    test('insert tag', () async {
      await db.into(db.localTags).insert(
        LocalTagsCompanion.insert(
          id: 'tag-1',
          name: 'urgent',
          color: const Value('#FF0000'),
        ),
      );

      final rows = await db.select(db.localTags).get();
      expect(rows.length, 1);
      expect(rows.first.name, 'urgent');
      expect(rows.first.color, '#FF0000');
    });

    test('default color is purple', () async {
      await db.into(db.localTags).insert(
        LocalTagsCompanion.insert(
          id: 'tag-2',
          name: 'work',
        ),
      );

      final row = await (db.select(db.localTags)
            ..where((t) => t.id.equals('tag-2')))
          .getSingle();
      expect(row.color, '#6C5CE7');
    });
  });

  group('LocalTaskTags CRUD', () {
    late AppDatabase db;

    setUp(() {
      db = _createTestDb();
    });

    tearDown(() async {
      await db.close();
    });

    test('assign tag to task', () async {
      await db.into(db.localTaskTags).insert(
        LocalTaskTagsCompanion.insert(
          taskId: 'task-1',
          tagId: 'tag-1',
        ),
      );

      final rows = await db.select(db.localTaskTags).get();
      expect(rows.length, 1);
      expect(rows.first.taskId, 'task-1');
      expect(rows.first.tagId, 'tag-1');
    });

    test('multiple tags per task', () async {
      await db.batch((batch) {
        batch.insertAll(db.localTaskTags, [
          LocalTaskTagsCompanion.insert(taskId: 'task-1', tagId: 'tag-1'),
          LocalTaskTagsCompanion.insert(taskId: 'task-1', tagId: 'tag-2'),
          LocalTaskTagsCompanion.insert(taskId: 'task-1', tagId: 'tag-3'),
        ]);
      });

      final rows = await (db.select(db.localTaskTags)
            ..where((t) => t.taskId.equals('task-1')))
          .get();
      expect(rows.length, 3);
    });
  });

  group('LocalTimeBlocks CRUD', () {
    late AppDatabase db;

    setUp(() {
      db = _createTestDb();
    });

    tearDown(() async {
      await db.close();
    });

    test('insert time block', () async {
      await db.into(db.localTimeBlocks).insert(
        LocalTimeBlocksCompanion.insert(
          id: 'tb-1',
          taskId: 'task-1',
          blockDate: DateTime(2026, 3, 10),
          startHour: 9,
          startMinute: 0,
          durationMinutes: 60,
        ),
      );

      final rows = await db.select(db.localTimeBlocks).get();
      expect(rows.length, 1);
      expect(rows.first.startHour, 9);
      expect(rows.first.durationMinutes, 60);
    });

    test('query time blocks for a date', () async {
      final date = DateTime(2026, 3, 10);
      await db.batch((batch) {
        batch.insertAll(db.localTimeBlocks, [
          LocalTimeBlocksCompanion.insert(
            id: 'tb-a', taskId: 'task-1', blockDate: date,
            startHour: 9, startMinute: 0, durationMinutes: 30,
          ),
          LocalTimeBlocksCompanion.insert(
            id: 'tb-b', taskId: 'task-2', blockDate: date,
            startHour: 10, startMinute: 30, durationMinutes: 45,
          ),
          LocalTimeBlocksCompanion.insert(
            id: 'tb-c', taskId: 'task-3',
            blockDate: DateTime(2026, 3, 11), // different date
            startHour: 14, startMinute: 0, durationMinutes: 60,
          ),
        ]);
      });

      final rows = await (db.select(db.localTimeBlocks)
            ..where((t) => t.blockDate.equals(date))
            ..orderBy([(t) => OrderingTerm.asc(t.startHour)]))
          .get();
      expect(rows.length, 2);
      expect(rows.first.startHour, 9);
      expect(rows.last.startHour, 10);
    });
  });
}
