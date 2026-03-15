import { z } from "zod";

const ENTITY_TYPES = [
  "task",
  "project",
  "subtask",
  "tag",
  "comment",
  "section",
  "recurring_rule",
] as const;

const SYNC_OPERATIONS = ["create", "update", "delete"] as const;

export const syncRecordSchema = z.object({
  entityType: z.enum(ENTITY_TYPES),
  entityId: z.string().uuid(),
  operation: z.enum(SYNC_OPERATIONS),
  clientTimestamp: z.coerce.date(),
  data: z.record(z.unknown()).nullable().optional(),
  deviceId: z.string().max(255).optional(),
});

export const pushSchema = z.object({
  records: z.array(syncRecordSchema).min(1).max(100),
});

export const pullSchema = z.object({
  since: z.coerce.date(),
  entityTypes: z.array(z.enum(ENTITY_TYPES)).optional(),
});

export const syncStatusQuerySchema = z.object({
  entityTypes: z
    .string()
    .transform((val) => val.split(",").filter(Boolean))
    .optional(),
});

// ── Type Exports ───────────────────────────────────────────────────────

export type SyncRecord = z.infer<typeof syncRecordSchema>;
export type PushInput = z.infer<typeof pushSchema>;
export type PullInput = z.infer<typeof pullSchema>;

export interface SyncAck {
  readonly entityType: string;
  readonly entityId: string;
  readonly serverTimestamp: Date;
  readonly accepted: boolean;
  readonly reason?: string;
}

export interface SyncStatusEntry {
  readonly entityType: string;
  readonly lastSyncAt: Date;
  readonly recordCount: number;
}
