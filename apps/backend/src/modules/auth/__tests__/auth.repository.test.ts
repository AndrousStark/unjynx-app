import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../../env.js", () => ({
  env: {
    NODE_ENV: "test",
    PORT: 3000,
    LOG_LEVEL: "silent",
    DATABASE_URL: "postgres://test:test@localhost:5432/test",
    REDIS_URL: "redis://localhost:6379",
    LOGTO_ENDPOINT: "http://localhost:3001",
    S3_ENDPOINT: "http://localhost:9000",
    S3_ACCESS_KEY: "test",
    S3_SECRET_KEY: "test",
    S3_BUCKET: "test",
    S3_REGION: "us-east-1",
  },
}));

const mockReturning = vi.fn();
const mockOnConflictDoUpdate = vi.fn(() => ({ returning: mockReturning }));
const mockValues = vi.fn(() => ({
  onConflictDoUpdate: mockOnConflictDoUpdate,
}));
const mockInsert = vi.fn(() => ({ values: mockValues }));
const mockWhere = vi.fn();
const mockFrom = vi.fn(() => ({ where: mockWhere }));
const mockSelect = vi.fn(() => ({ from: mockFrom }));

vi.mock("../../../db/index.js", () => ({
  db: {
    insert: (...args: unknown[]) => mockInsert(...args),
    select: (...args: unknown[]) => mockSelect(...args),
  },
}));

import {
  upsertProfile,
  findProfileByLogtoId,
  findProfileById,
} from "../auth.repository.js";

const fakeProfile = {
  id: "profile-1",
  logtoId: "logto-sub-123",
  email: "test@example.com",
  name: "Test User",
  avatarUrl: null,
  timezone: "Asia/Kolkata",
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("Auth Repository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("upsertProfile", () => {
    it("upserts a profile and returns it", async () => {
      mockReturning.mockResolvedValueOnce([fakeProfile]);

      const result = await upsertProfile({
        logtoId: "logto-sub-123",
        email: "test@example.com",
        name: "Test User",
      });

      expect(result).toEqual(fakeProfile);
      expect(mockInsert).toHaveBeenCalled();
      expect(mockOnConflictDoUpdate).toHaveBeenCalled();
    });

    it("handles user without email or name", async () => {
      const minimalProfile = { ...fakeProfile, email: null, name: null };
      mockReturning.mockResolvedValueOnce([minimalProfile]);

      const result = await upsertProfile({ logtoId: "logto-sub-123" });

      expect(result.email).toBeNull();
      expect(result.name).toBeNull();
    });

    it("uses atomic upsert (onConflictDoUpdate)", async () => {
      mockReturning.mockResolvedValueOnce([fakeProfile]);

      await upsertProfile({
        logtoId: "logto-sub-123",
        email: "new@example.com",
        name: "Updated",
      });

      expect(mockInsert).toHaveBeenCalledTimes(1);
      expect(mockValues).toHaveBeenCalledTimes(1);
      expect(mockOnConflictDoUpdate).toHaveBeenCalledTimes(1);
      expect(mockReturning).toHaveBeenCalledTimes(1);
    });
  });

  describe("findProfileByLogtoId", () => {
    it("returns profile when found", async () => {
      mockWhere.mockResolvedValueOnce([fakeProfile]);

      const result = await findProfileByLogtoId("logto-sub-123");

      expect(result).toEqual(fakeProfile);
    });

    it("returns undefined when not found", async () => {
      mockWhere.mockResolvedValueOnce([]);

      const result = await findProfileByLogtoId("non-existent");

      expect(result).toBeUndefined();
    });
  });

  describe("findProfileById", () => {
    it("returns profile when found", async () => {
      mockWhere.mockResolvedValueOnce([fakeProfile]);

      const result = await findProfileById("profile-1");

      expect(result).toEqual(fakeProfile);
    });

    it("returns undefined when not found", async () => {
      mockWhere.mockResolvedValueOnce([]);

      const result = await findProfileById("non-existent");

      expect(result).toBeUndefined();
    });
  });
});
