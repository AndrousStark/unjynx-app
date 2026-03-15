import { describe, it, expect } from "vitest";
import {
  syncRecordSchema,
  pushSchema,
  pullSchema,
  syncStatusQuerySchema,
} from "../sync.schema.js";

const validRecord = {
  entityType: "task",
  entityId: "550e8400-e29b-41d4-a716-446655440000",
  operation: "create",
  clientTimestamp: "2026-03-10T12:00:00Z",
  data: { title: "Buy milk" },
  deviceId: "device-abc-123",
};

describe("Sync Schemas", () => {
  describe("syncRecordSchema", () => {
    it("accepts a valid sync record", () => {
      const result = syncRecordSchema.safeParse(validRecord);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.entityType).toBe("task");
        expect(result.data.entityId).toBe(
          "550e8400-e29b-41d4-a716-446655440000",
        );
        expect(result.data.operation).toBe("create");
        expect(result.data.clientTimestamp).toBeInstanceOf(Date);
      }
    });

    it("rejects an invalid entityType", () => {
      const result = syncRecordSchema.safeParse({
        ...validRecord,
        entityType: "invalid_type",
      });
      expect(result.success).toBe(false);
    });

    it("accepts all valid entity types", () => {
      const types = [
        "task",
        "project",
        "subtask",
        "tag",
        "comment",
        "section",
        "recurring_rule",
      ];
      for (const entityType of types) {
        const result = syncRecordSchema.safeParse({
          ...validRecord,
          entityType,
        });
        expect(result.success).toBe(true);
      }
    });

    it("rejects an invalid operation", () => {
      const result = syncRecordSchema.safeParse({
        ...validRecord,
        operation: "archive",
      });
      expect(result.success).toBe(false);
    });

    it("accepts all valid operations", () => {
      const operations = ["create", "update", "delete"];
      for (const operation of operations) {
        const result = syncRecordSchema.safeParse({
          ...validRecord,
          operation,
        });
        expect(result.success).toBe(true);
      }
    });

    it("rejects a non-UUID entityId", () => {
      const result = syncRecordSchema.safeParse({
        ...validRecord,
        entityId: "not-a-uuid",
      });
      expect(result.success).toBe(false);
    });

    it("coerces a date string to a Date object", () => {
      const result = syncRecordSchema.safeParse(validRecord);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.clientTimestamp).toBeInstanceOf(Date);
        expect(result.data.clientTimestamp.toISOString()).toBe(
          "2026-03-10T12:00:00.000Z",
        );
      }
    });

    it("accepts optional data field", () => {
      const { data: _data, ...withoutData } = validRecord;
      const result = syncRecordSchema.safeParse(withoutData);
      expect(result.success).toBe(true);
    });

    it("accepts null data field", () => {
      const result = syncRecordSchema.safeParse({
        ...validRecord,
        data: null,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.data).toBeNull();
      }
    });

    it("accepts optional deviceId field", () => {
      const { deviceId: _deviceId, ...withoutDeviceId } = validRecord;
      const result = syncRecordSchema.safeParse(withoutDeviceId);
      expect(result.success).toBe(true);
    });

    it("rejects deviceId exceeding 255 characters", () => {
      const result = syncRecordSchema.safeParse({
        ...validRecord,
        deviceId: "a".repeat(256),
      });
      expect(result.success).toBe(false);
    });
  });

  describe("pushSchema", () => {
    it("accepts a valid records array", () => {
      const result = pushSchema.safeParse({ records: [validRecord] });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.records).toHaveLength(1);
      }
    });

    it("accepts multiple records up to 100", () => {
      const records = Array.from({ length: 100 }, (_, i) => ({
        ...validRecord,
        entityId: `550e8400-e29b-41d4-a716-4466554400${String(i).padStart(2, "0")}`,
      }));
      const result = pushSchema.safeParse({ records });
      expect(result.success).toBe(true);
    });

    it("rejects an empty records array", () => {
      const result = pushSchema.safeParse({ records: [] });
      expect(result.success).toBe(false);
    });

    it("rejects more than 100 records", () => {
      const records = Array.from({ length: 101 }, (_, i) => ({
        ...validRecord,
        entityId: `550e8400-e29b-41d4-a716-4466554400${String(i).padStart(2, "0")}`,
      }));
      const result = pushSchema.safeParse({ records });
      expect(result.success).toBe(false);
    });
  });

  describe("pullSchema", () => {
    it("accepts valid pull input", () => {
      const result = pullSchema.safeParse({
        since: "2026-03-01T00:00:00Z",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.since).toBeInstanceOf(Date);
      }
    });

    it("coerces since date string to Date", () => {
      const result = pullSchema.safeParse({
        since: "2026-01-15T08:30:00Z",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.since).toBeInstanceOf(Date);
        expect(result.data.since.toISOString()).toBe(
          "2026-01-15T08:30:00.000Z",
        );
      }
    });

    it("accepts with entityTypes filter", () => {
      const result = pullSchema.safeParse({
        since: "2026-03-01T00:00:00Z",
        entityTypes: ["task", "project"],
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.entityTypes).toEqual(["task", "project"]);
      }
    });

    it("accepts without entityTypes (optional)", () => {
      const result = pullSchema.safeParse({
        since: "2026-03-01T00:00:00Z",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.entityTypes).toBeUndefined();
      }
    });

    it("rejects invalid entityType in filter", () => {
      const result = pullSchema.safeParse({
        since: "2026-03-01T00:00:00Z",
        entityTypes: ["task", "invalid_entity"],
      });
      expect(result.success).toBe(false);
    });
  });

  describe("syncStatusQuerySchema", () => {
    it("transforms comma-separated string to array", () => {
      const result = syncStatusQuerySchema.safeParse({
        entityTypes: "task,project,tag",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.entityTypes).toEqual(["task", "project", "tag"]);
      }
    });

    it("handles a single entity type", () => {
      const result = syncStatusQuerySchema.safeParse({
        entityTypes: "task",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.entityTypes).toEqual(["task"]);
      }
    });

    it("accepts empty/missing entityTypes", () => {
      const result = syncStatusQuerySchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.entityTypes).toBeUndefined();
      }
    });

    it("filters out empty strings from split", () => {
      const result = syncStatusQuerySchema.safeParse({
        entityTypes: "task,,project,",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.entityTypes).toEqual(["task", "project"]);
      }
    });
  });
});
