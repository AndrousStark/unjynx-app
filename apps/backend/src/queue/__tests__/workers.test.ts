import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Job } from "bullmq";
import {
  processNotificationJob,
  type WorkerAdapterPort,
  type WorkerChannelPort,
  type WorkerDeliveryPort,
  type WorkerPreferencesPort,
  type WorkerQuietHoursPort,
  type WorkerEscalationPort,
} from "../workers.js";
import type { NotificationJobData, ChannelWorkerResult } from "../types.js";

// ── Mock Factories ──────────────────────────────────────────────────

function createMockJob(
  data: NotificationJobData,
  overrides?: Partial<Job<NotificationJobData, ChannelWorkerResult>>,
): Job<NotificationJobData, ChannelWorkerResult> {
  return {
    id: "test-job-1",
    name: "task_reminder:push",
    data,
    attemptsMade: 0,
    ...overrides,
  } as unknown as Job<NotificationJobData, ChannelWorkerResult>;
}

function createMockPorts() {
  const adapters: WorkerAdapterPort = {
    getAdapter: vi.fn().mockReturnValue({
      channelType: "push",
      send: vi.fn().mockResolvedValue({
        success: true,
        providerMessageId: "msg_123",
      }),
      validateConnection: vi.fn().mockResolvedValue(true),
      disconnect: vi.fn().mockResolvedValue(undefined),
    }),
  };

  const channels: WorkerChannelPort = {
    findChannel: vi.fn().mockResolvedValue({
      channelIdentifier: "fcm-token-abc",
      isEnabled: true,
    }),
  };

  const delivery: WorkerDeliveryPort = {
    insertDeliveryAttempt: vi.fn().mockResolvedValue({ id: "attempt-1" }),
    updateDeliveryAttempt: vi.fn().mockResolvedValue({}),
  };

  const preferences: WorkerPreferencesPort = {
    getPreferences: vi.fn().mockResolvedValue({
      quietStart: null,
      quietEnd: null,
      timezone: "UTC",
      fallbackChain: JSON.stringify(["push", "email", "sms"]),
    }),
  };

  const quietHours: WorkerQuietHoursPort = {
    isQuietHoursActive: vi.fn().mockReturnValue(false),
  };

  const escalation: WorkerEscalationPort = {
    enqueueEscalation: vi.fn().mockResolvedValue(undefined),
  };

  return { adapters, channels, delivery, preferences, quietHours, escalation };
}

function createSampleJobData(overrides?: Partial<NotificationJobData>): NotificationJobData {
  return {
    userId: "user-1",
    taskId: "task-1",
    notificationId: "notif-1",
    channel: "push",
    messageType: "task_reminder",
    templateVars: { task_title: "Buy groceries", due_time: "in 15 min" },
    priority: 5,
    attemptNumber: 1,
    ...overrides,
  };
}

// ── Tests ────────────────────────────────────────────────────────────

describe("Workers - processNotificationJob", () => {
  let ports: ReturnType<typeof createMockPorts>;

  beforeEach(() => {
    ports = createMockPorts();
  });

  it("successfully sends a notification via adapter", async () => {
    const data = createSampleJobData();
    const job = createMockJob(data);

    const result = await processNotificationJob(job, ports);

    expect(result.success).toBe(true);
    expect(result.providerMessageId).toBe("msg_123");
  });

  it("creates a delivery attempt record before processing", async () => {
    const data = createSampleJobData();
    const job = createMockJob(data);

    await processNotificationJob(job, ports);

    expect(ports.delivery.insertDeliveryAttempt).toHaveBeenCalledWith(
      expect.objectContaining({
        notificationId: "notif-1",
        channel: "push",
        provider: "fcm",
        status: "queued",
      }),
    );
  });

  it("updates delivery attempt to sent on success", async () => {
    const data = createSampleJobData();
    const job = createMockJob(data);

    await processNotificationJob(job, ports);

    expect(ports.delivery.updateDeliveryAttempt).toHaveBeenCalledWith(
      "attempt-1",
      expect.objectContaining({
        status: "sent",
        providerMessageId: "msg_123",
      }),
    );
  });

  it("renders the message template before sending", async () => {
    const data = createSampleJobData({
      channel: "email",
      templateVars: { task_title: "Test task", due_time: "in 5 min" },
    });
    const job = createMockJob(data);

    // The adapter should be called — verify the adapter's send was invoked
    const mockAdapter = {
      channelType: "email",
      send: vi.fn().mockResolvedValue({
        success: true,
        providerMessageId: "email_msg_1",
      }),
      validateConnection: vi.fn(),
      disconnect: vi.fn(),
    };
    (ports.adapters.getAdapter as ReturnType<typeof vi.fn>).mockReturnValue(mockAdapter);

    await processNotificationJob(job, ports);

    // send was called with rendered message containing interpolated text
    expect(mockAdapter.send).toHaveBeenCalledWith(
      "fcm-token-abc",
      expect.objectContaining({
        text: expect.stringContaining("Test task"),
      }),
    );
  });

  it("suppresses notification during quiet hours", async () => {
    const data = createSampleJobData({ priority: 5 }); // medium priority
    const job = createMockJob(data);

    (ports.quietHours.isQuietHoursActive as ReturnType<typeof vi.fn>).mockReturnValue(true);

    const result = await processNotificationJob(job, ports);

    expect(result.success).toBe(false);
    expect(result.errorType).toBe("quiet_hours");
    expect(ports.delivery.updateDeliveryAttempt).toHaveBeenCalledWith(
      "attempt-1",
      expect.objectContaining({
        status: "pending",
        errorType: "quiet_hours",
      }),
    );
  });

  it("fails when channel is not configured for user", async () => {
    const data = createSampleJobData({ channel: "telegram" });
    const job = createMockJob(data);

    (ports.channels.findChannel as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    const result = await processNotificationJob(job, ports);

    expect(result.success).toBe(false);
    expect(result.errorType).toBe("channel_not_configured");
  });

  it("fails when channel is disabled", async () => {
    const data = createSampleJobData({ channel: "telegram" });
    const job = createMockJob(data);

    (ports.channels.findChannel as ReturnType<typeof vi.fn>).mockResolvedValue({
      channelIdentifier: "tg-123",
      isEnabled: false,
    });

    const result = await processNotificationJob(job, ports);

    expect(result.success).toBe(false);
    expect(result.errorType).toBe("channel_not_configured");
  });

  it("fails when no adapter is registered for channel", async () => {
    const data = createSampleJobData({ channel: "instagram" });
    const job = createMockJob(data);

    (ports.adapters.getAdapter as ReturnType<typeof vi.fn>).mockReturnValue(null);

    const result = await processNotificationJob(job, ports);

    expect(result.success).toBe(false);
    expect(result.errorType).toBe("adapter_not_found");
  });

  it("throws on adapter send failure to trigger BullMQ retry", async () => {
    const data = createSampleJobData();
    const job = createMockJob(data);

    const failingAdapter = {
      channelType: "push",
      send: vi.fn().mockResolvedValue({
        success: false,
        errorType: "network_error",
        errorMessage: "Connection timeout",
      }),
      validateConnection: vi.fn(),
      disconnect: vi.fn(),
    };
    (ports.adapters.getAdapter as ReturnType<typeof vi.fn>).mockReturnValue(failingAdapter);

    await expect(processNotificationJob(job, ports)).rejects.toThrow(
      "Send failed: network_error: Connection timeout",
    );
  });

  it("records delivery latency on success", async () => {
    const data = createSampleJobData();
    const job = createMockJob(data);

    await processNotificationJob(job, ports);

    expect(ports.delivery.updateDeliveryAttempt).toHaveBeenCalledWith(
      "attempt-1",
      expect.objectContaining({
        deliveryLatencyMs: expect.any(Number),
      }),
    );
  });

  it("escalates to next channel when all retries exhausted", async () => {
    const data = createSampleJobData({ channel: "push" });
    // attemptsMade >= maxAttempts - 1 means final attempt (push has 3 attempts)
    const job = createMockJob(data, { attemptsMade: 2 });

    const failingAdapter = {
      channelType: "push",
      send: vi.fn().mockResolvedValue({
        success: false,
        errorType: "network_error",
        errorMessage: "FCM unavailable",
      }),
      validateConnection: vi.fn(),
      disconnect: vi.fn(),
    };
    (ports.adapters.getAdapter as ReturnType<typeof vi.fn>).mockReturnValue(failingAdapter);

    await expect(processNotificationJob(job, ports)).rejects.toThrow();

    // Escalation should be called with next channel "email" from the fallback chain
    expect(ports.escalation.enqueueEscalation).toHaveBeenCalledWith(
      data,
      "email",
      30_000,
    );
  });

  it("does not escalate when not the final retry attempt", async () => {
    const data = createSampleJobData({ channel: "push" });
    const job = createMockJob(data, { attemptsMade: 0 }); // First attempt

    const failingAdapter = {
      channelType: "push",
      send: vi.fn().mockResolvedValue({
        success: false,
        errorType: "rate_limit",
        errorMessage: "Too many requests",
      }),
      validateConnection: vi.fn(),
      disconnect: vi.fn(),
    };
    (ports.adapters.getAdapter as ReturnType<typeof vi.fn>).mockReturnValue(failingAdapter);

    await expect(processNotificationJob(job, ports)).rejects.toThrow();

    expect(ports.escalation.enqueueEscalation).not.toHaveBeenCalled();
  });

  it("uses correct provider for each channel", async () => {
    const channels = [
      { channel: "push", provider: "fcm" },
      { channel: "telegram", provider: "telegram-bot-api" },
      { channel: "email", provider: "sendgrid" },
      { channel: "whatsapp", provider: "gupshup" },
      { channel: "sms", provider: "msg91" },
    ];

    for (const { channel, provider } of channels) {
      const freshPorts = createMockPorts();
      const data = createSampleJobData({ channel });
      const job = createMockJob(data);

      await processNotificationJob(job, freshPorts);

      expect(freshPorts.delivery.insertDeliveryAttempt).toHaveBeenCalledWith(
        expect.objectContaining({ provider }),
      );
    }
  });

  it("handles missing preferences gracefully (no quiet hours check)", async () => {
    const data = createSampleJobData();
    const job = createMockJob(data);

    (ports.preferences.getPreferences as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    const result = await processNotificationJob(job, ports);

    expect(result.success).toBe(true);
    expect(ports.quietHours.isQuietHoursActive).not.toHaveBeenCalled();
  });

  it("does not escalate when no fallback chain configured", async () => {
    const data = createSampleJobData({ channel: "push" });
    const job = createMockJob(data, { attemptsMade: 2 });

    (ports.preferences.getPreferences as ReturnType<typeof vi.fn>).mockResolvedValue({
      quietStart: null,
      quietEnd: null,
      timezone: "UTC",
      fallbackChain: null,
    });

    const failingAdapter = {
      channelType: "push",
      send: vi.fn().mockResolvedValue({
        success: false,
        errorType: "error",
        errorMessage: "Failed",
      }),
      validateConnection: vi.fn(),
      disconnect: vi.fn(),
    };
    (ports.adapters.getAdapter as ReturnType<typeof vi.fn>).mockReturnValue(failingAdapter);

    await expect(processNotificationJob(job, ports)).rejects.toThrow();

    expect(ports.escalation.enqueueEscalation).not.toHaveBeenCalled();
  });

  it("does not escalate when current channel is last in chain", async () => {
    const data = createSampleJobData({ channel: "sms" });
    const job = createMockJob(data, { attemptsMade: 1 }); // sms has 2 max attempts

    (ports.preferences.getPreferences as ReturnType<typeof vi.fn>).mockResolvedValue({
      quietStart: null,
      quietEnd: null,
      timezone: "UTC",
      fallbackChain: JSON.stringify(["push", "email", "sms"]),
    });

    const failingAdapter = {
      channelType: "sms",
      send: vi.fn().mockResolvedValue({
        success: false,
        errorType: "error",
        errorMessage: "SMS gateway down",
      }),
      validateConnection: vi.fn(),
      disconnect: vi.fn(),
    };
    (ports.adapters.getAdapter as ReturnType<typeof vi.fn>).mockReturnValue(failingAdapter);

    await expect(processNotificationJob(job, ports)).rejects.toThrow();

    // sms is last in chain, so no escalation
    expect(ports.escalation.enqueueEscalation).not.toHaveBeenCalled();
  });
});
