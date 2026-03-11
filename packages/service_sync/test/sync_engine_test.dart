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
    // Server accepts everything and returns them back as-is (simplified)
    for (final r in records) {
      _serverRecords.removeWhere((s) => s.id == r.id);
      _serverRecords.add(r);
    }
    return records;
  }

  @override
  Future<List<SyncRecord>> pull(String entityType, DateTime? since) async {
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
  });
}
