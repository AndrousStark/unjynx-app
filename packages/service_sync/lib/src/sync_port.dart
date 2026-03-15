import 'sync_record.dart';

/// Port interface for sync operations.
///
/// The sync engine uses these to interact with local storage
/// and remote API without knowing the concrete implementations.
abstract class SyncLocalPort {
  /// Get all records that have local changes not yet pushed.
  Future<List<SyncRecord>> getPendingSync(String entityType);

  /// Get a record by its ID.
  Future<SyncRecord?> getById(String entityType, String id);

  /// Save a merged record locally.
  Future<void> save(SyncRecord record);

  /// Save multiple merged records locally (batch).
  Future<void> saveAll(List<SyncRecord> records);

  /// Mark records as synced (no longer need push).
  Future<void> markSynced(String entityType, List<String> ids);

  /// Get the last sync timestamp for an entity type.
  Future<DateTime?> getLastSyncTimestamp(String entityType);

  /// Store the last sync timestamp for an entity type.
  Future<void> setLastSyncTimestamp(String entityType, DateTime timestamp);
}

/// Port interface for remote API sync operations.
abstract class SyncRemotePort {
  /// Push local changes to the server.
  /// Returns the server's version of the records after applying changes.
  Future<List<SyncRecord>> push(
    String entityType,
    List<SyncRecord> records,
  );

  /// Pull changes from the server since the given timestamp.
  Future<List<SyncRecord>> pull(
    String entityType,
    DateTime? since,
  );

  /// Check if the remote server is reachable.
  Future<bool> isOnline();
}
