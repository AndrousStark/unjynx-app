import { describe, it, expect } from "vitest";
import {
  buildCascade,
  shouldScheduleReminder,
  computeFirstReminderTime,
  defaultFallbackChain,
  priorityToNumber,
} from "../reminder-planner.js";
import type { ReminderPlan } from "../scheduler.types.js";

describe("Reminder Planner", () => {
  const basePlan: ReminderPlan = {
    taskId: "task-1",
    userId: "user-1",
    taskTitle: "Buy groceries",
    dueDate: new Date("2026-03-15T10:00:00Z"),
    priority: 5,
    advanceMinutes: 15,
    channels: ["push", "telegram", "email"],
    escalationDelays: { push: 5, telegram: 10 },
  };

  // ── priorityToNumber ───────────────────────────────────────────────

  describe("priorityToNumber", () => {
    it("maps urgent to 1", () => {
      expect(priorityToNumber("urgent")).toBe(1);
    });

    it("maps high to 2", () => {
      expect(priorityToNumber("high")).toBe(2);
    });

    it("maps medium to 5", () => {
      expect(priorityToNumber("medium")).toBe(5);
    });

    it("maps low to 7", () => {
      expect(priorityToNumber("low")).toBe(7);
    });

    it("maps unknown to 5", () => {
      expect(priorityToNumber("none")).toBe(5);
    });
  });

  // ── computeFirstReminderTime ──────────────────────────────────────

  describe("computeFirstReminderTime", () => {
    it("subtracts advance minutes from due date", () => {
      const due = new Date("2026-03-15T10:00:00Z");
      const result = computeFirstReminderTime(due, 15);
      expect(result.toISOString()).toBe("2026-03-15T09:45:00.000Z");
    });

    it("handles zero advance minutes", () => {
      const due = new Date("2026-03-15T10:00:00Z");
      const result = computeFirstReminderTime(due, 0);
      expect(result.toISOString()).toBe("2026-03-15T10:00:00.000Z");
    });

    it("handles large advance minutes", () => {
      const due = new Date("2026-03-15T10:00:00Z");
      const result = computeFirstReminderTime(due, 1440); // 24h
      expect(result.toISOString()).toBe("2026-03-14T10:00:00.000Z");
    });
  });

  // ── buildCascade ──────────────────────────────────────────────────

  describe("buildCascade", () => {
    it("produces one reminder per channel", () => {
      const cascade = buildCascade(basePlan);
      expect(cascade).toHaveLength(3);
    });

    it("assigns correct channels in order", () => {
      const cascade = buildCascade(basePlan);
      expect(cascade[0].channel).toBe("push");
      expect(cascade[1].channel).toBe("telegram");
      expect(cascade[2].channel).toBe("email");
    });

    it("first reminder is at dueDate minus advanceMinutes", () => {
      const cascade = buildCascade(basePlan);
      expect(cascade[0].scheduledAt.toISOString()).toBe(
        "2026-03-15T09:45:00.000Z",
      );
    });

    it("subsequent reminders are delayed by escalation delays", () => {
      const cascade = buildCascade(basePlan);
      // Push → Telegram: 5 min delay
      const pushTime = cascade[0].scheduledAt.getTime();
      const telegramTime = cascade[1].scheduledAt.getTime();
      expect(telegramTime - pushTime).toBe(5 * 60 * 1000);

      // Telegram → Email: 10 min delay
      const emailTime = cascade[2].scheduledAt.getTime();
      expect(emailTime - telegramTime).toBe(10 * 60 * 1000);
    });

    it("all reminders share the same cascadeId", () => {
      const cascade = buildCascade(basePlan);
      const cascadeId = cascade[0].cascadeId;
      for (const reminder of cascade) {
        expect(reminder.cascadeId).toBe(cascadeId);
      }
    });

    it("assigns incrementing cascadeOrder", () => {
      const cascade = buildCascade(basePlan);
      expect(cascade[0].cascadeOrder).toBe(0);
      expect(cascade[1].cascadeOrder).toBe(1);
      expect(cascade[2].cascadeOrder).toBe(2);
    });

    it("all reminders start as pending", () => {
      const cascade = buildCascade(basePlan);
      for (const reminder of cascade) {
        expect(reminder.status).toBe("pending");
      }
    });

    it("limits cascade to MAX_CASCADE_STEPS (8)", () => {
      const plan: ReminderPlan = {
        ...basePlan,
        channels: [
          "push",
          "telegram",
          "email",
          "whatsapp",
          "sms",
          "instagram",
          "slack",
          "discord",
          "push",
          "telegram",
        ],
      };
      const cascade = buildCascade(plan);
      expect(cascade).toHaveLength(8);
    });

    it("uses default delay when escalation delays are not configured", () => {
      const plan: ReminderPlan = {
        ...basePlan,
        escalationDelays: {}, // No delays configured
      };
      const cascade = buildCascade(plan);
      const diff =
        cascade[1].scheduledAt.getTime() - cascade[0].scheduledAt.getTime();
      expect(diff).toBe(5 * 60 * 1000); // Default 5 min
    });

    it("handles single-channel cascade", () => {
      const plan: ReminderPlan = {
        ...basePlan,
        channels: ["push"],
      };
      const cascade = buildCascade(plan);
      expect(cascade).toHaveLength(1);
      expect(cascade[0].channel).toBe("push");
    });
  });

  // ── shouldScheduleReminder ────────────────────────────────────────

  describe("shouldScheduleReminder", () => {
    it("returns true for pending task with due date", () => {
      const future = new Date(Date.now() + 60 * 60 * 1000);
      expect(shouldScheduleReminder("pending", future)).toBe(true);
    });

    it("returns true for in_progress task with due date", () => {
      const future = new Date(Date.now() + 60 * 60 * 1000);
      expect(shouldScheduleReminder("in_progress", future)).toBe(true);
    });

    it("returns false for completed task", () => {
      const future = new Date(Date.now() + 60 * 60 * 1000);
      expect(shouldScheduleReminder("completed", future)).toBe(false);
    });

    it("returns false for cancelled task", () => {
      const future = new Date(Date.now() + 60 * 60 * 1000);
      expect(shouldScheduleReminder("cancelled", future)).toBe(false);
    });

    it("returns false for task without due date", () => {
      expect(shouldScheduleReminder("pending", null)).toBe(false);
    });

    it("returns false for task overdue by more than 24h", () => {
      const pastDay = new Date(Date.now() - 25 * 60 * 60 * 1000);
      expect(shouldScheduleReminder("pending", pastDay)).toBe(false);
    });

    it("returns true for recently overdue task (within 24h)", () => {
      const recentlyPast = new Date(Date.now() - 60 * 60 * 1000);
      expect(shouldScheduleReminder("pending", recentlyPast)).toBe(true);
    });
  });

  // ── defaultFallbackChain ──────────────────────────────────────────

  describe("defaultFallbackChain", () => {
    it("urgent includes 5 channels", () => {
      expect(defaultFallbackChain("urgent")).toHaveLength(5);
      expect(defaultFallbackChain("urgent")).toContain("sms");
    });

    it("high includes 4 channels", () => {
      expect(defaultFallbackChain("high")).toHaveLength(4);
    });

    it("medium includes 3 channels", () => {
      expect(defaultFallbackChain("medium")).toHaveLength(3);
    });

    it("low includes 2 channels", () => {
      expect(defaultFallbackChain("low")).toHaveLength(2);
    });

    it("unknown defaults to medium chain", () => {
      expect(defaultFallbackChain("none")).toHaveLength(3);
    });

    it("all chains start with push", () => {
      for (const priority of ["urgent", "high", "medium", "low", "none"]) {
        expect(defaultFallbackChain(priority)[0]).toBe("push");
      }
    });
  });
});
