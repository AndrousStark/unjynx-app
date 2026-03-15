import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock env to avoid DATABASE_URL validation at import time
vi.stubEnv("DATABASE_URL", "postgres://test:test@localhost:5432/test");
vi.stubEnv("LOGTO_ENDPOINT", "http://localhost:3001");

vi.mock("../logto-management.service.js", () => ({
  updateLogtoUser: vi.fn(),
  suspendLogtoUser: vi.fn(),
  createLogtoUser: vi.fn(),
  deleteLogtoUser: vi.fn(),
  setLogtoPassword: vi.fn(),
}));

vi.mock("../../../middleware/admin-guard.js", () => ({
  clearAdminCache: vi.fn(),
}));

const mockFindUsers = vi.fn();
const mockFindUserById = vi.fn();
const mockUpdateUser = vi.fn();
const mockFindContent = vi.fn();
const mockInsertContent = vi.fn();
const mockUpdateContent = vi.fn();
const mockDeleteContent = vi.fn();
const mockBulkInsertContent = vi.fn();
const mockFindFeatureFlags = vi.fn();
const mockFindFeatureFlagById = vi.fn();
const mockInsertFeatureFlag = vi.fn();
const mockUpdateFeatureFlag = vi.fn();
const mockDeleteFeatureFlag = vi.fn();
const mockFindAuditLog = vi.fn();
const mockInsertAuditEntry = vi.fn();
const mockGetAnalyticsOverview = vi.fn();
const mockGetSignupTrend = vi.fn();
const mockGetRevenueTrend = vi.fn();
const mockUpsertUserSubscription = vi.fn();

vi.mock("../admin.repository.js", () => ({
  findUsers: (...args: unknown[]) => mockFindUsers(...args),
  findUserById: (...args: unknown[]) => mockFindUserById(...args),
  updateUser: (...args: unknown[]) => mockUpdateUser(...args),
  findContent: (...args: unknown[]) => mockFindContent(...args),
  insertContent: (...args: unknown[]) => mockInsertContent(...args),
  updateContent: (...args: unknown[]) => mockUpdateContent(...args),
  deleteContent: (...args: unknown[]) => mockDeleteContent(...args),
  bulkInsertContent: (...args: unknown[]) => mockBulkInsertContent(...args),
  findFeatureFlags: (...args: unknown[]) => mockFindFeatureFlags(...args),
  findFeatureFlagById: (...args: unknown[]) => mockFindFeatureFlagById(...args),
  insertFeatureFlag: (...args: unknown[]) => mockInsertFeatureFlag(...args),
  updateFeatureFlag: (...args: unknown[]) => mockUpdateFeatureFlag(...args),
  deleteFeatureFlag: (...args: unknown[]) => mockDeleteFeatureFlag(...args),
  findAuditLog: (...args: unknown[]) => mockFindAuditLog(...args),
  insertAuditEntry: (...args: unknown[]) => mockInsertAuditEntry(...args),
  getAnalyticsOverview: (...args: unknown[]) => mockGetAnalyticsOverview(...args),
  getSignupTrend: (...args: unknown[]) => mockGetSignupTrend(...args),
  getRevenueTrend: (...args: unknown[]) => mockGetRevenueTrend(...args),
  upsertUserSubscription: (...args: unknown[]) => mockUpsertUserSubscription(...args),
}));

import {
  listUsers,
  getUserDetail,
  updateUser,
  listContent,
  createContent,
  updateContent,
  deleteContent,
  bulkImportContent,
  listFeatureFlags,
  getFeatureFlag,
  createFeatureFlag,
  updateFeatureFlag,
  deleteFeatureFlag,
  getAuditLog,
  logAuditEvent,
  getAnalyticsOverview,
  getSignupTrend,
  getRevenueTrend,
  sendBroadcast,
} from "../admin.service.js";

describe("Admin Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Users ───────────────────────────────────────────────────────

  describe("listUsers", () => {
    it("returns paginated users", async () => {
      mockFindUsers.mockResolvedValueOnce({ items: [{ id: "u-1" }], total: 1 });

      const result = await listUsers({ page: 1, limit: 20, sortOrder: "desc" });

      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(mockFindUsers).toHaveBeenCalledWith(undefined, 20, 0, undefined, undefined, "desc", undefined);
    });

    it("passes search parameter", async () => {
      mockFindUsers.mockResolvedValueOnce({ items: [], total: 0 });

      await listUsers({ page: 1, limit: 20, search: "john", sortOrder: "desc" });

      expect(mockFindUsers).toHaveBeenCalledWith("john", 20, 0, undefined, undefined, "desc", undefined);
    });
  });

  describe("getUserDetail", () => {
    it("returns user by id", async () => {
      mockFindUserById.mockResolvedValueOnce({ id: "u-1", name: "Test" });

      const result = await getUserDetail("u-1");
      expect(result?.name).toBe("Test");
    });
  });

  describe("updateUser", () => {
    it("updates user name", async () => {
      // findUserById called first to check profile exists + get logtoId
      mockFindUserById.mockResolvedValueOnce({ id: "u-1", name: "Old", logtoId: "logto-1", plan: "free" });
      mockUpdateUser.mockResolvedValueOnce({ id: "u-1", name: "New Name" });
      // findUserById called again at end to return fresh data with plan
      mockFindUserById.mockResolvedValueOnce({ id: "u-1", name: "New Name", plan: "free" });

      const result = await updateUser("u-1", { name: "New Name" });
      expect(result?.name).toBe("New Name");
    });
  });

  // ── Content ─────────────────────────────────────────────────────

  describe("listContent", () => {
    it("returns paginated content", async () => {
      mockFindContent.mockResolvedValueOnce({ items: [], total: 0 });

      const result = await listContent({ page: 1, limit: 20 });
      expect(result.total).toBe(0);
    });

    it("passes category filter", async () => {
      mockFindContent.mockResolvedValueOnce({ items: [], total: 0 });

      await listContent({ page: 1, limit: 20, category: "anime" });
      expect(mockFindContent).toHaveBeenCalledWith("anime", 20, 0);
    });
  });

  describe("createContent", () => {
    it("creates content", async () => {
      mockInsertContent.mockResolvedValueOnce({ id: "c-1", content: "Quote" });

      const result = await createContent({
        category: "stoic_wisdom",
        content: "Quote",
      });
      expect(result.content).toBe("Quote");
    });
  });

  describe("updateContent", () => {
    it("updates content", async () => {
      mockUpdateContent.mockResolvedValueOnce({ id: "c-1", content: "Updated" });

      const result = await updateContent("c-1", { content: "Updated" });
      expect(result?.content).toBe("Updated");
    });
  });

  describe("deleteContent", () => {
    it("deletes content", async () => {
      mockDeleteContent.mockResolvedValueOnce(true);

      const result = await deleteContent("c-1");
      expect(result).toBe(true);
    });
  });

  describe("bulkImportContent", () => {
    it("bulk imports content items", async () => {
      mockBulkInsertContent.mockResolvedValueOnce([{ id: "c-1" }, { id: "c-2" }]);

      const result = await bulkImportContent({
        items: [
          { category: "stoic_wisdom", content: "Quote 1" },
          { category: "anime", content: "Quote 2" },
        ],
      });

      expect(result).toHaveLength(2);
    });
  });

  // ── Feature Flags ───────────────────────────────────────────────

  describe("listFeatureFlags", () => {
    it("returns all flags", async () => {
      mockFindFeatureFlags.mockResolvedValueOnce([{ id: "f-1", key: "dark_mode" }]);

      const result = await listFeatureFlags();
      expect(result).toHaveLength(1);
    });
  });

  describe("getFeatureFlag", () => {
    it("returns flag by id", async () => {
      mockFindFeatureFlagById.mockResolvedValueOnce({ id: "f-1" });

      const result = await getFeatureFlag("f-1");
      expect(result?.id).toBe("f-1");
    });
  });

  describe("createFeatureFlag", () => {
    it("creates a feature flag", async () => {
      mockInsertFeatureFlag.mockResolvedValueOnce({
        id: "f-1",
        key: "new_feature",
      });

      const result = await createFeatureFlag({
        key: "new_feature",
        name: "New Feature",
        status: "disabled",
        percentage: 0,
      });

      expect(result.key).toBe("new_feature");
    });
  });

  describe("updateFeatureFlag", () => {
    it("updates a feature flag", async () => {
      mockUpdateFeatureFlag.mockResolvedValueOnce({
        id: "f-1",
        status: "enabled",
      });

      const result = await updateFeatureFlag("f-1", { status: "enabled" });
      expect(result?.status).toBe("enabled");
    });
  });

  describe("deleteFeatureFlag", () => {
    it("deletes a feature flag", async () => {
      mockDeleteFeatureFlag.mockResolvedValueOnce(true);

      const result = await deleteFeatureFlag("f-1");
      expect(result).toBe(true);
    });
  });

  // ── Audit Log ───────────────────────────────────────────────────

  describe("getAuditLog", () => {
    it("returns paginated audit entries", async () => {
      mockFindAuditLog.mockResolvedValueOnce({ items: [], total: 0 });

      const result = await getAuditLog({ page: 1, limit: 20 });
      expect(result.total).toBe(0);
    });
  });

  describe("logAuditEvent", () => {
    it("creates an audit entry", async () => {
      mockInsertAuditEntry.mockResolvedValueOnce({ id: "a-1" });

      const result = await logAuditEvent("user-1", "user.update", "profile", "u-1");
      expect(result.id).toBe("a-1");
    });
  });

  // ── Analytics ───────────────────────────────────────────────────

  describe("getAnalyticsOverview", () => {
    it("returns overview stats", async () => {
      mockGetAnalyticsOverview.mockResolvedValueOnce({
        totalUsers: 100,
        activeUsersToday: 10,
        activeUsersMonth: 50,
        totalSubscriptions: 20,
      });

      const result = await getAnalyticsOverview();
      expect(result.totalUsers).toBe(100);
    });
  });

  describe("getSignupTrend", () => {
    it("returns signup trend data", async () => {
      mockGetSignupTrend.mockResolvedValueOnce([
        { date: "2026-03-10", count: 5 },
      ]);

      const result = await getSignupTrend(30);
      expect(result).toHaveLength(1);
      expect(result[0].count).toBe(5);
    });
  });

  describe("getRevenueTrend", () => {
    it("returns revenue trend data", async () => {
      mockGetRevenueTrend.mockResolvedValueOnce([
        { date: "2026-03-10", amount: 100, currency: "USD" },
      ]);

      const result = await getRevenueTrend(30);
      expect(result).toHaveLength(1);
      expect(result[0].amount).toBe(100);
    });
  });

  describe("sendBroadcast", () => {
    it("sends a broadcast", async () => {
      const result = await sendBroadcast({
        title: "Test",
        body: "Content",
        targetPlan: "all",
      });

      expect(result.sent).toBe(true);
    });
  });
});
