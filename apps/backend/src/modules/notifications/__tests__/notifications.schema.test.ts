import { describe, it, expect } from "vitest";
import {
  sendTestSchema,
  deliveryStatusQuerySchema,
  createNotificationSchema,
  updateNotificationPreferencesSchema,
  updateTeamNotificationSettingsSchema,
} from "../notifications.schema.js";

describe("Notification Schemas", () => {
  describe("sendTestSchema", () => {
    const validChannels = [
      "push",
      "telegram",
      "email",
      "whatsapp",
      "sms",
      "instagram",
      "slack",
      "discord",
    ];

    it.each(validChannels)("accepts valid channel: %s", (channel) => {
      const result = sendTestSchema.safeParse({ channel });
      expect(result.success).toBe(true);
    });

    it("rejects invalid channel", () => {
      const result = sendTestSchema.safeParse({ channel: "carrier_pigeon" });
      expect(result.success).toBe(false);
    });

    it("rejects empty input", () => {
      const result = sendTestSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe("deliveryStatusQuerySchema", () => {
    it("provides default limit of 20", () => {
      const result = deliveryStatusQuerySchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(20);
      }
    });

    it("coerces string limit", () => {
      const result = deliveryStatusQuerySchema.safeParse({ limit: "50" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(50);
      }
    });

    it("rejects limit below 1", () => {
      const result = deliveryStatusQuerySchema.safeParse({ limit: 0 });
      expect(result.success).toBe(false);
    });

    it("rejects limit above 100", () => {
      const result = deliveryStatusQuerySchema.safeParse({ limit: 101 });
      expect(result.success).toBe(false);
    });
  });

  describe("createNotificationSchema", () => {
    const validBase = {
      type: "task_reminder" as const,
      title: "Time to work!",
      body: "Your task 'Review PR' is due in 15 minutes.",
      scheduledAt: "2026-12-31T10:00:00Z",
    };

    it("validates minimal notification", () => {
      const result = createNotificationSchema.safeParse(validBase);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe("Time to work!");
        expect(result.data.priority).toBe(5);
        expect(result.data.cascadeOrder).toBe(0);
      }
    });

    it("validates full notification with all fields", () => {
      const result = createNotificationSchema.safeParse({
        ...validBase,
        taskId: "550e8400-e29b-41d4-a716-446655440000",
        actionUrl: "https://app.unjynx.com/tasks/123",
        contentId: "660e8400-e29b-41d4-a716-446655440000",
        expiresAt: "2026-12-31T12:00:00Z",
        priority: 1,
        cascadeId: "770e8400-e29b-41d4-a716-446655440000",
        cascadeOrder: 2,
        metadata: '{"key":"value"}',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.priority).toBe(1);
        expect(result.data.cascadeOrder).toBe(2);
      }
    });

    it("rejects empty title", () => {
      const result = createNotificationSchema.safeParse({
        ...validBase,
        title: "",
      });
      expect(result.success).toBe(false);
    });

    it("rejects title exceeding 500 chars", () => {
      const result = createNotificationSchema.safeParse({
        ...validBase,
        title: "a".repeat(501),
      });
      expect(result.success).toBe(false);
    });

    it("rejects empty body", () => {
      const result = createNotificationSchema.safeParse({
        ...validBase,
        body: "",
      });
      expect(result.success).toBe(false);
    });

    it("rejects body exceeding 5000 chars", () => {
      const result = createNotificationSchema.safeParse({
        ...validBase,
        body: "x".repeat(5001),
      });
      expect(result.success).toBe(false);
    });

    it("rejects invalid notification type", () => {
      const result = createNotificationSchema.safeParse({
        ...validBase,
        type: "invalid_type",
      });
      expect(result.success).toBe(false);
    });

    it("accepts all valid notification types", () => {
      const types = [
        "task_reminder",
        "overdue_alert",
        "streak_nudge",
        "daily_digest",
        "content_delivery",
        "team_update",
        "system",
      ];
      for (const type of types) {
        const result = createNotificationSchema.safeParse({
          ...validBase,
          type,
        });
        expect(result.success).toBe(true);
      }
    });

    it("rejects priority below 1", () => {
      const result = createNotificationSchema.safeParse({
        ...validBase,
        priority: 0,
      });
      expect(result.success).toBe(false);
    });

    it("rejects priority above 10", () => {
      const result = createNotificationSchema.safeParse({
        ...validBase,
        priority: 11,
      });
      expect(result.success).toBe(false);
    });

    it("accepts boundary priority values (1 and 10)", () => {
      const low = createNotificationSchema.safeParse({
        ...validBase,
        priority: 1,
      });
      const high = createNotificationSchema.safeParse({
        ...validBase,
        priority: 10,
      });
      expect(low.success).toBe(true);
      expect(high.success).toBe(true);
    });

    it("rejects non-integer priority", () => {
      const result = createNotificationSchema.safeParse({
        ...validBase,
        priority: 3.5,
      });
      expect(result.success).toBe(false);
    });

    it("rejects invalid taskId format", () => {
      const result = createNotificationSchema.safeParse({
        ...validBase,
        taskId: "not-a-uuid",
      });
      expect(result.success).toBe(false);
    });

    it("rejects invalid actionUrl format", () => {
      const result = createNotificationSchema.safeParse({
        ...validBase,
        actionUrl: "not-a-url",
      });
      expect(result.success).toBe(false);
    });

    it("rejects missing required fields", () => {
      const noTitle = createNotificationSchema.safeParse({
        type: "task_reminder",
        body: "body",
        scheduledAt: "2026-12-31T10:00:00Z",
      });
      const noBody = createNotificationSchema.safeParse({
        type: "task_reminder",
        title: "title",
        scheduledAt: "2026-12-31T10:00:00Z",
      });
      const noType = createNotificationSchema.safeParse({
        title: "title",
        body: "body",
        scheduledAt: "2026-12-31T10:00:00Z",
      });
      const noSchedule = createNotificationSchema.safeParse({
        type: "task_reminder",
        title: "title",
        body: "body",
      });
      expect(noTitle.success).toBe(false);
      expect(noBody.success).toBe(false);
      expect(noType.success).toBe(false);
      expect(noSchedule.success).toBe(false);
    });

    it("coerces date strings to Date objects", () => {
      const result = createNotificationSchema.safeParse(validBase);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.scheduledAt).toBeInstanceOf(Date);
      }
    });
  });

  describe("updateNotificationPreferencesSchema", () => {
    it("validates empty update (all optional)", () => {
      const result = updateNotificationPreferencesSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it("validates full preferences update", () => {
      const result = updateNotificationPreferencesSchema.safeParse({
        primaryChannel: "telegram",
        fallbackChannel: "email",
        fallbackChain: ["push", "telegram", "email"],
        quietStart: "22:00",
        quietEnd: "07:00",
        timezone: "Asia/Kolkata",
        maxRemindersPerDay: 30,
        digestMode: "daily_am",
        advanceReminderMinutes: 30,
      });
      expect(result.success).toBe(true);
    });

    it("accepts all valid channel types", () => {
      const channels = [
        "push",
        "telegram",
        "email",
        "whatsapp",
        "sms",
        "instagram",
        "slack",
        "discord",
      ];
      for (const ch of channels) {
        const result = updateNotificationPreferencesSchema.safeParse({
          primaryChannel: ch,
        });
        expect(result.success).toBe(true);
      }
    });

    it("rejects invalid channel type", () => {
      const result = updateNotificationPreferencesSchema.safeParse({
        primaryChannel: "pigeon",
      });
      expect(result.success).toBe(false);
    });

    it("accepts nullable fallbackChannel", () => {
      const result = updateNotificationPreferencesSchema.safeParse({
        fallbackChannel: null,
      });
      expect(result.success).toBe(true);
    });

    it("accepts nullable fallbackChain", () => {
      const result = updateNotificationPreferencesSchema.safeParse({
        fallbackChain: null,
      });
      expect(result.success).toBe(true);
    });

    it("rejects fallbackChain exceeding 8 channels", () => {
      const result = updateNotificationPreferencesSchema.safeParse({
        fallbackChain: [
          "push",
          "telegram",
          "email",
          "whatsapp",
          "sms",
          "instagram",
          "slack",
          "discord",
          "push",
        ],
      });
      expect(result.success).toBe(false);
    });

    it("validates quietStart HH:mm format", () => {
      expect(
        updateNotificationPreferencesSchema.safeParse({ quietStart: "22:00" })
          .success,
      ).toBe(true);
      expect(
        updateNotificationPreferencesSchema.safeParse({ quietStart: "00:00" })
          .success,
      ).toBe(true);
      expect(
        updateNotificationPreferencesSchema.safeParse({ quietStart: "23:59" })
          .success,
      ).toBe(true);
    });

    it("rejects invalid quietStart format", () => {
      expect(
        updateNotificationPreferencesSchema.safeParse({ quietStart: "25:00" })
          .success,
      ).toBe(false);
      expect(
        updateNotificationPreferencesSchema.safeParse({ quietStart: "10:60" })
          .success,
      ).toBe(false);
      expect(
        updateNotificationPreferencesSchema.safeParse({ quietStart: "10pm" })
          .success,
      ).toBe(false);
    });

    it("accepts nullable quiet times", () => {
      const result = updateNotificationPreferencesSchema.safeParse({
        quietStart: null,
        quietEnd: null,
      });
      expect(result.success).toBe(true);
    });

    it("accepts all valid digest modes", () => {
      const modes = ["off", "hourly", "daily_am", "daily_pm"];
      for (const mode of modes) {
        const result = updateNotificationPreferencesSchema.safeParse({
          digestMode: mode,
        });
        expect(result.success).toBe(true);
      }
    });

    it("rejects invalid digest mode", () => {
      const result = updateNotificationPreferencesSchema.safeParse({
        digestMode: "weekly",
      });
      expect(result.success).toBe(false);
    });

    it("rejects maxRemindersPerDay below 1", () => {
      const result = updateNotificationPreferencesSchema.safeParse({
        maxRemindersPerDay: 0,
      });
      expect(result.success).toBe(false);
    });

    it("rejects maxRemindersPerDay above 100", () => {
      const result = updateNotificationPreferencesSchema.safeParse({
        maxRemindersPerDay: 101,
      });
      expect(result.success).toBe(false);
    });

    it("accepts boundary maxRemindersPerDay values (1 and 100)", () => {
      expect(
        updateNotificationPreferencesSchema.safeParse({
          maxRemindersPerDay: 1,
        }).success,
      ).toBe(true);
      expect(
        updateNotificationPreferencesSchema.safeParse({
          maxRemindersPerDay: 100,
        }).success,
      ).toBe(true);
    });

    it("rejects advanceReminderMinutes above 1440", () => {
      const result = updateNotificationPreferencesSchema.safeParse({
        advanceReminderMinutes: 1441,
      });
      expect(result.success).toBe(false);
    });

    it("accepts boundary advanceReminderMinutes (0 and 1440)", () => {
      expect(
        updateNotificationPreferencesSchema.safeParse({
          advanceReminderMinutes: 0,
        }).success,
      ).toBe(true);
      expect(
        updateNotificationPreferencesSchema.safeParse({
          advanceReminderMinutes: 1440,
        }).success,
      ).toBe(true);
    });
  });

  describe("updateTeamNotificationSettingsSchema", () => {
    it("validates empty update (all optional)", () => {
      const result = updateTeamNotificationSettingsSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it("validates full update with all booleans", () => {
      const result = updateTeamNotificationSettingsSchema.safeParse({
        taskAssigned: false,
        taskCompleted: true,
        commentOnTask: false,
        projectUpdate: true,
        dailyStandup: false,
      });
      expect(result.success).toBe(true);
    });

    it("rejects non-boolean values", () => {
      const result = updateTeamNotificationSettingsSchema.safeParse({
        taskAssigned: "yes",
      });
      expect(result.success).toBe(false);
    });

    it("validates partial update with single field", () => {
      const result = updateTeamNotificationSettingsSchema.safeParse({
        dailyStandup: false,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.dailyStandup).toBe(false);
      }
    });
  });
});
