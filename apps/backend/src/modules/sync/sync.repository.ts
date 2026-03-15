import { eq, and, gt, sql, desc, inArray } from "drizzle-orm";
import { db } from "../../db/index.js";
import {
  syncMetadata,
  type SyncMetadataEntry,
} from "../../db/schema/index.js";

/**
 * Find a sync metadata entry by user, entity type, and entity id.
 */
export async function findByEntity(
  userId: string,
  entityType: string,
  entityId: string,
): Promise<SyncMetadataEntry | undefined> {
  const [entry] = await db
    .select()
    .from(syncMetadata)
    .where(
      and(
        eq(syncMetadata.userId, userId),
        eq(syncMetadata.entityType, entityType),
        eq(syncMetadata.entityId, entityId),
      ),
    );

  return entry;
}

/**
 * Upsert a sync metadata entry using LWW (Last-Write-Wins).
 * Only updates if the incoming clientTimestamp is newer than the existing one.
 * Returns the entry and whether it was accepted.
 */
export async function upsertWithLWW(
  userId: string,
  entityType: string,
  entityId: string,
  operation: "create" | "update" | "delete",
  clientTimestamp: Date,
  deviceId: string | undefined,
): Promise<{ entry: SyncMetadataEntry; accepted: boolean }> {
  const existing = await findByEntity(userId, entityType, entityId);

  // LWW: reject if existing record has a newer or equal timestamp
  if (existing && existing.clientTimestamp >= clientTimestamp) {
    return { entry: existing, accepted: false };
  }

  if (existing) {
    const [updated] = await db
      .update(syncMetadata)
      .set({
        operation,
        clientTimestamp,
        serverTimestamp: new Date(),
        deviceId: deviceId ?? null,
      })
      .where(eq(syncMetadata.id, existing.id))
      .returning();

    return { entry: updated, accepted: true };
  }

  const [created] = await db
    .insert(syncMetadata)
    .values({
      userId,
      entityType,
      entityId,
      operation,
      clientTimestamp,
      serverTimestamp: new Date(),
      deviceId: deviceId ?? null,
    })
    .returning();

  return { entry: created, accepted: true };
}

/**
 * Find all sync metadata entries changed after a given timestamp for a user.
 * Optionally filter by entity types.
 */
export async function findChangedSince(
  userId: string,
  since: Date,
  entityTypes?: readonly string[],
): Promise<SyncMetadataEntry[]> {
  const conditions = [
    eq(syncMetadata.userId, userId),
    gt(syncMetadata.serverTimestamp, since),
  ];

  if (entityTypes && entityTypes.length > 0) {
    conditions.push(inArray(syncMetadata.entityType, [...entityTypes]));
  }

  return db
    .select()
    .from(syncMetadata)
    .where(and(...conditions))
    .orderBy(desc(syncMetadata.serverTimestamp));
}

/**
 * Get the last sync timestamp and record count per entity type for a user.
 */
export async function getSyncStatus(
  userId: string,
): Promise<
  ReadonlyArray<{
    entityType: string;
    lastSyncAt: Date;
    recordCount: number;
  }>
> {
  const results = await db
    .select({
      entityType: syncMetadata.entityType,
      lastSyncAt: sql<Date>`max(${syncMetadata.serverTimestamp})`.as(
        "last_sync_at",
      ),
      recordCount: sql<number>`count(*)::int`.as("record_count"),
    })
    .from(syncMetadata)
    .where(eq(syncMetadata.userId, userId))
    .groupBy(syncMetadata.entityType);

  return results;
}
