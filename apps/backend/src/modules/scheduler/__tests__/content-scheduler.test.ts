import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mock external dependencies ──────────────────────────────────────

function createChainableSelect(result: unknown[] = []) {
  // Drizzle query builders are thenable, so terminal chain links
  // must behave as both plain objects AND promises (for await).
  function makeThenable(val: unknown[]) {
    return {
      then: (resolve: (v: unknown[]) => void, reject?: (e: unknown) => void) =>
        Promise.resolve(val).then(resolve, reject),
      where: vi.fn().mockResolvedValue(val),
      leftJoin: vi.fn().mockImplementation(() => makeThenable(val)),
    };
  }

  return {
    from: vi.fn().mockReturnValue({
      innerJoin: vi.fn().mockImplementation(() => makeThenable(result)),
      leftJoin: vi.fn().mockImplementation(() => makeThenable(result)),
      where: vi.fn().mockReturnValue({
        orderBy: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue(result),
        }),
      }),
    }),
  };
}

function createChainableCount(total: number) {
  return {
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue([{ total }]),
    }),
  };
}

const mockDbInsert = vi.fn().mockReturnValue({
  values: vi.fn().mockResolvedValue(undefined),
});

let selectImplementation: (...args: unknown[]) => any;

vi.mock("../../../db/index.js", () => ({
  db: {
    select: vi.fn((...args: unknown[]) => selectImplementation(...args)),
    insert: (...args: unknown[]) => mockDbInsert(...args),
  },
}));

vi.mock("../../../db/schema/index.js", () => ({
  dailyContent: {
    id: "id",
    category: "category",
    isActive: "isActive",
    content: "content",
    author: "author",
    sortWeight: "sortWeight",
  },
  userContentPrefs: {
    userId: "userId",
    category: "category",
    deliveryTime: "deliveryTime",
  },
  contentDeliveryLog: {
    userId: "userId",
    contentId: "contentId",
    channelType: "channelType",
  },
  notificationChannels: {
    userId: "userId",
    channelType: "channelType",
    isEnabled: "isEnabled",
    channelIdentifier: "channelIdentifier",
  },
  notificationPreferences: {
    userId: "userId",
    primaryChannel: "primaryChannel",
  },
  profiles: {
    id: "id",
    name: "name",
  },
}));

vi.mock("../../../services/templates/template-engine.js", () => ({
  renderTemplate: vi.fn().mockReturnValue({ text: "Your daily content" }),
}));

const mockDispatchJob = vi.fn();
vi.mock("../notification-dispatcher.js", () => ({
  dispatchJob: (...args: unknown[]) => mockDispatchJob(...args),
}));

vi.mock("../../../middleware/logger.js", () => ({
  logger: {
    child: () => ({
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
    }),
  },
}));

import {
  runContentDelivery,
  selectContentForUser,
  isWithinDeliveryWindow,
  deliverContentToUser,
} from "../content-scheduler.js";
import { db } from "../../../db/index.js";

// ── Helpers ─────────────────────────────────────────────────────────

function makeFakeContent(overrides: Record<string, unknown> = {}) {
  return {
    id: "content-1",
    category: "mahabharata_quotes",
    content: "Dharma is the foundation of the universe.",
    author: "Bhishma",
    isActive: true,
    sortWeight: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

// ── Tests ───────────────────────────────────────────────────────────

describe("Content Scheduler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    selectImplementation = () => createChainableSelect([]);
    mockDispatchJob.mockResolvedValue({ success: true });
  });

  // ── isWithinDeliveryWindow ────────────────────────────────────────

  describe("isWithinDeliveryWindow", () => {
    it("returns true when current time is within 30 minutes of delivery time", () => {
      expect(isWithinDeliveryWindow("08:15", "08:00")).toBe(true);
    });

    it("returns true when exactly at delivery time", () => {
      expect(isWithinDeliveryWindow("08:00", "08:00")).toBe(true);
    });

    it("returns true at boundary (exactly 30 minutes)", () => {
      expect(isWithinDeliveryWindow("08:30", "08:00")).toBe(true);
    });

    it("returns false when outside the 30 minute window", () => {
      expect(isWithinDeliveryWindow("09:00", "08:00")).toBe(false);
    });

    it("handles midnight wraparound: current 23:45, delivery 00:00", () => {
      expect(isWithinDeliveryWindow("23:45", "00:00")).toBe(true);
    });

    it("handles midnight wraparound: current 00:15, delivery 23:50", () => {
      expect(isWithinDeliveryWindow("00:15", "23:50")).toBe(true);
    });

    it("returns false for large time difference across midnight", () => {
      expect(isWithinDeliveryWindow("22:00", "00:00")).toBe(false);
    });

    it("returns true when current is 29 minutes before delivery", () => {
      expect(isWithinDeliveryWindow("07:31", "08:00")).toBe(true);
    });
  });

  // ── selectContentForUser ─────────────────────────────────────────

  describe("selectContentForUser", () => {
    it("returns content when available and not yet delivered", async () => {
      const content = makeFakeContent();
      let callIndex = 0;

      selectImplementation = (fields: any) => {
        callIndex += 1;
        if (callIndex === 1) {
          // Delivered IDs query
          return createChainableSelect([]);
        }
        if (callIndex === 2) {
          // Count query
          return createChainableCount(5);
        }
        // Content selection query
        return {
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue([content]),
              }),
            }),
          }),
        };
      };

      const result = await selectContentForUser("user-1", "mahabharata_quotes");

      expect(result).toBeDefined();
      expect(result?.id).toBe("content-1");
    });

    it("returns null when no content is available in category", async () => {
      let callIndex = 0;

      selectImplementation = () => {
        callIndex += 1;
        if (callIndex === 1) return createChainableSelect([]);
        if (callIndex === 2) return createChainableCount(0);
        return {
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue([]),
              }),
            }),
          }),
        };
      };

      const result = await selectContentForUser("user-1", "stan_lee_quotes");

      expect(result).toBeNull();
    });

    it("resets cycle when all content has been shown", async () => {
      const content = makeFakeContent({ id: "content-recycled" });
      let callIndex = 0;

      selectImplementation = () => {
        callIndex += 1;
        if (callIndex === 1) {
          // Delivered IDs: 3 items delivered
          return createChainableSelect([
            { contentId: "c1" },
            { contentId: "c2" },
            { contentId: "c3" },
          ]);
        }
        if (callIndex === 2) {
          // Total count: 3 (all delivered = cycle reset)
          return createChainableCount(3);
        }
        return {
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue([content]),
              }),
            }),
          }),
        };
      };

      const result = await selectContentForUser("user-1", "mahabharata_quotes");

      expect(result).toBeDefined();
      expect(result?.id).toBe("content-recycled");
    });
  });

  // ── deliverContentToUser ─────────────────────────────────────────

  describe("deliverContentToUser", () => {
    it("dispatches content and records delivery on success", async () => {
      const content = makeFakeContent();
      let callIndex = 0;

      selectImplementation = () => {
        callIndex += 1;
        if (callIndex === 1) return createChainableSelect([]);
        if (callIndex === 2) return createChainableCount(5);
        if (callIndex === 3) {
          // selectContentForUser: content selection
          return {
            from: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                orderBy: vi.fn().mockReturnValue({
                  limit: vi.fn().mockResolvedValue([content]),
                }),
              }),
            }),
          };
        }
        // getUserChannelIdentifier
        return {
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([{
              channelIdentifier: "+919876543210",
            }]),
          }),
        };
      };

      mockDispatchJob.mockResolvedValue({ success: true });

      const result = await deliverContentToUser(
        "user-1",
        "mahabharata_quotes",
        "whatsapp",
        "Test User",
      );

      expect(result.success).toBe(true);
      expect(result.userId).toBe("user-1");
      expect(result.contentId).toBe("content-1");
      expect(mockDispatchJob).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: "user-1",
          channel: "whatsapp",
          messageType: "daily_content",
        }),
      );
      expect(mockDbInsert).toHaveBeenCalled();
    });

    it("returns no_content_available when no content is found", async () => {
      let callIndex = 0;

      selectImplementation = () => {
        callIndex += 1;
        if (callIndex === 1) return createChainableSelect([]);
        if (callIndex === 2) return createChainableCount(0);
        return {
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue([]),
              }),
            }),
          }),
        };
      };

      const result = await deliverContentToUser(
        "user-1",
        "mahabharata_quotes",
        "push",
        "User",
      );

      expect(result.success).toBe(false);
      expect(result.reason).toBe("no_content_available");
      expect(mockDispatchJob).not.toHaveBeenCalled();
    });

    it("returns no_channel_connected when no channel identifier found", async () => {
      const content = makeFakeContent();
      let callIndex = 0;

      selectImplementation = () => {
        callIndex += 1;
        if (callIndex === 1) return createChainableSelect([]);
        if (callIndex === 2) return createChainableCount(5);
        if (callIndex === 3) {
          return {
            from: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                orderBy: vi.fn().mockReturnValue({
                  limit: vi.fn().mockResolvedValue([content]),
                }),
              }),
            }),
          };
        }
        // getUserChannelIdentifier: no channel found (primary and push fallback)
        return {
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([]),
          }),
        };
      };

      const result = await deliverContentToUser(
        "user-1",
        "mahabharata_quotes",
        "telegram",
        "User",
      );

      expect(result.success).toBe(false);
      expect(result.reason).toBe("no_channel_connected");
    });
  });

  // ── runContentDelivery ────────────────────────────────────────────

  describe("runContentDelivery", () => {
    it("returns zeros when no users have content preferences", async () => {
      selectImplementation = () => createChainableSelect([]);

      const stats = await runContentDelivery();

      expect(stats.usersProcessed).toBe(0);
      expect(stats.delivered).toBe(0);
      expect(stats.failed).toBe(0);
      expect(stats.skipped).toBe(0);
    });

    it("skips users outside their delivery time window", async () => {
      const currentHour = new Date().toISOString().slice(11, 16);
      // Set delivery time 2 hours away from current time
      const [h, m] = currentHour.split(":").map(Number);
      const farTime = `${String((h + 3) % 24).padStart(2, "0")}:${String(m).padStart(2, "0")}`;

      let callIndex = 0;
      selectImplementation = () => {
        callIndex += 1;
        if (callIndex === 1) {
          // Users with content prefs
          return createChainableSelect([{
            contentPref: {
              userId: "user-1",
              category: "mahabharata_quotes",
              deliveryTime: farTime,
            },
            notifPref: { primaryChannel: "push" },
            profile: { name: "Test User" },
          }]);
        }
        return createChainableSelect([]);
      };

      const stats = await runContentDelivery();

      expect(stats.usersProcessed).toBe(1);
      expect(stats.skipped).toBe(1);
      expect(stats.delivered).toBe(0);
      expect(mockDispatchJob).not.toHaveBeenCalled();
    });

    it("processes users within their delivery window", async () => {
      const currentHourMinute = new Date().toISOString().slice(11, 16);
      const content = makeFakeContent();

      let callIndex = 0;
      selectImplementation = () => {
        callIndex += 1;
        if (callIndex === 1) {
          // Users with content prefs (delivery time = now)
          return createChainableSelect([{
            contentPref: {
              userId: "user-1",
              category: "mahabharata_quotes",
              deliveryTime: currentHourMinute,
            },
            notifPref: { primaryChannel: "push" },
            profile: { name: "Test User" },
          }]);
        }
        // selectContentForUser internal calls
        if (callIndex === 2) return createChainableSelect([]); // delivered IDs
        if (callIndex === 3) return createChainableCount(5);
        if (callIndex === 4) {
          return {
            from: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                orderBy: vi.fn().mockReturnValue({
                  limit: vi.fn().mockResolvedValue([content]),
                }),
              }),
            }),
          };
        }
        // getUserChannelIdentifier
        return {
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([{
              channelIdentifier: "fcm-token",
            }]),
          }),
        };
      };

      mockDispatchJob.mockResolvedValue({ success: true });

      const stats = await runContentDelivery();

      expect(stats.usersProcessed).toBe(1);
      expect(stats.delivered).toBe(1);
      expect(mockDispatchJob).toHaveBeenCalled();
    });

    it("counts failed deliveries correctly", async () => {
      const currentHourMinute = new Date().toISOString().slice(11, 16);

      let callIndex = 0;
      selectImplementation = () => {
        callIndex += 1;
        if (callIndex === 1) {
          return createChainableSelect([{
            contentPref: {
              userId: "user-1",
              category: "mahabharata_quotes",
              deliveryTime: currentHourMinute,
            },
            notifPref: { primaryChannel: "push" },
            profile: { name: "Test User" },
          }]);
        }
        // selectContentForUser: no content available
        if (callIndex === 2) return createChainableSelect([]);
        if (callIndex === 3) return createChainableCount(0);
        return {
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue([]),
              }),
            }),
          }),
        };
      };

      const stats = await runContentDelivery();

      expect(stats.usersProcessed).toBe(1);
      expect(stats.failed).toBe(1);
      expect(stats.delivered).toBe(0);
    });
  });
});
