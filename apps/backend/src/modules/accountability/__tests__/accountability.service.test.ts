import { describe, it, expect, vi, beforeEach } from "vitest";

const mockFindPartners = vi.fn();
const mockFindPartnerById = vi.fn();
const mockFindPartnerByInviteCode = vi.fn();
const mockInsertPartner = vi.fn();
const mockUpdatePartnerStatus = vi.fn();
const mockDeletePartner = vi.fn();
const mockInsertNudge = vi.fn();
const mockFindNudgesSentToday = vi.fn();
const mockInsertSharedGoal = vi.fn();
const mockFindSharedGoalById = vi.fn();
const mockFindGoalProgress = vi.fn();

vi.mock("../accountability.repository.js", () => ({
  findPartners: (...args: unknown[]) => mockFindPartners(...args),
  findPartnerById: (...args: unknown[]) => mockFindPartnerById(...args),
  findPartnerByInviteCode: (...args: unknown[]) => mockFindPartnerByInviteCode(...args),
  insertPartner: (...args: unknown[]) => mockInsertPartner(...args),
  updatePartnerStatus: (...args: unknown[]) => mockUpdatePartnerStatus(...args),
  deletePartner: (...args: unknown[]) => mockDeletePartner(...args),
  insertNudge: (...args: unknown[]) => mockInsertNudge(...args),
  findNudgesSentToday: (...args: unknown[]) => mockFindNudgesSentToday(...args),
  insertSharedGoal: (...args: unknown[]) => mockInsertSharedGoal(...args),
  findSharedGoalById: (...args: unknown[]) => mockFindSharedGoalById(...args),
  findGoalProgress: (...args: unknown[]) => mockFindGoalProgress(...args),
}));

import {
  getPartners,
  createInvite,
  acceptInvite,
  removePartner,
  sendNudge,
  createSharedGoal,
  getGoalProgress,
} from "../accountability.service.js";

describe("Accountability Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getPartners", () => {
    it("returns partners list", async () => {
      mockFindPartners.mockResolvedValueOnce([{ id: "p-1" }]);
      const result = await getPartners("user-1");
      expect(result).toHaveLength(1);
    });
  });

  describe("createInvite", () => {
    it("creates an invite with a unique code", async () => {
      mockInsertPartner.mockResolvedValueOnce({
        id: "p-1",
        inviteCode: "abc123",
      });

      const result = await createInvite("user-1");

      expect(result.inviteCode).toBeTruthy();
      expect(result.inviteLink).toContain("/accountability/accept/");
      expect(mockInsertPartner).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: "user-1",
          status: "pending",
        }),
      );
    });
  });

  describe("acceptInvite", () => {
    it("accepts a valid invite", async () => {
      mockFindPartnerByInviteCode.mockResolvedValueOnce({
        id: "p-1",
        userId: "user-1",
        status: "pending",
      });
      mockUpdatePartnerStatus.mockResolvedValueOnce({
        id: "p-1",
        status: "active",
      });

      const result = await acceptInvite("user-2", "abc123");

      expect(result?.status).toBe("active");
    });

    it("returns undefined for non-existent invite", async () => {
      mockFindPartnerByInviteCode.mockResolvedValueOnce(undefined);

      const result = await acceptInvite("user-2", "nope");
      expect(result).toBeUndefined();
    });

    it("rejects already used invite", async () => {
      mockFindPartnerByInviteCode.mockResolvedValueOnce({
        id: "p-1",
        userId: "user-1",
        status: "active",
      });

      await expect(acceptInvite("user-2", "abc123")).rejects.toThrow(
        "Invite has already been used",
      );
    });

    it("rejects self-accept", async () => {
      mockFindPartnerByInviteCode.mockResolvedValueOnce({
        id: "p-1",
        userId: "user-1",
        status: "pending",
      });

      await expect(acceptInvite("user-1", "abc123")).rejects.toThrow(
        "Cannot accept your own invite",
      );
    });
  });

  describe("removePartner", () => {
    it("deletes a partnership", async () => {
      mockDeletePartner.mockResolvedValueOnce(true);

      const result = await removePartner("user-1", "p-1");
      expect(result).toBe(true);
    });

    it("returns false when not found", async () => {
      mockDeletePartner.mockResolvedValueOnce(false);

      const result = await removePartner("user-1", "p-999");
      expect(result).toBe(false);
    });
  });

  describe("sendNudge", () => {
    it("sends a nudge successfully", async () => {
      mockFindPartnerById.mockResolvedValueOnce({
        id: "p-1",
        userId: "user-1",
        partnerId: "user-2",
        status: "active",
      });
      mockFindNudgesSentToday.mockResolvedValueOnce([]);
      mockInsertNudge.mockResolvedValueOnce({ id: "n-1", message: "Go!" });

      const result = await sendNudge("user-1", "p-1", { message: "Go!" });

      expect(result.message).toBe("Go!");
    });

    it("rejects for non-existent partnership", async () => {
      mockFindPartnerById.mockResolvedValueOnce(undefined);

      await expect(
        sendNudge("user-1", "p-999", { message: "Go!" }),
      ).rejects.toThrow("Partnership not found");
    });

    it("rejects for inactive partnership", async () => {
      mockFindPartnerById.mockResolvedValueOnce({
        id: "p-1",
        userId: "user-1",
        partnerId: "user-2",
        status: "pending",
      });

      await expect(
        sendNudge("user-1", "p-1", { message: "Go!" }),
      ).rejects.toThrow("Partnership is not active");
    });

    it("enforces 1 nudge per day limit", async () => {
      mockFindPartnerById.mockResolvedValueOnce({
        id: "p-1",
        userId: "user-1",
        partnerId: "user-2",
        status: "active",
      });
      mockFindNudgesSentToday.mockResolvedValueOnce([{ id: "n-1" }]);

      await expect(
        sendNudge("user-1", "p-1", { message: "Again!" }),
      ).rejects.toThrow("You can only send one nudge per day per partner");
    });
  });

  describe("createSharedGoal", () => {
    it("creates a shared goal", async () => {
      mockInsertSharedGoal.mockResolvedValueOnce({
        id: "g-1",
        title: "100 tasks",
      });

      const result = await createSharedGoal({
        title: "100 tasks",
        targetValue: 100,
        metric: "tasks_completed",
        startsAt: new Date("2026-04-01"),
        endsAt: new Date("2026-04-30"),
      });

      expect(result.title).toBe("100 tasks");
    });

    it("rejects end date before start date", async () => {
      await expect(
        createSharedGoal({
          title: "Goal",
          targetValue: 10,
          metric: "tasks_completed",
          startsAt: new Date("2026-04-30"),
          endsAt: new Date("2026-04-01"),
        }),
      ).rejects.toThrow("End date must be after start date");
    });
  });

  describe("getGoalProgress", () => {
    it("returns goal with participants", async () => {
      mockFindSharedGoalById.mockResolvedValueOnce({ id: "g-1", title: "Goal" });
      mockFindGoalProgress.mockResolvedValueOnce([
        { userId: "user-1", currentValue: 25 },
      ]);

      const result = await getGoalProgress("g-1");

      expect(result?.goal.title).toBe("Goal");
      expect(result?.participants).toHaveLength(1);
    });

    it("returns undefined for non-existent goal", async () => {
      mockFindSharedGoalById.mockResolvedValueOnce(undefined);

      const result = await getGoalProgress("g-999");
      expect(result).toBeUndefined();
    });
  });
});
