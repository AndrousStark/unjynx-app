import 'sync_record.dart';

/// Resolves conflicts between local and remote versions using
/// field-level Last-Write-Wins (LWW) strategy.
///
/// Each field has its own timestamp. When local and remote have
/// different values for a field, the one with the later timestamp wins.
/// This provides fine-grained conflict resolution without losing data
/// from non-conflicting fields.
class LwwResolver {
  const LwwResolver();

  /// Merge a local record with a remote record.
  ///
  /// Returns the merged record that should be stored locally.
  /// Also returns a [MergeResult] indicating what happened.
  MergeResult merge(SyncRecord local, SyncRecord remote) {
    assert(local.id == remote.id, 'Cannot merge records with different IDs');
    assert(
      local.entityType == remote.entityType,
      'Cannot merge records of different entity types',
    );

    // If remote is deleted and local isn't, remote wins (delete propagates)
    if (remote.isDeleted && !local.isDeleted) {
      return MergeResult(
        record: remote.markSynced(),
        outcome: MergeOutcome.remoteWins,
        conflictedFields: const [],
      );
    }

    // If local is deleted and remote isn't, local wins (local delete pending push)
    if (local.isDeleted && !remote.isDeleted) {
      return MergeResult(
        record: local,
        outcome: MergeOutcome.localWins,
        conflictedFields: const [],
      );
    }

    // Both deleted — pick the later one
    if (local.isDeleted && remote.isDeleted) {
      final winner =
          local.updatedAt.isAfter(remote.updatedAt) ? local : remote;
      return MergeResult(
        record: winner.markSynced(),
        outcome: MergeOutcome.merged,
        conflictedFields: const [],
      );
    }

    // Field-level LWW merge
    final mergedFields = <String, Object?>{};
    final mergedTimestamps = <String, DateTime>{};
    final conflictedFields = <String>[];

    // Collect all field keys from both records
    final allKeys = <String>{
      ...local.fields.keys,
      ...remote.fields.keys,
    };

    for (final key in allKeys) {
      final localTimestamp = local.fieldTimestamps[key];
      final remoteTimestamp = remote.fieldTimestamps[key];

      // Only in local (new local field)
      if (remoteTimestamp == null) {
        mergedFields[key] = local.fields[key];
        mergedTimestamps[key] = localTimestamp!;
        continue;
      }

      // Only in remote (new remote field)
      if (localTimestamp == null) {
        mergedFields[key] = remote.fields[key];
        mergedTimestamps[key] = remoteTimestamp;
        continue;
      }

      // Both have the field — compare timestamps
      if (localTimestamp.isAfter(remoteTimestamp)) {
        mergedFields[key] = local.fields[key];
        mergedTimestamps[key] = localTimestamp;
        if (local.fields[key] != remote.fields[key]) {
          conflictedFields.add(key);
        }
      } else if (remoteTimestamp.isAfter(localTimestamp)) {
        mergedFields[key] = remote.fields[key];
        mergedTimestamps[key] = remoteTimestamp;
        if (local.fields[key] != remote.fields[key]) {
          conflictedFields.add(key);
        }
      } else {
        // Same timestamp — prefer remote (server authority tiebreaker)
        mergedFields[key] = remote.fields[key];
        mergedTimestamps[key] = remoteTimestamp;
      }
    }

    final maxTimestamp = mergedTimestamps.values.fold<DateTime>(
      local.createdAt,
      (max, ts) => ts.isAfter(max) ? ts : max,
    );

    final outcome = conflictedFields.isEmpty
        ? MergeOutcome.noConflict
        : MergeOutcome.merged;

    final needsSync = conflictedFields.any((key) {
      final lt = local.fieldTimestamps[key];
      final rt = remote.fieldTimestamps[key];
      return lt != null && rt != null && lt.isAfter(rt);
    });

    return MergeResult(
      record: SyncRecord(
        id: local.id,
        entityType: local.entityType,
        fields: mergedFields,
        fieldTimestamps: mergedTimestamps,
        updatedAt: maxTimestamp,
        createdAt: local.createdAt,
        needsSync: needsSync,
      ),
      outcome: outcome,
      conflictedFields: conflictedFields,
    );
  }
}

/// The result of merging two records.
class MergeResult {
  /// The merged record to store locally.
  final SyncRecord record;

  /// What happened during the merge.
  final MergeOutcome outcome;

  /// Fields where both sides had different values (resolved by LWW).
  final List<String> conflictedFields;

  const MergeResult({
    required this.record,
    required this.outcome,
    required this.conflictedFields,
  });
}

/// Describes the outcome of a merge operation.
enum MergeOutcome {
  /// No conflicts — records were identical or one was a superset.
  noConflict,

  /// Both had changes, merged field-by-field using LWW.
  merged,

  /// Local version was used entirely.
  localWins,

  /// Remote version was used entirely.
  remoteWins,
}
