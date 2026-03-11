/// A record that can be synced between local and remote storage.
///
/// Each field has an [updatedAt] timestamp used for Last-Write-Wins
/// conflict resolution at the field level.
class SyncRecord {
  /// Unique ID of the record.
  final String id;

  /// The entity type (e.g. 'task', 'project').
  final String entityType;

  /// Field name-value pairs (the actual data).
  final Map<String, Object?> fields;

  /// Per-field timestamps for LWW. Key = field name, value = DateTime.
  /// When a field is updated, its timestamp is set to the current time.
  final Map<String, DateTime> fieldTimestamps;

  /// When the entire record was last modified (max of all field timestamps).
  final DateTime updatedAt;

  /// When the record was created.
  final DateTime createdAt;

  /// Whether this record has been deleted (soft delete for sync).
  final bool isDeleted;

  /// Whether this record has local changes that haven't been pushed.
  final bool needsSync;

  const SyncRecord({
    required this.id,
    required this.entityType,
    required this.fields,
    required this.fieldTimestamps,
    required this.updatedAt,
    required this.createdAt,
    this.isDeleted = false,
    this.needsSync = true,
  });

  /// Create a copy with updated fields and their timestamps.
  SyncRecord withUpdatedFields(
    Map<String, Object?> updatedFields,
    DateTime timestamp,
  ) {
    final newFields = Map<String, Object?>.from(fields)..addAll(updatedFields);
    final newTimestamps = Map<String, DateTime>.from(fieldTimestamps);
    for (final key in updatedFields.keys) {
      newTimestamps[key] = timestamp;
    }
    return SyncRecord(
      id: id,
      entityType: entityType,
      fields: newFields,
      fieldTimestamps: newTimestamps,
      updatedAt: timestamp,
      createdAt: createdAt,
      isDeleted: isDeleted,
      needsSync: true,
    );
  }

  /// Mark as synced (no longer needs push to server).
  SyncRecord markSynced() {
    return SyncRecord(
      id: id,
      entityType: entityType,
      fields: fields,
      fieldTimestamps: fieldTimestamps,
      updatedAt: updatedAt,
      createdAt: createdAt,
      isDeleted: isDeleted,
      needsSync: false,
    );
  }

  /// Mark as deleted (soft delete).
  SyncRecord markDeleted(DateTime timestamp) {
    return SyncRecord(
      id: id,
      entityType: entityType,
      fields: fields,
      fieldTimestamps: fieldTimestamps,
      updatedAt: timestamp,
      createdAt: createdAt,
      isDeleted: true,
      needsSync: true,
    );
  }
}
