/// Port for data synchronization between local and remote.
///
/// Uses field-level Last-Write-Wins conflict resolution.
abstract class SyncPort {
  /// Start the sync engine.
  Future<void> start();

  /// Stop the sync engine.
  Future<void> stop();

  /// Force an immediate sync.
  Future<SyncResult> syncNow();

  /// Get the current sync status.
  SyncStatus get status;

  /// Stream of sync status changes.
  Stream<SyncStatus> get statusStream;
}

/// Result of a sync operation.
class SyncResult {
  final int pushed;
  final int pulled;
  final int conflicts;
  final List<String> errors;

  const SyncResult({
    required this.pushed,
    required this.pulled,
    this.conflicts = 0,
    this.errors = const [],
  });

  bool get hasErrors => errors.isNotEmpty;
}

/// Current sync engine status.
enum SyncStatus {
  idle,
  syncing,
  error,
  offline,
}
