/// Represents the current state of the sync engine.
enum SyncStatus {
  /// No sync in progress, all data is up to date.
  idle,

  /// Currently syncing (pushing and/or pulling).
  syncing,

  /// Sync completed successfully.
  completed,

  /// Sync failed (will retry).
  error,

  /// Device is offline, sync deferred.
  offline,
}

/// Summary of a completed sync operation.
class SyncSummary {
  /// Number of records pushed to the server.
  final int pushed;

  /// Number of records pulled from the server.
  final int pulled;

  /// Number of conflicts that were resolved.
  final int conflictsResolved;

  /// Errors encountered during sync (empty on success).
  final List<String> errors;

  /// When this sync completed.
  final DateTime completedAt;

  const SyncSummary({
    required this.pushed,
    required this.pulled,
    required this.conflictsResolved,
    required this.errors,
    required this.completedAt,
  });

  bool get isSuccess => errors.isEmpty;
}
