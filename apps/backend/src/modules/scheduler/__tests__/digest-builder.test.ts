import { describe, it, expect } from "vitest";
import {
  buildDigest,
  digestToTemplateVars,
  shouldSendDigest,
} from "../digest-builder.js";

describe("Digest Builder", () => {
  const sampleTasks = [
    {
      id: "t1",
      title: "Buy groceries",
      dueDate: new Date("2026-03-15T10:00:00Z"),
      priority: "high",
      status: "pending",
      completedAt: null,
    },
    {
      id: "t2",
      title: "Write report",
      dueDate: new Date("2026-03-14T10:00:00Z"),
      priority: "medium",
      status: "pending",
      completedAt: null,
    },
    {
      id: "t3",
      title: "Exercise",
      dueDate: new Date("2026-03-15T06:00:00Z"),
      priority: "low",
      status: "completed",
      completedAt: new Date("2026-03-15T07:00:00Z"),
    },
    {
      id: "t4",
      title: "Cancelled meeting",
      dueDate: new Date("2026-03-15T14:00:00Z"),
      priority: "none",
      status: "cancelled",
      completedAt: null,
    },
  ];

  const date = new Date("2026-03-15T12:00:00Z");

  // ── buildDigest ───────────────────────────────────────────────────

  describe("buildDigest", () => {
    it("returns correct userId", () => {
      const digest = buildDigest("user-1", sampleTasks, 5, date);
      expect(digest.userId).toBe("user-1");
    });

    it("returns correct date string", () => {
      const digest = buildDigest("user-1", sampleTasks, 5, date);
      expect(digest.date).toBe("2026-03-15");
    });

    it("counts pending tasks", () => {
      const digest = buildDigest("user-1", sampleTasks, 5, date);
      expect(digest.pendingTasks).toHaveLength(2);
    });

    it("identifies overdue tasks", () => {
      const digest = buildDigest("user-1", sampleTasks, 5, date);
      // t1 (due 10:00) and t2 (due 2026-03-14) are both overdue at 12:00
      expect(digest.overdueTasks).toHaveLength(2);
      const ids = digest.overdueTasks.map((t) => t.taskId);
      expect(ids).toContain("t1");
      expect(ids).toContain("t2");
    });

    it("counts tasks completed today", () => {
      const digest = buildDigest("user-1", sampleTasks, 5, date);
      expect(digest.completedToday).toBe(1);
    });

    it("includes streak days", () => {
      const digest = buildDigest("user-1", sampleTasks, 7, date);
      expect(digest.streakDays).toBe(7);
    });

    it("handles empty task list", () => {
      const digest = buildDigest("user-1", [], 0, date);
      expect(digest.pendingTasks).toHaveLength(0);
      expect(digest.overdueTasks).toHaveLength(0);
      expect(digest.completedToday).toBe(0);
    });

    it("excludes cancelled tasks from pending", () => {
      const digest = buildDigest("user-1", sampleTasks, 5, date);
      const cancelledInPending = digest.pendingTasks.find(
        (t) => t.taskId === "t4",
      );
      expect(cancelledInPending).toBeUndefined();
    });
  });

  // ── digestToTemplateVars ──────────────────────────────────────────

  describe("digestToTemplateVars", () => {
    it("includes user_name", () => {
      const digest = buildDigest("user-1", sampleTasks, 5, date);
      const vars = digestToTemplateVars(digest, "Alice");
      expect(vars.user_name).toBe("Alice");
    });

    it("includes pending count as string", () => {
      const digest = buildDigest("user-1", sampleTasks, 5, date);
      const vars = digestToTemplateVars(digest, "Alice");
      expect(vars.pending_count).toBe("2");
    });

    it("includes overdue count", () => {
      const digest = buildDigest("user-1", sampleTasks, 5, date);
      const vars = digestToTemplateVars(digest, "Alice");
      expect(vars.overdue_count).toBe("2");
    });

    it("includes completed_today", () => {
      const digest = buildDigest("user-1", sampleTasks, 5, date);
      const vars = digestToTemplateVars(digest, "Alice");
      expect(vars.completed_today).toBe("1");
    });

    it("includes top_tasks with up to 3 items", () => {
      const digest = buildDigest("user-1", sampleTasks, 5, date);
      const vars = digestToTemplateVars(digest, "Alice");
      expect(vars.top_tasks).toContain("Buy groceries");
      expect(vars.top_tasks).toContain("Write report");
    });

    it("shows fallback when no pending tasks", () => {
      const digest = buildDigest("user-1", [], 0, date);
      const vars = digestToTemplateVars(digest, "Bob");
      expect(vars.top_tasks).toBe("No pending tasks");
    });
  });

  // ── shouldSendDigest ──────────────────────────────────────────────

  describe("shouldSendDigest", () => {
    it("daily mode sends every day", () => {
      for (let day = 0; day <= 6; day++) {
        expect(shouldSendDigest("daily", day)).toBe(true);
      }
    });

    it("weekdays mode sends Mon-Fri only", () => {
      expect(shouldSendDigest("weekdays", 0)).toBe(false); // Sun
      expect(shouldSendDigest("weekdays", 1)).toBe(true); // Mon
      expect(shouldSendDigest("weekdays", 5)).toBe(true); // Fri
      expect(shouldSendDigest("weekdays", 6)).toBe(false); // Sat
    });

    it("weekly mode sends only on Monday", () => {
      expect(shouldSendDigest("weekly", 1)).toBe(true);
      expect(shouldSendDigest("weekly", 0)).toBe(false);
      expect(shouldSendDigest("weekly", 3)).toBe(false);
    });

    it("off mode never sends", () => {
      for (let day = 0; day <= 6; day++) {
        expect(shouldSendDigest("off", day)).toBe(false);
      }
    });

    it("unknown mode defaults to not sending", () => {
      expect(shouldSendDigest("random", 1)).toBe(false);
    });
  });
});
