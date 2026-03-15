import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mock env (must be before service import) ──────────────────────────
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

// ── Mock repository ───────────────────────────────────────────────────
const mockFindDeliveredToday = vi.fn();
const mockFindTodayContent = vi.fn();
const mockLogContentDelivery = vi.fn();
const mockFindContentCategories = vi.fn();
const mockFindUserContentPrefs = vi.fn();
const mockUpsertUserContentPrefs = vi.fn();
const mockFindContentById = vi.fn();
const mockInsertRitual = vi.fn();
const mockFindRitualByDate = vi.fn();
const mockFindRitualHistory = vi.fn();
const mockFindStreakByUserId = vi.fn();
const mockUpsertStreak = vi.fn();

vi.mock("../content.repository.js", () => ({
  findDeliveredToday: (...args: unknown[]) => mockFindDeliveredToday(...args),
  findTodayContent: (...args: unknown[]) => mockFindTodayContent(...args),
  logContentDelivery: (...args: unknown[]) => mockLogContentDelivery(...args),
  findContentCategories: (...args: unknown[]) =>
    mockFindContentCategories(...args),
  findUserContentPrefs: (...args: unknown[]) =>
    mockFindUserContentPrefs(...args),
  upsertUserContentPrefs: (...args: unknown[]) =>
    mockUpsertUserContentPrefs(...args),
  findContentById: (...args: unknown[]) => mockFindContentById(...args),
  insertRitual: (...args: unknown[]) => mockInsertRitual(...args),
  findRitualByDate: (...args: unknown[]) => mockFindRitualByDate(...args),
  findRitualHistory: (...args: unknown[]) => mockFindRitualHistory(...args),
  findStreakByUserId: (...args: unknown[]) => mockFindStreakByUserId(...args),
  upsertStreak: (...args: unknown[]) => mockUpsertStreak(...args),
}));

// ── Import service AFTER mocks ────────────────────────────────────────
import {
  getTodayContent,
  getCategories,
  getPreferences,
  updatePreferences,
  saveContent,
  logRitual,
  getRitualHistory,
} from "../content.service.js";

// ── Test Fixtures ─────────────────────────────────────────────────────

const USER_ID = "user-abc-123";

const fakeContent = {
  id: "content-1",
  category: "stoic_wisdom" as const,
  title: "Marcus Aurelius Quote",
  body: "The impediment to action advances action.",
  author: "Marcus Aurelius",
  sourceUrl: null,
  sortWeight: 1,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const fakeContent2 = {
  ...fakeContent,
  id: "content-2",
  title: "Seneca Quote",
  body: "We suffer more often in imagination than in reality.",
};

const fakeRitual = {
  id: "ritual-1",
  userId: USER_ID,
  type: "morning" as const,
  mood: 4,
  gratitude: "Grateful for health",
  intention: "Focus on deep work",
  reflection: null,
  completedAt: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
};

const fakeStreak = {
  id: "streak-1",
  userId: USER_ID,
  currentStreak: 5,
  longestStreak: 10,
  lastActiveDate: new Date(),
  isFrozen: false,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const fakePrefs = [
  {
    id: "pref-1",
    userId: USER_ID,
    category: "stoic_wisdom" as const,
    deliveryTime: "07:00",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

// ── Tests ─────────────────────────────────────────────────────────────

describe("Content Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── getTodayContent ───────────────────────────────────────────────

  describe("getTodayContent", () => {
    it("returns content when not already delivered", async () => {
      mockFindDeliveredToday.mockResolvedValueOnce([]);
      mockFindTodayContent.mockResolvedValueOnce(fakeContent);
      mockLogContentDelivery.mockResolvedValueOnce({});

      const result = await getTodayContent(USER_ID, {});

      expect(result).toEqual(fakeContent);
      expect(mockFindDeliveredToday).toHaveBeenCalledWith(USER_ID);
      expect(mockLogContentDelivery).toHaveBeenCalledWith(
        USER_ID,
        fakeContent.id,
        "push",
      );
    });

    it("avoids repeating already-delivered content", async () => {
      // First content was already delivered, second is new
      mockFindDeliveredToday.mockResolvedValueOnce([
        { contentId: "content-1" },
      ]);
      mockFindTodayContent
        .mockResolvedValueOnce(fakeContent) // 1st attempt: already delivered
        .mockResolvedValueOnce(fakeContent2); // 2nd attempt: new content
      mockLogContentDelivery.mockResolvedValueOnce({});

      const result = await getTodayContent(USER_ID, {});

      expect(result).toEqual(fakeContent2);
      expect(mockFindTodayContent).toHaveBeenCalledTimes(2);
      expect(mockLogContentDelivery).toHaveBeenCalledWith(
        USER_ID,
        fakeContent2.id,
        "push",
      );
    });

    it("returns null when no content found", async () => {
      mockFindDeliveredToday.mockResolvedValueOnce([]);
      mockFindTodayContent.mockResolvedValueOnce(undefined);

      const result = await getTodayContent(USER_ID, {});

      expect(result).toBeNull();
      expect(mockLogContentDelivery).not.toHaveBeenCalled();
    });

    it("passes category filter to repository", async () => {
      mockFindDeliveredToday.mockResolvedValueOnce([]);
      mockFindTodayContent.mockResolvedValueOnce(fakeContent);
      mockLogContentDelivery.mockResolvedValueOnce({});

      await getTodayContent(USER_ID, { category: "stoic_wisdom" });

      expect(mockFindTodayContent).toHaveBeenCalledWith("stoic_wisdom");
    });
  });

  // ── getCategories ─────────────────────────────────────────────────

  describe("getCategories", () => {
    it("returns list from repository", async () => {
      const categories = ["stoic_wisdom", "anime", "poetry"];
      mockFindContentCategories.mockResolvedValueOnce(categories);

      const result = await getCategories();

      expect(result).toEqual(categories);
      expect(mockFindContentCategories).toHaveBeenCalledOnce();
    });
  });

  // ── getPreferences ────────────────────────────────────────────────

  describe("getPreferences", () => {
    it("returns prefs for user", async () => {
      mockFindUserContentPrefs.mockResolvedValueOnce(fakePrefs);

      const result = await getPreferences(USER_ID);

      expect(result).toEqual(fakePrefs);
      expect(mockFindUserContentPrefs).toHaveBeenCalledWith(USER_ID);
    });
  });

  // ── updatePreferences ─────────────────────────────────────────────

  describe("updatePreferences", () => {
    it("calls upsertUserContentPrefs with correct args", async () => {
      const updatedPrefs = [
        { ...fakePrefs[0], category: "anime", deliveryTime: "09:00" },
      ];
      mockUpsertUserContentPrefs.mockResolvedValueOnce(updatedPrefs);

      const result = await updatePreferences(USER_ID, {
        categories: ["anime"],
        deliveryTime: "09:00",
      });

      expect(result).toEqual(updatedPrefs);
      expect(mockUpsertUserContentPrefs).toHaveBeenCalledWith(
        USER_ID,
        ["anime"],
        "09:00",
      );
    });

    it("defaults deliveryTime to 07:00 when not provided", async () => {
      mockUpsertUserContentPrefs.mockResolvedValueOnce(fakePrefs);

      await updatePreferences(USER_ID, {
        categories: ["stoic_wisdom"],
      });

      expect(mockUpsertUserContentPrefs).toHaveBeenCalledWith(
        USER_ID,
        ["stoic_wisdom"],
        "07:00",
      );
    });
  });

  // ── saveContent ───────────────────────────────────────────────────

  describe("saveContent", () => {
    it("returns saved=true when content exists", async () => {
      mockFindContentById.mockResolvedValueOnce(fakeContent);
      mockLogContentDelivery.mockResolvedValueOnce({});

      const result = await saveContent(USER_ID, "content-1");

      expect(result).toEqual({ saved: true });
      expect(mockFindContentById).toHaveBeenCalledWith("content-1");
      expect(mockLogContentDelivery).toHaveBeenCalledWith(
        USER_ID,
        "content-1",
        "push",
      );
    });

    it("returns saved=false when content not found", async () => {
      mockFindContentById.mockResolvedValueOnce(undefined);

      const result = await saveContent(USER_ID, "non-existent");

      expect(result).toEqual({ saved: false });
      expect(mockLogContentDelivery).not.toHaveBeenCalled();
    });
  });

  // ── logRitual ─────────────────────────────────────────────────────

  describe("logRitual", () => {
    it("creates ritual and updates streak", async () => {
      mockFindRitualByDate.mockResolvedValueOnce(undefined);
      mockInsertRitual.mockResolvedValueOnce(fakeRitual);
      // updateStreakOnActivity calls findStreakByUserId then upsertStreak
      mockFindStreakByUserId.mockResolvedValueOnce(undefined);
      mockUpsertStreak.mockResolvedValueOnce(fakeStreak);

      const result = await logRitual(USER_ID, {
        ritualType: "morning",
        mood: 4,
        gratitude: "Grateful for health",
        intention: "Focus on deep work",
      });

      expect(result.ritual).toEqual(fakeRitual);
      expect(result.streak).toEqual(fakeStreak);
      expect(mockInsertRitual).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: USER_ID,
          type: "morning",
          mood: 4,
          gratitude: "Grateful for health",
          intention: "Focus on deep work",
        }),
      );
    });

    it("returns existing ritual if already done today", async () => {
      mockFindRitualByDate.mockResolvedValueOnce(fakeRitual);
      // getOrCreateStreak calls findStreakByUserId
      mockFindStreakByUserId.mockResolvedValueOnce(fakeStreak);

      const result = await logRitual(USER_ID, {
        ritualType: "morning",
      });

      expect(result.ritual).toEqual(fakeRitual);
      expect(result.streak).toEqual(fakeStreak);
      expect(mockInsertRitual).not.toHaveBeenCalled();
    });
  });

  // ── getRitualHistory ──────────────────────────────────────────────

  describe("getRitualHistory", () => {
    it("passes correct offset and limit to repository", async () => {
      const historyResult = { items: [fakeRitual], total: 1 };
      mockFindRitualHistory.mockResolvedValueOnce(historyResult);

      const result = await getRitualHistory(USER_ID, {
        page: 1,
        limit: 20,
      });

      expect(result).toEqual(historyResult);
      expect(mockFindRitualHistory).toHaveBeenCalledWith(USER_ID, 20, 0);
    });

    it("calculates offset from page and limit", async () => {
      mockFindRitualHistory.mockResolvedValueOnce({ items: [], total: 50 });

      await getRitualHistory(USER_ID, { page: 3, limit: 10 });

      // offset = (page - 1) * limit = (3 - 1) * 10 = 20
      expect(mockFindRitualHistory).toHaveBeenCalledWith(USER_ID, 10, 20);
    });

    it("returns items and total from repository", async () => {
      const items = [fakeRitual];
      mockFindRitualHistory.mockResolvedValueOnce({ items, total: 42 });

      const result = await getRitualHistory(USER_ID, {
        page: 1,
        limit: 20,
      });

      expect(result.items).toEqual(items);
      expect(result.total).toBe(42);
    });
  });
});
