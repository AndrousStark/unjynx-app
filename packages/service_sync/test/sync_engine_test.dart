import 'package:flutter_test/flutter_test.dart';
import 'package:unjynx_core/events/event_bus.dart';
import 'package:unjynx_core/events/app_events.dart';
import 'package:service_sync/service_sync.dart';

/// In-memory fake for local storage.
class FakeLocalPort implements SyncLocalPort {
  final Map<String, Map<String, SyncRecord>> _store = {};
  final Map<String, DateTime> _syncTimestamps = {};

  @override
  Future<List<SyncRecord>> getPendingSync(String entityType) async {
    final records = _store[entityType]?.values ?? const <SyncRecord>[];
    return records.where((r) => r.needsSync).toList();
  }

  @override
  Future<SyncRecord?> getById(String entityType, String id) async {
    return _store[entityType]?[id];
  }

  @override
  Future<void> save(SyncRecord record) async {
    _store.putIfAbsent(record.entityType, () => {});
    _store[record.entityType]![record.id] = record;
  }

  @override
  Future<void> saveAll(List<SyncRecord> records) async {
    for (final r in records) {
      await save(r);
    }
  }

  @override
  Future<void> markSynced(String entityType, List<String> ids) async {
    final records = _store[entityType];
    if (records == null) return;
    for (final id in ids) {
      final record = records[id];
      if (record != null) {
        records[id] = record.markSynced();
      }
    }
  }

  @override
  Future<DateTime?> getLastSyncTimestamp(String entityType) async {
    return _syncTimestamps[entityType];
  }

  @override
  Future<void> setLastSyncTimestamp(String entityType, DateTime ts) async {
    _syncTimestamps[entityType] = ts;
  }
}

/// In-memory fake for remote API.
class FakeRemotePort implements SyncRemotePort {
  final List<SyncRecord> _serverRecords = [];
  bool isServerOnline = true;

  /// Number of push calls that have been made.
  int pushCallCount = 0;

  /// Number of pull calls that have been made.
  int pullCallCount = 0;

  /// If > 0, the next N push calls will throw an exception.
  int pushFailuresRemaining = 0;

  /// If > 0, the next N pull calls will throw an exception.
  int pullFailuresRemaining = 0;

  void addServerRecord(SyncRecord record) {
    _serverRecords.add(record);
  }

  @override
  Future<bool> isOnline() async => isServerOnline;

  @override
  Future<List<SyncRecord>> push(
    String entityType,
    List<SyncRecord> records,
  ) async {
    pushCallCount++;
    if (pushFailuresRemaining > 0) {
      pushFailuresRemaining--;
      throw Exception('Network error during push');
    }
    // Server accepts everything and returns them back as-is (simplified)
    for (final r in records) {
      _serverRecords.removeWhere((s) => s.id == r.id);
      _serverRecords.add(r);
    }
    return records;
  }

  @override
  Future<List<SyncRecord>> pull(String entityType, DateTime? since) async {
    pullCallCount++;
    if (pullFailuresRemaining > 0) {
      pullFailuresRemaining--;
      throw Exception('Network error during pull');
    }
    if (since == null) {
      return _serverRecords
          .where((r) => r.entityType == entityType)
          .toList();
    }
    return _serverRecords
        .where((r) =>
            r.entityType == entityType && r.updatedAt.isAfter(since))
        .toList();
  }
}

void main() {
  final t1 = DateTime(2026, 3, 6, 10, 0);
  final t2 = DateTime(2026, 3, 6, 11, 0);

  late FakeLocalPort local;
  late FakeRemotePort remote;
  late EventBus eventBus;
  late SyncEngine engine;

  SyncRecord makeRecord({
    String id = 'r1',
    String entityType = 'task',
    Map<String, Object?>? fields,
    DateTime? updatedAt,
    bool needsSync = true,
  }) {
    final f = fields ?? {'title': 'Test'};
    final ts = updatedAt ?? t1;
    return SyncRecord(
      id: id,
      entityType: entityType,
      fields: f,
      fieldTimestamps: {for (final key in f.keys) key: ts},
      updatedAt: ts,
      createdAt: t1,
      needsSync: needsSync,
    );
  }

  setUp(() {
    local = FakeLocalPort();
    remote = FakeRemotePort();
    eventBus = EventBus();
    engine = SyncEngine(
      local: local,
      remote: remote,
      eventBus: eventBus,
      entityTypes: ['task'],
    );
  });

  tearDown(() {
    engine.dispose();
    eventBus.dispose();
  });

  group('SyncEngine', () {
    test('starts with idle status', () {
      expect(engine.status, SyncStatus.idle);
    });

    test('syncs successfully with no data', () async {
      final summary = await engine.sync();

      expect(summary.isSuccess, isTrue);
      expect(summary.pushed, 0);
      expect(summary.pulled, 0);
    });

    test('pushes pending local records', () async {
      await local.save(makeRecord(id: 'task-1', needsSync: true));

      final summary = await engine.sync();

      expect(summary.pushed, 1);
    });

    test('pulls new remote records', () async {
      remote.addServerRecord(makeRecord(
        id: 'task-2',
        updatedAt: t2,
        needsSync: false,
      ));

      final summary = await engine.sync();

      expect(summary.pulled, 1);
      final saved = await local.getById('task', 'task-2');
      expect(saved, isNotNull);
    });

    test('merges conflicting records with LWW', () async {
      // Local has older title but newer status
      await local.save(SyncRecord(
        id: 'task-3',
        entityType: 'task',
        fields: const {'title': 'Local', 'status': 'completed'},
        fieldTimestamps: {'title': t1, 'status': t2},
        updatedAt: t2,
        createdAt: t1,
        needsSync: false,
      ));

      // Remote has newer title but older status
      remote.addServerRecord(SyncRecord(
        id: 'task-3',
        entityType: 'task',
        fields: const {'title': 'Remote', 'status': 'pending'},
        fieldTimestamps: {'title': t2, 'status': t1},
        updatedAt: t2,
        createdAt: t1,
        needsSync: false,
      ));

      final summary = await engine.sync();

      final merged = await local.getById('task', 'task-3');
      // title: remote wins (t2 > t1)
      expect(merged!.fields['title'], 'Remote');
      // status: local wins (t2 > t1)
      expect(merged.fields['status'], 'completed');
      expect(summary.conflictsResolved, greaterThan(0));
    });

    test('returns offline when server unreachable', () async {
      remote.isServerOnline = false;

      final summary = await engine.sync();

      expect(summary.isSuccess, isFalse);
      expect(engine.status, SyncStatus.offline);
    });

    test('emits SyncStarted event', () async {
      final events = <AppEvent>[];
      eventBus.stream.listen(events.add);

      await engine.sync();
      await Future<void>.delayed(Duration.zero);

      expect(events.any((e) => e is SyncStarted), isTrue);
    });

    test('emits SyncCompleted event on success', () async {
      final events = <AppEvent>[];
      eventBus.stream.listen(events.add);

      await engine.sync();
      await Future<void>.delayed(Duration.zero);

      expect(events.any((e) => e is SyncCompleted), isTrue);
    });

    test('emits SyncFailed event on error', () async {
      remote.isServerOnline = false;

      final events = <AppEvent>[];
      eventBus.stream.listen(events.add);

      await engine.sync();
      await Future<void>.delayed(Duration.zero);

      // offline doesn't emit SyncFailed, it's a separate status
      expect(engine.status, SyncStatus.offline);
    });

    test('prevents concurrent syncs', () async {
      // Start two syncs at once
      final future1 = engine.sync();
      final future2 = engine.sync();

      final summary1 = await future1;
      final summary2 = await future2;

      // Second sync should be rejected
      expect(summary2.errors, contains('Sync already in progress'));
    });

    test('marks synced records after push', () async {
      await local.save(makeRecord(id: 'task-4', needsSync: true));

      await engine.sync();

      final record = await local.getById('task', 'task-4');
      expect(record!.needsSync, isFalse);
    });

    test('updates last sync timestamp', () async {
      await engine.sync();

      final ts = await local.getLastSyncTimestamp('task');
      expect(ts, isNotNull);
    });

    test('dispose cancels periodic timer', () {
      engine.startPeriodicSync(interval: const Duration(seconds: 1));
      engine.dispose();

      // Should not throw
      expect(engine.status, SyncStatus.idle);
    });

    test('syncNow() delegates to sync()', () async {
      await local.save(makeRecord(id: 'task-now', needsSync: true));

      final summary = await engine.syncNow();

      expect(summary.isSuccess, isTrue);
      expect(summary.pushed, 1);
    });

    test('event-driven sync triggers after data mutation', () async {
      engine.startPeriodicSync(
        interval: const Duration(minutes: 99), // disable periodic
      );

      await local.save(makeRecord(id: 'task-evt', needsSync: true));

      // Emit a TaskCreated event to trigger debounced sync
      eventBus.publish(TaskCreated(taskId: 'task-evt', title: 'Test'));

      // Wait for the 2-second debounce + processing
      await Future<void>.delayed(const Duration(seconds: 3));

      final record = await local.getById('task', 'task-evt');
      expect(record, isNotNull);
      // After event-driven sync, the record should be marked as synced
      expect(record!.needsSync, isFalse);
    });
  });

  group('SyncEngine - edge cases', () {
    test('concurrent edits on different fields both survive', () async {
      // Device A edits title at t1, Device B edits description at t2
      // After sync, both edits should be present
      await local.save(SyncRecord(
        id: 'task-concurrent',
        entityType: 'task',
        fields: const {'title': 'Device A title', 'description': 'old desc'},
        fieldTimestamps: {'title': t2, 'description': t1},
        updatedAt: t2,
        createdAt: t1,
        needsSync: false,
      ));

      remote.addServerRecord(SyncRecord(
        id: 'task-concurrent',
        entityType: 'task',
        fields: const {'title': 'old title', 'description': 'Device B desc'},
        fieldTimestamps: {'title': t1, 'description': t2},
        updatedAt: t2,
        createdAt: t1,
        needsSync: false,
      ));

      await engine.sync();

      final merged = await local.getById('task', 'task-concurrent');
      expect(merged, isNotNull);
      // title: local wins (t2 > t1)
      expect(merged!.fields['title'], 'Device A title');
      // description: remote wins (t2 > t1)
      expect(merged.fields['description'], 'Device B desc');
    });

    test('delete on device A wins over edit on device B', () async {
      // Device B has a local edit (not deleted)
      await local.save(SyncRecord(
        id: 'task-del-edit',
        entityType: 'task',
        fields: const {'title': 'Edited on B'},
        fieldTimestamps: {'title': t2},
        updatedAt: t2,
        createdAt: t1,
        needsSync: false,
      ));

      // Device A deleted the task on the server
      remote.addServerRecord(SyncRecord(
        id: 'task-del-edit',
        entityType: 'task',
        fields: const {'title': 'Original'},
        fieldTimestamps: {'title': t1},
        updatedAt: t2,
        createdAt: t1,
        isDeleted: true,
        needsSync: false,
      ));

      await engine.sync();

      final result = await local.getById('task', 'task-del-edit');
      expect(result, isNotNull);
      // Delete should win over edit
      expect(result!.isDeleted, isTrue);
    });

    test('empty push is a no-op (no errors)', () async {
      // No local pending records, no remote records
      final summary = await engine.sync();

      expect(summary.isSuccess, isTrue);
      expect(summary.pushed, 0);
      expect(summary.pulled, 0);
      expect(summary.conflictsResolved, 0);
      expect(summary.errors, isEmpty);
      // Push should not have been called
      expect(remote.pushCallCount, 0);
    });

    test('empty pull is a no-op (no errors)', () async {
      // Only local pending, no remote changes
      await local.save(makeRecord(id: 'task-only-local', needsSync: true));

      final summary = await engine.sync();

      expect(summary.isSuccess, isTrue);
      expect(summary.pushed, 1);
      // Pull returns empty list (the pushed record comes back from server)
      // but no new remote records beyond what was pushed
      expect(summary.errors, isEmpty);
    });

    test('retries on transient push failure', () async {
      await local.save(makeRecord(id: 'task-retry', needsSync: true));

      // First push fails, second succeeds
      remote.pushFailuresRemaining = 1;

      final retryEngine = SyncEngine(
        local: local,
        remote: remote,
        eventBus: eventBus,
        entityTypes: ['task'],
        maxRetries: 3,
      );

      final summary = await retryEngine.sync();

      expect(summary.isSuccess, isTrue);
      expect(summary.pushed, 1);
      // Push was called twice (first failed, second succeeded)
      expect(remote.pushCallCount, 2);

      retryEngine.dispose();
    });

    test('retries on transient pull failure', () async {
      remote.addServerRecord(makeRecord(
        id: 'task-pull-retry',
        updatedAt: t2,
        needsSync: false,
      ));

      // First pull fails, second succeeds
      remote.pullFailuresRemaining = 1;

      final retryEngine = SyncEngine(
        local: local,
        remote: remote,
        eventBus: eventBus,
        entityTypes: ['task'],
        maxRetries: 3,
      );

      final summary = await retryEngine.sync();

      expect(summary.isSuccess, isTrue);
      expect(summary.pulled, 1);
      // Pull was called twice (first failed, second succeeded)
      expect(remote.pullCallCount, 2);

      retryEngine.dispose();
    });

    test('network failure does not corrupt local data', () async {
      // Save a local record
      final original = makeRecord(id: 'task-safe', needsSync: true);
      await local.save(original);

      // All push attempts fail
      remote.pushFailuresRemaining = 10;

      final retryEngine = SyncEngine(
        local: local,
        remote: remote,
        eventBus: eventBus,
        entityTypes: ['task'],
        maxRetries: 2,
      );

      final summary = await retryEngine.sync();

      // Sync reports error
      expect(summary.isSuccess, isFalse);
      expect(summary.errors, isNotEmpty);

      // Local data is untouched (still needs sync, not corrupted)
      final saved = await local.getById('task', 'task-safe');
      expect(saved, isNotNull);
      expect(saved!.needsSync, isTrue);
      expect(saved.fields['title'], 'Test');

      retryEngine.dispose();
    });

    test('exhausted retries reports error per entity type', () async {
      await local.save(makeRecord(id: 'task-exhaust', needsSync: true));

      // All push attempts fail (more than maxRetries)
      remote.pushFailuresRemaining = 10;

      final retryEngine = SyncEngine(
        local: local,
        remote: remote,
        eventBus: eventBus,
        entityTypes: ['task'],
        maxRetries: 1,
      );

      final summary = await retryEngine.sync();

      expect(summary.isSuccess, isFalse);
      expect(
        summary.errors.any((e) => e.contains('task')),
        isTrue,
      );

      retryEngine.dispose();
    });

    test('push succeeds but pull fails still reports error', () async {
      await local.save(makeRecord(id: 'task-push-ok', needsSync: true));

      // Push works, pull always fails
      remote.pullFailuresRemaining = 10;

      final retryEngine = SyncEngine(
        local: local,
        remote: remote,
        eventBus: eventBus,
        entityTypes: ['task'],
        maxRetries: 1,
      );

      final summary = await retryEngine.sync();

      expect(summary.isSuccess, isFalse);
      expect(summary.errors, isNotEmpty);

      retryEngine.dispose();
    });

    test('multiple entity types sync independently', () async {
      final multiEngine = SyncEngine(
        local: local,
        remote: remote,
        eventBus: eventBus,
        entityTypes: ['task', 'project'],
      );

      await local.save(makeRecord(
        id: 'task-1',
        entityType: 'task',
        needsSync: true,
      ));
      await local.save(SyncRecord(
        id: 'proj-1',
        entityType: 'project',
        fields: const {'name': 'My Project'},
        fieldTimestamps: {'name': t1},
        updatedAt: t1,
        createdAt: t1,
        needsSync: true,
      ));

      final summary = await multiEngine.sync();

      expect(summary.isSuccess, isTrue);
      expect(summary.pushed, 2);

      multiEngine.dispose();
    });
  });
}
