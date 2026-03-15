import { describe, it, expect, vi, beforeEach } from "vitest";

const mockUpsertWithLWW = vi.fn();
const mockFindChangedSince = vi.fn();
const mockGetSyncStatus = vi.fn();

vi.mock("../sync.repository.js", () => ({
  upsertWithLWW: (...args: unknown[]) => mockUpsertWithLWW(...args),
  findChangedSince: (...args: unknown[]) => mockFindChangedSince(...args),
  getSyncStatus: (...args: unknown[]) => mockGetSyncStatus(...args),
}));

vi.mock("../../../env.js", () => ({
  env: {
    NODE_ENV: "test",
    PORT: 3000,
    LOG_LEVEL: "info",
    DATABASE_URL: "postgres://test:test@localhost:5432/test",
    REDIS_URL: "redis://localhost:6379",
    LOGTO_ENDPOINT: "http://localhost:3001",
    LOGTO_APP_ID: "test-app-id",
    LOGTO_APP_SECRET: "test-app-secret",
    S3_ENDPOINT: "http://localhost:9000",
    S3_ACCESS_KEY: "minioadmin",
    S3_SECRET_KEY: "minioadmin",
    S3_BUCKET: "test-bucket",
    S3_REGION: "us-east-1",
  },
}));

import { push, pull, getStatus } from "../sync.service.js";
import type { SyncRecord } from "../sync.schema.js";

const profileId = "profile-user-1";

const makeSyncRecord = (overrides?: Partial<SyncRecord>): SyncRecord => ({
  entityType: "task",
  entityId: "550e8400-e29b-41d4-a716-446655440000",
  operation: "create",
  clientTimestamp: new Date("2026-03-10T12:00:00Z"),
  data: { title: "Test task" },
  deviceId: "device-abc",
  ...overrides,
});

describe("Sync Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("push", () => {
    it("returns acks for each record", async () => {
      const serverTimestamp = new Date("2026-03-10T12:00:01Z");
      mockUpsertWithLWW.mockResolvedValueOnce({
        entry: { serverTimestamp },
        accepted: true,
      });

      const records = [makeSyncRecord()];
      const acks = await push(profileId, records);

      expect(acks).toHaveLength(1);
      expect(acks[0]).toEqual({
        entityType: "task",
        entityId: "550e8400-e29b-41d4-a716-446655440000",
        serverTimestamp,
        accepted: true,
        reason: undefined,
      });
    });

    it("marks accepted=true when LWW accepts the record", async () => {
      const serverTimestamp = new Date();
      mockUpsertWithLWW.mockResolvedValueOnce({
        entry: { serverTimestamp },
        accepted: true,
      });

      const records = [makeSyncRecord()];
      const acks = await push(profileId, records);

      expect(acks[0].accepted).toBe(true);
      expect(acks[0].reason).toBeUndefined();
    });

    it("marks accepted=false when server has newer timestamp", async () => {
      const serverTimestamp = new Date();
      mockUpsertWithLWW.mockResolvedValueOnce({
        entry: { serverTimestamp },
        accepted: false,
      });

      const records = [makeSyncRecord()];
      const acks = await push(profileId, records);

      expect(acks[0].accepted).toBe(false);
      expect(acks[0].reason).toBe("Server has newer timestamp (LWW)");
    });

    it("processes multiple records and returns acks for each", async () => {
      mockUpsertWithLWW
        .mockResolvedValueOnce({
          entry: { serverTimestamp: new Date() },
          accepted: true,
        })
        .mockResolvedValueOnce({
          entry: { serverTimestamp: new Date() },
          accepted: false,
        })
        .mockResolvedValueOnce({
          entry: { serverTimestamp: new Date() },
          accepted: true,
        });

      const records = [
        makeSyncRecord({
          entityId: "550e8400-e29b-41d4-a716-446655440001",
          operation: "create",
        }),
        makeSyncRecord({
          entityId: "550e8400-e29b-41d4-a716-446655440002",
          operation: "update",
        }),
        makeSyncRecord({
          entityId: "550e8400-e29b-41d4-a716-446655440003",
          operation: "delete",
        }),
      ];

      const acks = await push(profileId, records);

      expect(acks).toHaveLength(3);
      expect(acks[0].accepted).toBe(true);
      expect(acks[1].accepted).toBe(false);
      expect(acks[2].accepted).toBe(true);
      expect(mockUpsertWithLWW).toHaveBeenCalledTimes(3);
    });

    it("passes correct arguments to upsertWithLWW", async () => {
      mockUpsertWithLWW.mockResolvedValueOnce({
        entry: { serverTimestamp: new Date() },
        accepted: true,
      });

      const record = makeSyncRecord({
        entityType: "project",
        entityId: "550e8400-e29b-41d4-a716-446655440099",
        operation: "update",
        clientTimestamp: new Date("2026-03-10T15:00:00Z"),
        deviceId: "my-device",
      });

      await push(profileId, [record]);

      expect(mockUpsertWithLWW).toHaveBeenCalledWith(
        profileId,
        "project",
        "550e8400-e29b-41d4-a716-446655440099",
        "update",
        new Date("2026-03-10T15:00:00Z"),
        "my-device",
      );
    });
  });

  describe("pull", () => {
    it("passes since and entityTypes to findChangedSince", async () => {
      const since = new Date("2026-03-01T00:00:00Z");
      const entityTypes = ["task", "project"];
      const fakeEntries = [
        {
          id: "entry-1",
          userId: profileId,
          entityType: "task",
          entityId: "550e8400-e29b-41d4-a716-446655440001",
          operation: "create",
          clientTimestamp: new Date(),
          serverTimestamp: new Date(),
          deviceId: null,
        },
      ];
      mockFindChangedSince.mockResolvedValueOnce(fakeEntries);

      const result = await pull(profileId, since, entityTypes);

      expect(result).toEqual(fakeEntries);
      expect(mockFindChangedSince).toHaveBeenCalledWith(
        profileId,
        since,
        entityTypes,
      );
    });

    it("passes undefined entityTypes when not provided", async () => {
      const since = new Date("2026-03-01T00:00:00Z");
      mockFindChangedSince.mockResolvedValueOnce([]);

      await pull(profileId, since);

      expect(mockFindChangedSince).toHaveBeenCalledWith(
        profileId,
        since,
        undefined,
      );
    });

    it("returns entries from the repository", async () => {
      const fakeEntries = [
        {
          id: "entry-1",
          userId: profileId,
          entityType: "task",
          entityId: "550e8400-e29b-41d4-a716-446655440001",
          operation: "update",
          clientTimestamp: new Date(),
          serverTimestamp: new Date(),
          deviceId: "device-1",
        },
        {
          id: "entry-2",
          userId: profileId,
          entityType: "project",
          entityId: "550e8400-e29b-41d4-a716-446655440002",
          operation: "create",
          clientTimestamp: new Date(),
          serverTimestamp: new Date(),
          deviceId: null,
        },
      ];
      mockFindChangedSince.mockResolvedValueOnce(fakeEntries);

      const result = await pull(
        profileId,
        new Date("2026-01-01T00:00:00Z"),
      );

      expect(result).toHaveLength(2);
      expect(result).toEqual(fakeEntries);
    });
  });

  describe("getStatus", () => {
    it("returns status entries from repository", async () => {
      const fakeStatus = [
        {
          entityType: "task",
          lastSyncAt: new Date("2026-03-10T10:00:00Z"),
          recordCount: 42,
        },
        {
          entityType: "project",
          lastSyncAt: new Date("2026-03-10T09:30:00Z"),
          recordCount: 5,
        },
      ];
      mockGetSyncStatus.mockResolvedValueOnce(fakeStatus);

      const result = await getStatus(profileId);

      expect(result).toEqual(fakeStatus);
      expect(mockGetSyncStatus).toHaveBeenCalledWith(profileId);
    });

    it("returns empty array when no sync data exists", async () => {
      mockGetSyncStatus.mockResolvedValueOnce([]);

      const result = await getStatus(profileId);

      expect(result).toEqual([]);
      expect(mockGetSyncStatus).toHaveBeenCalledWith(profileId);
    });
  });
});
