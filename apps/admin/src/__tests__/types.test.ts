import { describe, it, expect } from "vitest";
import type {
  AdminRole,
  PlanType,
  UserStatus,
  ContentCategory,
  ContentStatus,
  FlagStatus,
  FlagType,
  ChannelType,
  ApiResponse,
  PaginationMeta,
  AdminUser,
  UserRecord,
  ContentRecord,
  FeatureFlagRecord,
  AuditLogRecord,
  AnalyticsOverview,
} from "../types";

describe("Type Safety", () => {
  it("should create a valid AdminUser", () => {
    const user: AdminUser = {
      id: "user-1",
      email: "admin@unjynx.com",
      name: "Admin",
      role: "SUPER_ADMIN",
    };
    expect(user.role).toBe("SUPER_ADMIN");
    expect(user.id).toBeDefined();
  });

  it("should create a valid UserRecord", () => {
    const user: UserRecord = {
      id: "user-1",
      name: "Test User",
      email: "test@example.com",
      plan: "pro",
      status: "active",
      isBanned: false,
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-03-11T00:00:00Z",
    };
    expect(user.plan).toBe("pro");
    expect(user.isBanned).toBe(false);
  });

  it("should create a valid ContentRecord", () => {
    const content: ContentRecord = {
      id: "content-1",
      category: "stoic_wisdom",
      content: "The obstacle is the way.",
      author: "Marcus Aurelius",
      status: "published",
      isActive: true,
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-03-11T00:00:00Z",
    };
    expect(content.category).toBe("stoic_wisdom");
    expect(content.isActive).toBe(true);
  });

  it("should create a valid FeatureFlagRecord", () => {
    const flag: FeatureFlagRecord = {
      id: "flag-1",
      key: "enable-ai-chat",
      name: "AI Chat",
      status: "percentage",
      flagType: "release",
      percentage: 25,
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-03-11T00:00:00Z",
    };
    expect(flag.status).toBe("percentage");
    expect(flag.percentage).toBe(25);
  });

  it("should create a valid AuditLogRecord", () => {
    const log: AuditLogRecord = {
      id: "log-1",
      userId: "user-1",
      action: "user.update",
      entityType: "profile",
      entityId: "user-2",
      createdAt: "2026-03-11T00:00:00Z",
    };
    expect(log.action).toBe("user.update");
  });

  it("should create a valid AnalyticsOverview", () => {
    const overview: AnalyticsOverview = {
      totalUsers: 900,
      activeUsersToday: 158,
      activeUsersMonth: 650,
      totalSubscriptions: 320,
    };
    expect(overview.totalUsers).toBe(900);
    expect(overview.activeUsersToday).toBe(158);
  });

  it("should create a valid ApiResponse", () => {
    const response: ApiResponse<string[]> = {
      success: true,
      data: ["item1", "item2"],
      error: null,
      meta: {
        total: 2,
        page: 1,
        limit: 20,
        totalPages: 1,
      },
    };
    expect(response.success).toBe(true);
    expect(response.data).toHaveLength(2);
    expect(response.meta?.totalPages).toBe(1);
  });

  it("should create an error ApiResponse", () => {
    const response: ApiResponse<null> = {
      success: false,
      data: null,
      error: "Not found",
    };
    expect(response.success).toBe(false);
    expect(response.error).toBe("Not found");
  });

  it("should allow all AdminRole values", () => {
    const roles: AdminRole[] = [
      "SUPER_ADMIN",
      "CONTENT_MANAGER",
      "SUPPORT_AGENT",
      "VIEWER",
    ];
    expect(roles).toHaveLength(4);
  });

  it("should allow all ChannelType values", () => {
    const channels: ChannelType[] = [
      "push",
      "whatsapp",
      "telegram",
      "email",
      "sms",
      "instagram",
      "slack",
      "discord",
    ];
    expect(channels).toHaveLength(8);
  });
});
