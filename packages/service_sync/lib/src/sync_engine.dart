import 'dart:async';

import 'package:unjynx_core/events/event_bus.dart';
import 'package:unjynx_core/events/app_events.dart';

import 'lww_resolver.dart';
import 'sync_port.dart';
import 'sync_status.dart';

/// Offline-first sync engine with field-level Last-Write-Wins (LWW)
/// conflict resolution.
///
/// **Strategy:**
/// 1. All writes go to local DB first (offline-first)
/// 2. On sync trigger (connectivity change, timer, manual):
///    a. Push: Send records with `needsSync = true` to server
///    b. Pull: Fetch server changes since last sync timestamp
///    c. Merge: Resolve conflicts using field-level LWW
///    d. Store: Save merged records locally
/// 3. Emit events via EventBus for UI updates
///
/// **LWW Details:**
/// - Each field has its own timestamp (not just the record)
/// - When two versions conflict, each field is resolved independently
/// - The field with the later timestamp wins
/// - Ties go to the server (remote authority)
/// - Deletes propagate (if either side deletes, it's deleted)
///
/// **Retry:**
/// - On network failure, retries with exponential backoff (1s, 2s, 4s)
/// - Retries are per-entity-type, so a failure in one type does not
///   block others
/// - Data is never corrupted: local state is only updated after
///   successful merge
class SyncEngine {
  final SyncLocalPort _local;
  final SyncRemotePort _remote;
  final EventBus _eventBus;
  final LwwResolver _resolver;
  final List<String> _entityTypes;
  final int _maxRetries;

  SyncStatus _status = SyncStatus.idle;
  Timer? _periodicTimer;
  Timer? _debounceSyncTimer;
  StreamSubscription<AppEvent>? _mutationSub;

  SyncEngine({
    required SyncLocalPort local,
    required SyncRemotePort remote,
    required EventBus eventBus,
    required List<String> entityTypes,
    LwwResolver resolver = const LwwResolver(),
    int maxRetries = 3,
  })  : _local = local,
        _remote = remote,
        _eventBus = eventBus,
        _entityTypes = entityTypes,
        _resolver = resolver,
        _maxRetries = maxRetries;

  /// Current sync status.
  SyncStatus get status => _status;

  /// Start periodic sync (every [interval]) and event-driven sync.
  ///
  /// Event-driven sync triggers ~2 seconds after the last data mutation
  /// (TaskCreated, TaskUpdated, etc.), debouncing rapid successive edits.
  void startPeriodicSync({Duration interval = const Duration(minutes: 5)}) {
    _periodicTimer?.cancel();
    _periodicTimer = Timer.periodic(interval, (_) => sync());
    _startEventDrivenSync();
  }

  /// Stop periodic and event-driven sync.
  void stopPeriodicSync() {
    _periodicTimer?.cancel();
    _periodicTimer = null;
    _mutationSub?.cancel();
    _mutationSub = null;
    _debounceSyncTimer?.cancel();
    _debounceSyncTimer = null;
  }

  /// Listen for data mutation events and trigger debounced sync.
  void _startEventDrivenSync() {
    _mutationSub?.cancel();
    _mutationSub = _eventBus.stream.where((e) =>
        e is TaskCreated ||
        e is TaskUpdated ||
        e is TaskDeleted ||
        e is TaskCompleted ||
        e is ProjectCreated ||
        e is ProjectArchived).listen((_) {
      _debounceSyncTimer?.cancel();
      _debounceSyncTimer = Timer(const Duration(seconds: 2), () => sync());
    });
  }

  /// Trigger an immediate sync cycle.
  ///
  /// Convenience alias for [sync] — use from UI pull-to-refresh or after
  /// a mutation when you want to bypass the 2-second debounce.
  Future<SyncSummary> syncNow() => sync();

  /// Perform a full sync cycle for all entity types.
  ///
  /// Returns a [SyncSummary] with the results.
  Future<SyncSummary> sync() async {
    if (_status == SyncStatus.syncing) {
      return SyncSummary(
        pushed: 0,
        pulled: 0,
        conflictsResolved: 0,
        errors: const ['Sync already in progress'],
        completedAt: DateTime.now(),
      );
    }

    _status = SyncStatus.syncing;
    _eventBus.publish(SyncStarted());

    var totalPushed = 0;
    var totalPulled = 0;
    var totalConflicts = 0;
    final errors = <String>[];

    // Check connectivity first
    final online = await _remote.isOnline();
    if (!online) {
      _status = SyncStatus.offline;
      return SyncSummary(
        pushed: 0,
        pulled: 0,
        conflictsResolved: 0,
        errors: const ['Device is offline'],
        completedAt: DateTime.now(),
      );
    }

    for (final entityType in _entityTypes) {
      try {
        final result = await _syncEntityType(entityType);
        totalPushed += result.pushed;
        totalPulled += result.pulled;
        totalConflicts += result.conflictsResolved;
      } on Exception catch (e) {
        errors.add('$entityType: $e');
      }
    }

    final summary = SyncSummary(
      pushed: totalPushed,
      pulled: totalPulled,
      conflictsResolved: totalConflicts,
      errors: errors,
      completedAt: DateTime.now(),
    );

    if (errors.isEmpty) {
      _status = SyncStatus.completed;
      _eventBus.publish(SyncCompleted(
        pushed: totalPushed,
        pulled: totalPulled,
      ));
    } else {
      _status = SyncStatus.error;
      _eventBus.publish(SyncFailed(error: errors.join('; ')));
    }

    // Reset to idle after a delay
    Future<void>.delayed(const Duration(seconds: 2), () {
      if (_status == SyncStatus.completed || _status == SyncStatus.error) {
        _status = SyncStatus.idle;
      }
    });

    return summary;
  }

  /// Sync a single entity type (push then pull then merge).
  ///
  /// Retries up to [_maxRetries] times on transient network failures
  /// with exponential backoff (1s, 2s, 4s, ...). Local data is never
  /// corrupted because saves only happen after successful remote calls.
  Future<_EntitySyncResult> _syncEntityType(String entityType) async {
    var lastException = Exception('unknown');
    for (var attempt = 0; attempt <= _maxRetries; attempt++) {
      try {
        return await _syncEntityTypeOnce(entityType);
      } on Exception catch (e) {
        lastException = e;
        if (attempt < _maxRetries) {
          // Exponential backoff: 1s, 2s, 4s, ...
          await Future<void>.delayed(
            Duration(seconds: 1 << attempt),
          );
        }
      }
    }
    throw lastException;
  }

  /// Single attempt to sync an entity type (push then pull then merge).
  Future<_EntitySyncResult> _syncEntityTypeOnce(String entityType) async {
    var pushed = 0;
    var pulled = 0;
    var conflicts = 0;

    // Phase 1: Push local changes
    final pending = await _local.getPendingSync(entityType);
    if (pending.isNotEmpty) {
      final serverVersions = await _remote.push(entityType, pending);
      pushed = pending.length;

      // Merge server responses back (server may have modified records)
      for (final serverRecord in serverVersions) {
        final localRecord = await _local.getById(entityType, serverRecord.id);
        if (localRecord != null) {
          final result = _resolver.merge(localRecord, serverRecord);
          await _local.save(result.record.markSynced());
          if (result.conflictedFields.isNotEmpty) {
            conflicts += result.conflictedFields.length;
          }
        }
      }

      // Mark pushed records as synced
      await _local.markSynced(
        entityType,
        pending.map((r) => r.id).toList(),
      );
    }

    // Phase 2: Pull remote changes
    final lastSync = await _local.getLastSyncTimestamp(entityType);
    final remoteChanges = await _remote.pull(entityType, lastSync);
    pulled = remoteChanges.length;

    // Phase 3: Merge remote changes with local state
    for (final remoteRecord in remoteChanges) {
      final localRecord = await _local.getById(entityType, remoteRecord.id);

      if (localRecord == null) {
        // New record from server — just save it
        await _local.save(remoteRecord.markSynced());
      } else {
        // Existing record — merge using LWW
        final result = _resolver.merge(localRecord, remoteRecord);
        await _local.save(result.record);
        if (result.conflictedFields.isNotEmpty) {
          conflicts += result.conflictedFields.length;
        }
      }
    }

    // Update last sync timestamp
    await _local.setLastSyncTimestamp(entityType, DateTime.now());

    return _EntitySyncResult(
      pushed: pushed,
      pulled: pulled,
      conflictsResolved: conflicts,
    );
  }

  /// Dispose the sync engine.
  void dispose() {
    stopPeriodicSync();
  }
}

class _EntitySyncResult {
  final int pushed;
  final int pulled;
  final int conflictsResolved;

  const _EntitySyncResult({
    required this.pushed,
    required this.pulled,
    required this.conflictsResolved,
  });
}
