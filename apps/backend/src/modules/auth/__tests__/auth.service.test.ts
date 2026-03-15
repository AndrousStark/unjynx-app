import { describe, it, expect, vi, beforeEach } from "vitest";

const mockUpsertProfile = vi.fn();
const mockFindProfileByLogtoId = vi.fn();
const mockUpdateLastLogout = vi.fn();

vi.mock("../auth.repository.js", () => ({
  upsertProfile: (...args: unknown[]) => mockUpsertProfile(...args),
  findProfileByLogtoId: (...args: unknown[]) =>
    mockFindProfileByLogtoId(...args),
  findProfileById: vi.fn(),
  updateLastLogout: (...args: unknown[]) => mockUpdateLastLogout(...args),
}));

// Mock env to avoid DATABASE_URL validation at import time
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

import { syncProfile, getProfileByLogtoId } from "../auth.service.js";

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

describe("Auth Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("syncProfile", () => {
    it("upserts a profile via repository", async () => {
      mockUpsertProfile.mockResolvedValueOnce(fakeProfile);

      const result = await syncProfile({
        sub: "logto-sub-123",
        email: "test@example.com",
        name: "Test User",
      });

      expect(result).toEqual(fakeProfile);
      expect(mockUpsertProfile).toHaveBeenCalledWith({
        logtoId: "logto-sub-123",
        email: "test@example.com",
        name: "Test User",
      });
    });

    it("handles user without email or name", async () => {
      const minimalProfile = { ...fakeProfile, email: null, name: null };
      mockUpsertProfile.mockResolvedValueOnce(minimalProfile);

      const result = await syncProfile({ sub: "logto-sub-123" });

      expect(result.email).toBeNull();
      expect(result.name).toBeNull();
    });
  });

  describe("getProfileByLogtoId", () => {
    it("returns profile from repository", async () => {
      mockFindProfileByLogtoId.mockResolvedValueOnce(fakeProfile);

      const result = await getProfileByLogtoId("logto-sub-123");

      expect(result).toEqual(fakeProfile);
    });

    it("returns undefined when not found", async () => {
      mockFindProfileByLogtoId.mockResolvedValueOnce(undefined);

      const result = await getProfileByLogtoId("non-existent");

      expect(result).toBeUndefined();
    });
  });
});
