import { describe, it, expect } from "vitest";
import {
  planReminders,
  planOverdueAlerts,
  planDigest,
} from "../scheduler.service.js";
import type { UserPrefs } from "../scheduler.service.js";

describe("Scheduler Service", () => {
  const defaultPrefs: UserPrefs = {
    primaryChannel: "push",
    fallbackChain: ["push", "telegram", "email"],
    escalationDelays: { push: 5, telegram: 10 },
    advanceReminderMinutes: 15,
    quietStart: null,
    quietEnd: null,
    timezone: "UTC",
    overrideForUrgent: true,
    digestMode: "daily",
  };

  // ── planReminders ─────────────────────────────────────────────────

  describe("planReminders", () => {
    it("returns notification jobs for a task with due date", () => {
      const future = new Date(Date.now() + 2 * 60 * 60 * 1000);
      const jobs = planReminders(
        {
          taskId: "t1",
          userId: "u1",
          title: "Test task",
          dueDate: future,
          priority: "medium",
          status: "pending",
        },
        defaultPrefs,
      );

      expect(jobs).not.toBeNull();
      expect(jobs!.length).toBe(3); // push, telegram, email
    });

    it("returns null for completed tasks", () => {
      const future = new Date(Date.now() + 60 * 60 * 1000);
      const jobs = planReminders({
        taskId: "t1",
        userId: "u1",
        title: "Done",
        dueDate: future,
        priority: "medium",
        status: "completed",
      });

      expect(jobs).toBeNull();
    });

    it("returns null for tasks without due date", () => {
      const jobs = planReminders({
        taskId: "t1",
        userId: "u1",
        title: "No date",
        dueDate: null,
        priority: "medium",
        status: "pending",
      });

      expect(jobs).toBeNull();
    });

    it("uses default chain when no fallback chain specified", () => {
      const future = new Date(Date.now() + 2 * 60 * 60 * 1000);
      const prefs: UserPrefs = {
        ...defaultPrefs,
        fallbackChain: null,
      };

      const jobs = planReminders(
        {
          taskId: "t1",
          userId: "u1",
          title: "Test",
          dueDate: future,
          priority: "urgent",
          status: "pending",
        },
        prefs,
      );

      // Urgent default chain has 5 channels
      expect(jobs).not.toBeNull();
      expect(jobs!.length).toBe(5);
    });

    it("sets correct messageType", () => {
      const future = new Date(Date.now() + 2 * 60 * 60 * 1000);
      const jobs = planReminders(
        {
          taskId: "t1",
          userId: "u1",
          title: "Test",
          dueDate: future,
          priority: "medium",
          status: "pending",
        },
        defaultPrefs,
      );

      for (const job of jobs!) {
        expect(job.messageType).toBe("task_reminder");
      }
    });

    it("includes task_title in templateVars", () => {
      const future = new Date(Date.now() + 2 * 60 * 60 * 1000);
      const jobs = planReminders(
        {
          taskId: "t1",
          userId: "u1",
          title: "Buy groceries",
          dueDate: future,
          priority: "medium",
          status: "pending",
        },
        defaultPrefs,
      );

      expect(jobs![0].templateVars.task_title).toBe("Buy groceries");
    });

    it("all jobs share the same cascadeId", () => {
      const future = new Date(Date.now() + 2 * 60 * 60 * 1000);
      const jobs = planReminders(
        {
          taskId: "t1",
          userId: "u1",
          title: "Test",
          dueDate: future,
          priority: "medium",
          status: "pending",
        },
        defaultPrefs,
      );

      const cascadeId = jobs![0].cascadeId;
      expect(cascadeId).toBeDefined();
      for (const job of jobs!) {
        expect(job.cascadeId).toBe(cascadeId);
      }
    });
  });

  // ── planOverdueAlerts ─────────────────────────────────────────────

  describe("planOverdueAlerts", () => {
    const now = new Date("2026-03-15T12:00:00Z");

    it("generates alerts for overdue tasks", () => {
      const tasks = [
        {
          id: "t1",
          userId: "u1",
          title: "Overdue",
          dueDate: new Date("2026-03-15T10:00:00Z"),
          priority: "medium",
          status: "pending",
        },
      ];

      const jobs = planOverdueAlerts(tasks, now);
      expect(jobs.length).toBeGreaterThan(0);
    });

    it("uses overdue_alert message type", () => {
      const tasks = [
        {
          id: "t1",
          userId: "u1",
          title: "Late",
          dueDate: new Date("2026-03-15T11:00:00Z"),
          priority: "medium",
          status: "pending",
        },
      ];

      const jobs = planOverdueAlerts(tasks, now);
      for (const job of jobs) {
        expect(job.messageType).toBe("overdue_alert");
      }
    });

    it("returns empty for future tasks", () => {
      const tasks = [
        {
          id: "t1",
          userId: "u1",
          title: "Future",
          dueDate: new Date("2026-03-16T10:00:00Z"),
          priority: "medium",
          status: "pending",
        },
      ];

      const jobs = planOverdueAlerts(tasks, now);
      expect(jobs).toHaveLength(0);
    });

    it("skips completed tasks", () => {
      const tasks = [
        {
          id: "t1",
          userId: "u1",
          title: "Done",
          dueDate: new Date("2026-03-14T10:00:00Z"),
          priority: "medium",
          status: "completed",
        },
      ];

      const jobs = planOverdueAlerts(tasks, now);
      expect(jobs).toHaveLength(0);
    });

    it("severely overdue tasks use more channels", () => {
      const tasks = [
        {
          id: "t1",
          userId: "u1",
          title: "Very late",
          dueDate: new Date("2026-03-14T10:00:00Z"), // 26h overdue
          priority: "medium",
          status: "pending",
        },
      ];

      const jobs = planOverdueAlerts(tasks, now);
      // Critical level should produce jobs on 5 channels
      expect(jobs.length).toBe(5);
    });

    it("includes task_title in template vars", () => {
      const tasks = [
        {
          id: "t1",
          userId: "u1",
          title: "Important meeting",
          dueDate: new Date("2026-03-15T11:00:00Z"),
          priority: "medium",
          status: "pending",
        },
      ];

      const jobs = planOverdueAlerts(tasks, now);
      expect(jobs[0].templateVars.task_title).toBe("Important meeting");
    });
  });

  // ── planDigest ────────────────────────────────────────────────────

  describe("planDigest", () => {
    const tasks = [
      {
        id: "t1",
        title: "Pending task",
        dueDate: new Date("2026-03-15T10:00:00Z"),
        priority: "high",
        status: "pending",
        completedAt: null,
      },
    ];

    // Monday = day 1
    const monday = new Date("2026-03-16T08:00:00Z"); // March 16 2026 is Monday

    it("returns job when digest mode is daily", () => {
      const job = planDigest("u1", "Alice", tasks, {
        digestMode: "daily",
        primaryChannel: "push",
      }, 5, monday);

      expect(job).not.toBeNull();
      expect(job!.messageType).toBe("daily_digest");
    });

    it("returns null when digest mode is off", () => {
      const job = planDigest("u1", "Alice", tasks, {
        digestMode: "off",
        primaryChannel: "push",
      }, 5, monday);

      expect(job).toBeNull();
    });

    it("returns null when no tasks to report", () => {
      const job = planDigest("u1", "Alice", [], {
        digestMode: "daily",
        primaryChannel: "push",
      }, 0, monday);

      expect(job).toBeNull();
    });

    it("uses user primaryChannel", () => {
      const job = planDigest("u1", "Alice", tasks, {
        digestMode: "daily",
        primaryChannel: "telegram",
      }, 5, monday);

      expect(job!.channel).toBe("telegram");
    });

    it("includes user_name in template vars", () => {
      const job = planDigest("u1", "Bob", tasks, {
        digestMode: "daily",
        primaryChannel: "push",
      }, 5, monday);

      expect(job!.templateVars.user_name).toBe("Bob");
    });

    it("weekly mode only sends on Monday", () => {
      // Monday
      const mondayJob = planDigest("u1", "Alice", tasks, {
        digestMode: "weekly",
        primaryChannel: "push",
      }, 5, monday);
      expect(mondayJob).not.toBeNull();

      // Tuesday
      const tuesday = new Date("2026-03-17T08:00:00Z");
      const tuesdayJob = planDigest("u1", "Alice", tasks, {
        digestMode: "weekly",
        primaryChannel: "push",
      }, 5, tuesday);
      expect(tuesdayJob).toBeNull();
    });
  });
});
