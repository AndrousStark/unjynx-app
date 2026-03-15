import { describe, it, expect, vi, beforeEach } from "vitest";

const mockInsertTeam = vi.fn();
const mockFindTeamById = vi.fn();
const mockUpdateTeam = vi.fn();
const mockInsertMember = vi.fn();
const mockFindMembers = vi.fn();
const mockFindMember = vi.fn();
const mockCountMembers = vi.fn();
const mockUpdateMemberRole = vi.fn();
const mockRemoveMember = vi.fn();
const mockInsertInvite = vi.fn();
const mockInsertStandup = vi.fn();
const mockFindStandups = vi.fn();
const mockGetTeamReport = vi.fn();

vi.mock("../teams.repository.js", () => ({
  insertTeam: (...args: unknown[]) => mockInsertTeam(...args),
  findTeamById: (...args: unknown[]) => mockFindTeamById(...args),
  updateTeam: (...args: unknown[]) => mockUpdateTeam(...args),
  insertMember: (...args: unknown[]) => mockInsertMember(...args),
  findMembers: (...args: unknown[]) => mockFindMembers(...args),
  findMember: (...args: unknown[]) => mockFindMember(...args),
  countMembers: (...args: unknown[]) => mockCountMembers(...args),
  updateMemberRole: (...args: unknown[]) => mockUpdateMemberRole(...args),
  removeMember: (...args: unknown[]) => mockRemoveMember(...args),
  insertInvite: (...args: unknown[]) => mockInsertInvite(...args),
  insertStandup: (...args: unknown[]) => mockInsertStandup(...args),
  findStandups: (...args: unknown[]) => mockFindStandups(...args),
  getTeamReport: (...args: unknown[]) => mockGetTeamReport(...args),
}));

import {
  createTeam,
  getTeam,
  updateTeam,
  getMembers,
  inviteMember,
  updateMemberRole,
  removeMember,
  getStandups,
  submitStandup,
  getTeamReport,
} from "../teams.service.js";

describe("Teams Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createTeam", () => {
    it("creates a team and adds owner as member", async () => {
      mockInsertTeam.mockResolvedValueOnce({ id: "t-1", name: "Team A" });
      mockInsertMember.mockResolvedValueOnce({ id: "m-1" });

      const result = await createTeam("user-1", { name: "Team A", maxMembers: 50 });

      expect(result.name).toBe("Team A");
      expect(mockInsertMember).toHaveBeenCalledWith(
        expect.objectContaining({
          teamId: "t-1",
          userId: "user-1",
          role: "owner",
          status: "active",
        }),
      );
    });
  });

  describe("getTeam", () => {
    it("returns team by id", async () => {
      mockFindTeamById.mockResolvedValueOnce({ id: "t-1" });
      const result = await getTeam("t-1");
      expect(result?.id).toBe("t-1");
    });

    it("returns undefined for non-existent team", async () => {
      mockFindTeamById.mockResolvedValueOnce(undefined);
      const result = await getTeam("t-999");
      expect(result).toBeUndefined();
    });
  });

  describe("updateTeam", () => {
    it("updates team details", async () => {
      mockUpdateTeam.mockResolvedValueOnce({ id: "t-1", name: "New Name" });

      const result = await updateTeam("t-1", { name: "New Name" });
      expect(result?.name).toBe("New Name");
    });
  });

  describe("getMembers", () => {
    it("returns team members", async () => {
      mockFindMembers.mockResolvedValueOnce([{ id: "m-1" }, { id: "m-2" }]);

      const result = await getMembers("t-1");
      expect(result).toHaveLength(2);
    });
  });

  describe("inviteMember", () => {
    it("creates an invite", async () => {
      mockFindTeamById.mockResolvedValueOnce({
        id: "t-1",
        maxMembers: 50,
      });
      mockCountMembers.mockResolvedValueOnce(5);
      mockInsertInvite.mockResolvedValueOnce({
        id: "inv-1",
        inviteCode: "abc123",
      });

      const result = await inviteMember("t-1", "user-1", {
        email: "new@example.com",
        role: "member",
      });

      expect(result.inviteCode).toBeTruthy();
    });

    it("rejects when team is full", async () => {
      mockFindTeamById.mockResolvedValueOnce({
        id: "t-1",
        maxMembers: 5,
      });
      mockCountMembers.mockResolvedValueOnce(5);

      await expect(
        inviteMember("t-1", "user-1", {
          email: "new@example.com",
          role: "member",
        }),
      ).rejects.toThrow("Team has reached maximum member limit");
    });

    it("rejects when team not found", async () => {
      mockFindTeamById.mockResolvedValueOnce(undefined);

      await expect(
        inviteMember("t-999", "user-1", {
          email: "new@example.com",
          role: "member",
        }),
      ).rejects.toThrow("Team not found");
    });
  });

  describe("updateMemberRole", () => {
    it("updates member role", async () => {
      mockFindMember.mockResolvedValueOnce({ role: "member" });
      mockUpdateMemberRole.mockResolvedValueOnce({ role: "admin" });

      const result = await updateMemberRole("t-1", "user-2", "admin");
      expect(result?.role).toBe("admin");
    });

    it("returns undefined for non-existent member", async () => {
      mockFindMember.mockResolvedValueOnce(undefined);

      const result = await updateMemberRole("t-1", "user-999", "admin");
      expect(result).toBeUndefined();
    });

    it("rejects changing owner role", async () => {
      mockFindMember.mockResolvedValueOnce({ role: "owner" });

      await expect(
        updateMemberRole("t-1", "user-1", "admin"),
      ).rejects.toThrow("Cannot change the owner's role");
    });
  });

  describe("removeMember", () => {
    it("removes a member", async () => {
      mockFindMember.mockResolvedValueOnce({ role: "member" });
      mockRemoveMember.mockResolvedValueOnce(true);

      const result = await removeMember("t-1", "user-2");
      expect(result).toBe(true);
    });

    it("returns false for non-existent member", async () => {
      mockFindMember.mockResolvedValueOnce(undefined);

      const result = await removeMember("t-1", "user-999");
      expect(result).toBe(false);
    });

    it("rejects removing the owner", async () => {
      mockFindMember.mockResolvedValueOnce({ role: "owner" });

      await expect(removeMember("t-1", "user-1")).rejects.toThrow(
        "Cannot remove the team owner",
      );
    });
  });

  describe("getStandups", () => {
    it("returns standups", async () => {
      mockFindStandups.mockResolvedValueOnce([{ id: "s-1" }]);

      const result = await getStandups("t-1");
      expect(result).toHaveLength(1);
    });
  });

  describe("submitStandup", () => {
    it("creates a standup entry", async () => {
      mockInsertStandup.mockResolvedValueOnce({
        id: "s-1",
        doneYesterday: ["Task A"],
      });

      const result = await submitStandup("t-1", "user-1", {
        doneYesterday: ["Task A"],
        plannedToday: ["Task B"],
        blockers: null,
      });

      expect(result.doneYesterday).toEqual(["Task A"]);
    });
  });

  describe("getTeamReport", () => {
    it("returns team report", async () => {
      mockGetTeamReport.mockResolvedValueOnce({
        memberCount: 5,
        totalTasks: 0,
        completedTasks: 0,
        completionRate: 0,
      });

      const result = await getTeamReport("t-1", { period: "week" });
      expect(result.memberCount).toBe(5);
    });
  });
});
