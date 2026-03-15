import { describe, it, expect } from "vitest";
import {
  createTeamSchema,
  updateTeamSchema,
  inviteMemberSchema,
  updateMemberRoleSchema,
  submitStandupSchema,
  standupQuerySchema,
  teamReportsQuerySchema,
} from "../teams.schema.js";

describe("Teams Schemas", () => {
  describe("createTeamSchema", () => {
    it("validates valid team creation", () => {
      const result = createTeamSchema.safeParse({ name: "METAminds" });
      expect(result.success).toBe(true);
    });

    it("uses default maxMembers of 50", () => {
      const result = createTeamSchema.parse({ name: "Team" });
      expect(result.maxMembers).toBe(50);
    });

    it("accepts logoUrl", () => {
      const result = createTeamSchema.safeParse({
        name: "Team",
        logoUrl: "https://example.com/logo.png",
      });
      expect(result.success).toBe(true);
    });

    it("rejects empty name", () => {
      const result = createTeamSchema.safeParse({ name: "" });
      expect(result.success).toBe(false);
    });

    it("rejects name > 100 chars", () => {
      const result = createTeamSchema.safeParse({ name: "A".repeat(101) });
      expect(result.success).toBe(false);
    });

    it("rejects maxMembers < 2", () => {
      const result = createTeamSchema.safeParse({ name: "T", maxMembers: 1 });
      expect(result.success).toBe(false);
    });

    it("rejects maxMembers > 500", () => {
      const result = createTeamSchema.safeParse({ name: "T", maxMembers: 501 });
      expect(result.success).toBe(false);
    });
  });

  describe("updateTeamSchema", () => {
    it("accepts partial update", () => {
      const result = updateTeamSchema.safeParse({ name: "New Name" });
      expect(result.success).toBe(true);
    });

    it("accepts empty object", () => {
      const result = updateTeamSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it("accepts null logoUrl", () => {
      const result = updateTeamSchema.safeParse({ logoUrl: null });
      expect(result.success).toBe(true);
    });
  });

  describe("inviteMemberSchema", () => {
    it("validates valid invite", () => {
      const result = inviteMemberSchema.safeParse({
        email: "test@example.com",
      });
      expect(result.success).toBe(true);
    });

    it("defaults role to member", () => {
      const result = inviteMemberSchema.parse({
        email: "test@example.com",
      });
      expect(result.role).toBe("member");
    });

    it("accepts admin role", () => {
      const result = inviteMemberSchema.safeParse({
        email: "admin@example.com",
        role: "admin",
      });
      expect(result.success).toBe(true);
    });

    it("rejects invalid email", () => {
      const result = inviteMemberSchema.safeParse({
        email: "not-an-email",
      });
      expect(result.success).toBe(false);
    });

    it("rejects owner role in invite", () => {
      const result = inviteMemberSchema.safeParse({
        email: "test@example.com",
        role: "owner",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("updateMemberRoleSchema", () => {
    it("accepts valid roles", () => {
      for (const role of ["admin", "member", "viewer"]) {
        const result = updateMemberRoleSchema.safeParse({ role });
        expect(result.success).toBe(true);
      }
    });

    it("rejects owner role", () => {
      const result = updateMemberRoleSchema.safeParse({ role: "owner" });
      expect(result.success).toBe(false);
    });
  });

  describe("submitStandupSchema", () => {
    it("validates valid standup", () => {
      const result = submitStandupSchema.safeParse({
        doneYesterday: ["Fixed bug #123"],
        plannedToday: ["Deploy v1.0"],
        blockers: "Waiting for review",
      });
      expect(result.success).toBe(true);
    });

    it("uses defaults for arrays", () => {
      const result = submitStandupSchema.parse({});
      expect(result.doneYesterday).toEqual([]);
      expect(result.plannedToday).toEqual([]);
    });

    it("accepts null blockers", () => {
      const result = submitStandupSchema.safeParse({ blockers: null });
      expect(result.success).toBe(true);
    });

    it("rejects array items exceeding 500 chars", () => {
      const result = submitStandupSchema.safeParse({
        doneYesterday: ["A".repeat(501)],
      });
      expect(result.success).toBe(false);
    });
  });

  describe("standupQuerySchema", () => {
    it("uses default limit", () => {
      const result = standupQuerySchema.parse({});
      expect(result.limit).toBe(20);
    });
  });

  describe("teamReportsQuerySchema", () => {
    it("defaults to week", () => {
      const result = teamReportsQuerySchema.parse({});
      expect(result.period).toBe("week");
    });

    it("accepts month", () => {
      const result = teamReportsQuerySchema.parse({ period: "month" });
      expect(result.period).toBe("month");
    });
  });
});
