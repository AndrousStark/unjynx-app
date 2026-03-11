import 'dart:async';

import 'package:unjynx_core/events/event_bus.dart';
import 'package:unjynx_core/events/app_events.dart';

import 'lww_resolver.dart';
import 'sync_port.dart';
import 'sync_record.dart';
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
class SyncEngine {
  final SyncLocalPort _local;
  final SyncRemotePort _remote;
  final EventBus _eventBus;
  final LwwResolver _resolver;
  final List<String> _entityTypes;

  SyncStatus _status = SyncStatus.idle;
  Timer? _periodicTimer;

  SyncEngine({
    required SyncLocalPort local,
    required SyncRemotePort remote,
    required EventBus eventBus,
    required List<String> entityTypes,
    LwwResolver resolver = const LwwResolver(),
  })  : _local = local,
        _remote = remote,
        _eventBus = eventBus,
        _entityTypes = entityTypes,
        _resolver = resolver;

  /// Current sync status.
  SyncStatus get status => _status;

  /// Start periodic sync (every [interval]).
  void startPeriodicSync({Duration interval = const Duration(minutes: 5)}) {
    _periodicTimer?.cancel();
    _periodicTimer = Timer.periodic(interval, (_) => sync());
  }

  /// Stop periodic sync.
  void stopPeriodicSync() {
    _periodicTimer?.cancel();
    _periodicTimer = null;
  }

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
  Future<_EntitySyncResult> _syncEntityType(String entityType) async {
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
    _periodicTimer?.cancel();
    _periodicTimer = null;
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
