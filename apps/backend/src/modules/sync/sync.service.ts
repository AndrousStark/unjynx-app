import type { SyncMetadataEntry } from "../../db/schema/index.js";
import type { SyncRecord, SyncAck, SyncStatusEntry } from "./sync.schema.js";
import * as syncRepo from "./sync.repository.js";

/**
 * Accept an array of sync records from the client.
 * Each record is merged using LWW (Last-Write-Wins) based on clientTimestamp.
 * Returns an acknowledgment for each record indicating acceptance.
 */
export async function push(
  profileId: string,
  records: readonly SyncRecord[],
): Promise<readonly SyncAck[]> {
  const acks: SyncAck[] = [];

  for (const record of records) {
    const { entry, accepted } = await syncRepo.upsertWithLWW(
      profileId,
      record.entityType,
      record.entityId,
      record.operation,
      record.clientTimestamp,
      record.deviceId,
    );

    acks.push({
      entityType: record.entityType,
      entityId: record.entityId,
      serverTimestamp: entry.serverTimestamp,
      accepted,
      reason: accepted ? undefined : "Server has newer timestamp (LWW)",
    });
  }

  return acks;
}

/**
 * Return all sync metadata entries changed after the given timestamp.
 * The client uses this to pull down server-side changes.
 */
export async function pull(
  profileId: string,
  since: Date,
  entityTypes?: readonly string[],
): Promise<readonly SyncMetadataEntry[]> {
  return syncRepo.findChangedSince(profileId, since, entityTypes);
}

/**
 * Return the last sync time and record count per entity type for the user.
 */
export async function getStatus(
  profileId: string,
): Promise<readonly SyncStatusEntry[]> {
  return syncRepo.getSyncStatus(profileId);
}
