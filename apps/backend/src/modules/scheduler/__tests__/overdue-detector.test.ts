import { describe, it, expect } from "vitest";
import {
  computeMinutesOverdue,
  determineAlertLevel,
  channelsForAlertLevel,
  findOverdueTasks,
  groupByUser,
} from "../overdue-detector.js";

describe("Overdue Detector", () => {
  // ── computeMinutesOverdue ─────────────────────────────────────────

  describe("computeMinutesOverdue", () => {
    it("returns 0 when task is not yet due", () => {
      const future = new Date(Date.now() + 60 * 60 * 1000);
      expect(computeMinutesOverdue(future)).toBe(0);
    });

    it("returns positive minutes when overdue", () => {
      const past = new Date(Date.now() - 30 * 60 * 1000);
      const result = computeMinutesOverdue(past);
      expect(result).toBeGreaterThanOrEqual(29);
      expect(result).toBeLessThanOrEqual(31);
    });

    it("accepts explicit now parameter", () => {
      const due = new Date("2026-03-15T10:00:00Z");
      const now = new Date("2026-03-15T11:00:00Z");
      expect(computeMinutesOverdue(due, now)).toBe(60);
    });

    it("returns 0 when due and now are the same", () => {
      const same = new Date("2026-03-15T10:00:00Z");
      expect(computeMinutesOverdue(same, same)).toBe(0);
    });
  });

  // ── determineAlertLevel ───────────────────────────────────────────

  describe("determineAlertLevel", () => {
    it("returns mild for tasks overdue less than 1h", () => {
      expect(determineAlertLevel(30, "medium")).toBe("mild");
    });

    it("returns moderate for tasks overdue 1-6h", () => {
      expect(determineAlertLevel(120, "medium")).toBe("moderate");
    });

    it("returns severe for tasks overdue 6-24h", () => {
      expect(determineAlertLevel(720, "medium")).toBe("severe");
    });

    it("returns critical for tasks overdue 24h+", () => {
      expect(determineAlertLevel(1500, "medium")).toBe("critical");
    });

    it("urgent tasks escalate faster", () => {
      // 45 min overdue with urgent priority should be moderate
      // (45 * 2 = 90 adjusted minutes >= 60 threshold)
      expect(determineAlertLevel(45, "urgent")).toBe("moderate");
      // Same time with medium priority is still mild
      expect(determineAlertLevel(45, "medium")).toBe("mild");
    });

    it("high priority tasks escalate moderately faster", () => {
      const result = determineAlertLevel(50, "high");
      // 50 * (1/0.75) = 66.67, > 60 threshold
      expect(result).toBe("moderate");
    });
  });

  // ── channelsForAlertLevel ─────────────────────────────────────────

  describe("channelsForAlertLevel", () => {
    it("mild uses only push", () => {
      expect(channelsForAlertLevel("mild")).toEqual(["push"]);
    });

    it("moderate uses push and telegram", () => {
      expect(channelsForAlertLevel("moderate")).toEqual(["push", "telegram"]);
    });

    it("severe includes whatsapp", () => {
      const channels = channelsForAlertLevel("severe");
      expect(channels).toContain("whatsapp");
      expect(channels).toHaveLength(4);
    });

    it("critical includes sms", () => {
      const channels = channelsForAlertLevel("critical");
      expect(channels).toContain("sms");
      expect(channels).toHaveLength(5);
    });
  });

  // ── findOverdueTasks ──────────────────────────────────────────────

  describe("findOverdueTasks", () => {
    const now = new Date("2026-03-15T12:00:00Z");

    const tasks = [
      {
        id: "t1",
        userId: "u1",
        title: "Overdue task",
        dueDate: new Date("2026-03-15T10:00:00Z"),
        priority: "high",
        status: "pending",
      },
      {
        id: "t2",
        userId: "u1",
        title: "Future task",
        dueDate: new Date("2026-03-16T10:00:00Z"),
        priority: "medium",
        status: "pending",
      },
      {
        id: "t3",
        userId: "u2",
        title: "Completed task",
        dueDate: new Date("2026-03-14T10:00:00Z"),
        priority: "low",
        status: "completed",
      },
      {
        id: "t4",
        userId: "u2",
        title: "No due date",
        dueDate: null,
        priority: "none",
        status: "pending",
      },
      {
        id: "t5",
        userId: "u2",
        title: "Cancelled",
        dueDate: new Date("2026-03-14T10:00:00Z"),
        priority: "urgent",
        status: "cancelled",
      },
    ];

    it("finds only overdue pending/in_progress tasks", () => {
      const result = findOverdueTasks(tasks, now);
      expect(result).toHaveLength(1);
      expect(result[0].taskId).toBe("t1");
    });

    it("calculates minutesOverdue correctly", () => {
      const result = findOverdueTasks(tasks, now);
      expect(result[0].minutesOverdue).toBe(120); // 2 hours
    });

    it("excludes completed tasks", () => {
      const result = findOverdueTasks(tasks, now);
      expect(result.find((t) => t.taskId === "t3")).toBeUndefined();
    });

    it("excludes cancelled tasks", () => {
      const result = findOverdueTasks(tasks, now);
      expect(result.find((t) => t.taskId === "t5")).toBeUndefined();
    });

    it("excludes tasks without due dates", () => {
      const result = findOverdueTasks(tasks, now);
      expect(result.find((t) => t.taskId === "t4")).toBeUndefined();
    });

    it("returns empty array when no tasks are overdue", () => {
      const early = new Date("2026-03-14T08:00:00Z");
      const result = findOverdueTasks(tasks, early);
      expect(result).toHaveLength(0);
    });
  });

  // ── groupByUser ───────────────────────────────────────────────────

  describe("groupByUser", () => {
    it("groups tasks by userId", () => {
      const tasks = [
        {
          taskId: "t1",
          userId: "u1",
          title: "A",
          dueDate: new Date(),
          minutesOverdue: 10,
          priority: "high",
        },
        {
          taskId: "t2",
          userId: "u2",
          title: "B",
          dueDate: new Date(),
          minutesOverdue: 20,
          priority: "low",
        },
        {
          taskId: "t3",
          userId: "u1",
          title: "C",
          dueDate: new Date(),
          minutesOverdue: 5,
          priority: "medium",
        },
      ];

      const groups = groupByUser(tasks);
      expect(groups.size).toBe(2);
      expect(groups.get("u1")).toHaveLength(2);
      expect(groups.get("u2")).toHaveLength(1);
    });

    it("handles empty array", () => {
      const groups = groupByUser([]);
      expect(groups.size).toBe(0);
    });
  });
});
