import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import type { RenderedMessage } from "../channel-adapter.interface.js";

// ── Reset registry between tests ─────────────────────────────────────

describe("Channel Adapters", () => {
  beforeEach(() => {
    // Clear env vars to ensure mock mode
    delete process.env.FCM_SERVICE_ACCOUNT_KEY;
    delete process.env.TELEGRAM_BOT_TOKEN;
    delete process.env.SENDGRID_API_KEY;
    delete process.env.GUPSHUP_API_KEY;
    delete process.env.MSG91_AUTH_KEY;
    delete process.env.INSTAGRAM_ACCESS_TOKEN;
    delete process.env.SLACK_BOT_TOKEN;
    delete process.env.DISCORD_BOT_TOKEN;
  });

  const sampleMessage: RenderedMessage = {
    text: "Test notification",
    subject: "Test Subject",
    markdown: "*Test notification*",
    buttons: [
      { label: "Complete", action: "complete_task", data: "task-123" },
    ],
  };

  // ── Push Adapter ─────────────────────────────────────────────────────

  describe("Push Adapter", () => {
    it("returns success in mock mode", async () => {
      const { createPushAdapter } = await import("../push.adapter.js");
      const adapter = createPushAdapter();

      const result = await adapter.send("fake-fcm-token-abc123", sampleMessage);

      expect(result.success).toBe(true);
      expect(result.providerMessageId).toMatch(/^mock_push_/);
    });

    it("has channelType 'push'", async () => {
      const { createPushAdapter } = await import("../push.adapter.js");
      const adapter = createPushAdapter();

      expect(adapter.channelType).toBe("push");
    });

    it("validates FCM token format", async () => {
      const { createPushAdapter } = await import("../push.adapter.js");
      const adapter = createPushAdapter();

      // Valid token (long enough, alphanumeric with allowed chars)
      expect(await adapter.validateConnection("a".repeat(64))).toBe(true);

      // Too short
      expect(await adapter.validateConnection("short")).toBe(false);

      // Contains invalid characters
      expect(await adapter.validateConnection("a ".repeat(40))).toBe(false);
    });

    it("disconnect is a no-op", async () => {
      const { createPushAdapter } = await import("../push.adapter.js");
      const adapter = createPushAdapter();

      // Should not throw
      await adapter.disconnect("any-token");
    });
  });

  // ── Telegram Adapter ─────────────────────────────────────────────────

  describe("Telegram Adapter", () => {
    it("returns success in mock mode", async () => {
      const { createTelegramAdapter } = await import("../telegram.adapter.js");
      const adapter = createTelegramAdapter();

      const result = await adapter.send("12345678", sampleMessage);

      expect(result.success).toBe(true);
      expect(result.providerMessageId).toMatch(/^mock_tg_/);
    });

    it("has channelType 'telegram'", async () => {
      const { createTelegramAdapter } = await import("../telegram.adapter.js");
      const adapter = createTelegramAdapter();

      expect(adapter.channelType).toBe("telegram");
    });

    it("validates numeric chat IDs", async () => {
      const { createTelegramAdapter } = await import("../telegram.adapter.js");
      const adapter = createTelegramAdapter();

      // Positive user ID
      expect(await adapter.validateConnection("12345678")).toBe(true);

      // Negative group ID
      expect(await adapter.validateConnection("-100123456789")).toBe(true);

      // Not numeric
      expect(await adapter.validateConnection("abc")).toBe(false);
      expect(await adapter.validateConnection("")).toBe(false);
    });

    it("disconnect sends goodbye in mock mode without error", async () => {
      const { createTelegramAdapter } = await import("../telegram.adapter.js");
      const adapter = createTelegramAdapter();

      // Should not throw
      await adapter.disconnect("12345678");
    });
  });

  // ── Email Adapter ────────────────────────────────────────────────────

  describe("Email Adapter", () => {
    it("returns success in mock mode", async () => {
      const { createEmailAdapter } = await import("../email.adapter.js");
      const adapter = createEmailAdapter();

      const result = await adapter.send("test@example.com", sampleMessage);

      expect(result.success).toBe(true);
      expect(result.providerMessageId).toMatch(/^mock_email_/);
    });

    it("has channelType 'email'", async () => {
      const { createEmailAdapter } = await import("../email.adapter.js");
      const adapter = createEmailAdapter();

      expect(adapter.channelType).toBe("email");
    });

    it("validates email format", async () => {
      const { createEmailAdapter } = await import("../email.adapter.js");
      const adapter = createEmailAdapter();

      expect(await adapter.validateConnection("user@example.com")).toBe(true);
      expect(await adapter.validateConnection("a.b+c@domain.co.in")).toBe(true);

      // Invalid emails
      expect(await adapter.validateConnection("not-an-email")).toBe(false);
      expect(await adapter.validateConnection("@domain.com")).toBe(false);
      expect(await adapter.validateConnection("")).toBe(false);
    });

    it("disconnect is a no-op", async () => {
      const { createEmailAdapter } = await import("../email.adapter.js");
      const adapter = createEmailAdapter();

      await adapter.disconnect("test@example.com");
    });
  });

  // ── WhatsApp Adapter ──────────────────────────────────────────────────

  describe("WhatsApp Adapter", () => {
    it("returns success in mock mode", async () => {
      const { createWhatsAppAdapter } = await import("../whatsapp.adapter.js");
      const adapter = createWhatsAppAdapter();

      const result = await adapter.send("+919876543210", sampleMessage);

      expect(result.success).toBe(true);
      expect(result.providerMessageId).toMatch(/^mock_wa_/);
      expect(result.costAmount).toBe("0.00");
      expect(result.costCurrency).toBe("INR");
    });

    it("has channelType 'whatsapp'", async () => {
      const { createWhatsAppAdapter } = await import("../whatsapp.adapter.js");
      const adapter = createWhatsAppAdapter();

      expect(adapter.channelType).toBe("whatsapp");
    });

    it("validates E.164 phone number format", async () => {
      const { createWhatsAppAdapter } = await import("../whatsapp.adapter.js");
      const adapter = createWhatsAppAdapter();

      // Valid E.164
      expect(await adapter.validateConnection("+919876543210")).toBe(true);
      expect(await adapter.validateConnection("+14155552671")).toBe(true);

      // Missing +
      expect(await adapter.validateConnection("919876543210")).toBe(false);

      // Too short
      expect(await adapter.validateConnection("+123")).toBe(false);

      // Non-numeric after +
      expect(await adapter.validateConnection("+91abc")).toBe(false);
      expect(await adapter.validateConnection("")).toBe(false);
    });

    it("disconnect does not throw", async () => {
      const { createWhatsAppAdapter } = await import("../whatsapp.adapter.js");
      const adapter = createWhatsAppAdapter();

      await adapter.disconnect("+919876543210");
    });
  });

  // ── SMS Adapter ────────────────────────────────────────────────────────

  describe("SMS Adapter", () => {
    it("returns success in mock mode", async () => {
      const { createSmsAdapter } = await import("../sms.adapter.js");
      const adapter = createSmsAdapter();

      const result = await adapter.send("+919876543210", sampleMessage);

      expect(result.success).toBe(true);
      expect(result.providerMessageId).toMatch(/^mock_sms_/);
      expect(result.costAmount).toBe("0.00");
      expect(result.costCurrency).toBe("INR");
    });

    it("has channelType 'sms'", async () => {
      const { createSmsAdapter } = await import("../sms.adapter.js");
      const adapter = createSmsAdapter();

      expect(adapter.channelType).toBe("sms");
    });

    it("validates E.164 phone number format", async () => {
      const { createSmsAdapter } = await import("../sms.adapter.js");
      const adapter = createSmsAdapter();

      // Valid E.164
      expect(await adapter.validateConnection("+919876543210")).toBe(true);
      expect(await adapter.validateConnection("+14155552671")).toBe(true);

      // Missing +
      expect(await adapter.validateConnection("919876543210")).toBe(false);

      // Too short
      expect(await adapter.validateConnection("+123")).toBe(false);

      // Non-numeric
      expect(await adapter.validateConnection("+91phone")).toBe(false);
      expect(await adapter.validateConnection("")).toBe(false);
    });

    it("disconnect does not throw", async () => {
      const { createSmsAdapter } = await import("../sms.adapter.js");
      const adapter = createSmsAdapter();

      await adapter.disconnect("+919876543210");
    });
  });

  // ── Instagram Adapter ──────────────────────────────────────────────────

  describe("Instagram Adapter", () => {
    it("returns success in mock mode", async () => {
      const { createInstagramAdapter } = await import("../instagram.adapter.js");
      const adapter = createInstagramAdapter();

      const result = await adapter.send("test_user.ig", sampleMessage);

      expect(result.success).toBe(true);
      expect(result.providerMessageId).toMatch(/^mock_ig_/);
    });

    it("has channelType 'instagram'", async () => {
      const { createInstagramAdapter } = await import("../instagram.adapter.js");
      const adapter = createInstagramAdapter();

      expect(adapter.channelType).toBe("instagram");
    });

    it("validates Instagram username format", async () => {
      const { createInstagramAdapter } = await import("../instagram.adapter.js");
      const adapter = createInstagramAdapter();

      // Valid usernames
      expect(await adapter.validateConnection("john_doe")).toBe(true);
      expect(await adapter.validateConnection("user.name123")).toBe(true);
      expect(await adapter.validateConnection("a")).toBe(true);

      // Invalid: too long (31 chars)
      expect(await adapter.validateConnection("a".repeat(31))).toBe(false);

      // Invalid: special characters
      expect(await adapter.validateConnection("user@name")).toBe(false);
      expect(await adapter.validateConnection("user name")).toBe(false);
      expect(await adapter.validateConnection("")).toBe(false);
    });

    it("disconnect does not throw", async () => {
      const { createInstagramAdapter } = await import("../instagram.adapter.js");
      const adapter = createInstagramAdapter();

      await adapter.disconnect("test_user.ig");
    });
  });

  // ── Slack Adapter ──────────────────────────────────────────────────────

  describe("Slack Adapter", () => {
    it("returns success in mock mode", async () => {
      const { createSlackAdapter } = await import("../slack.adapter.js");
      const adapter = createSlackAdapter();

      const result = await adapter.send("U0123456789", sampleMessage);

      expect(result.success).toBe(true);
      expect(result.providerMessageId).toMatch(/^mock_slack_/);
    });

    it("has channelType 'slack'", async () => {
      const { createSlackAdapter } = await import("../slack.adapter.js");
      const adapter = createSlackAdapter();

      expect(adapter.channelType).toBe("slack");
    });

    it("validates Slack user ID format", async () => {
      const { createSlackAdapter } = await import("../slack.adapter.js");
      const adapter = createSlackAdapter();

      // Valid Slack user IDs
      expect(await adapter.validateConnection("U0123456789")).toBe(true);
      expect(await adapter.validateConnection("W0123456789")).toBe(true);
      expect(await adapter.validateConnection("UABCDEF123")).toBe(true);

      // Invalid: too short
      expect(await adapter.validateConnection("U1234")).toBe(false);

      // Invalid: wrong prefix
      expect(await adapter.validateConnection("B0123456789")).toBe(false);

      // Invalid: lowercase
      expect(await adapter.validateConnection("u0123456789")).toBe(false);
      expect(await adapter.validateConnection("")).toBe(false);
    });

    it("disconnect does not throw", async () => {
      const { createSlackAdapter } = await import("../slack.adapter.js");
      const adapter = createSlackAdapter();

      await adapter.disconnect("U0123456789");
    });
  });

  // ── Discord Adapter ────────────────────────────────────────────────────

  describe("Discord Adapter", () => {
    it("returns success in mock mode", async () => {
      const { createDiscordAdapter } = await import("../discord.adapter.js");
      const adapter = createDiscordAdapter();

      const result = await adapter.send("12345678901234567", sampleMessage);

      expect(result.success).toBe(true);
      expect(result.providerMessageId).toMatch(/^mock_discord_/);
    });

    it("has channelType 'discord'", async () => {
      const { createDiscordAdapter } = await import("../discord.adapter.js");
      const adapter = createDiscordAdapter();

      expect(adapter.channelType).toBe("discord");
    });

    it("validates Discord snowflake ID format", async () => {
      const { createDiscordAdapter } = await import("../discord.adapter.js");
      const adapter = createDiscordAdapter();

      // Valid snowflake IDs (17-20 digits)
      expect(await adapter.validateConnection("12345678901234567")).toBe(true);
      expect(await adapter.validateConnection("12345678901234567890")).toBe(true);

      // Too short (16 digits)
      expect(await adapter.validateConnection("1234567890123456")).toBe(false);

      // Too long (21 digits)
      expect(await adapter.validateConnection("123456789012345678901")).toBe(false);

      // Non-numeric
      expect(await adapter.validateConnection("abc12345678901234")).toBe(false);
      expect(await adapter.validateConnection("")).toBe(false);
    });

    it("disconnect does not throw", async () => {
      const { createDiscordAdapter } = await import("../discord.adapter.js");
      const adapter = createDiscordAdapter();

      await adapter.disconnect("12345678901234567");
    });
  });

  // ── Adapter Registry ─────────────────────────────────────────────────

  describe("Adapter Registry", () => {
    afterEach(async () => {
      const { resetRegistry } = await import("../adapter-registry.js");
      resetRegistry();
    });

    it("returns push adapter", async () => {
      const { getAdapter } = await import("../adapter-registry.js");

      const adapter = getAdapter("push");
      expect(adapter).not.toBeNull();
      expect(adapter?.channelType).toBe("push");
    });

    it("returns telegram adapter", async () => {
      const { getAdapter } = await import("../adapter-registry.js");

      const adapter = getAdapter("telegram");
      expect(adapter).not.toBeNull();
      expect(adapter?.channelType).toBe("telegram");
    });

    it("returns email adapter", async () => {
      const { getAdapter } = await import("../adapter-registry.js");

      const adapter = getAdapter("email");
      expect(adapter).not.toBeNull();
      expect(adapter?.channelType).toBe("email");
    });

    it("returns whatsapp adapter", async () => {
      const { getAdapter } = await import("../adapter-registry.js");

      const adapter = getAdapter("whatsapp");
      expect(adapter).not.toBeNull();
      expect(adapter?.channelType).toBe("whatsapp");
    });

    it("returns sms adapter", async () => {
      const { getAdapter } = await import("../adapter-registry.js");

      const adapter = getAdapter("sms");
      expect(adapter).not.toBeNull();
      expect(adapter?.channelType).toBe("sms");
    });

    it("returns instagram adapter", async () => {
      const { getAdapter } = await import("../adapter-registry.js");

      const adapter = getAdapter("instagram");
      expect(adapter).not.toBeNull();
      expect(adapter?.channelType).toBe("instagram");
    });

    it("returns slack adapter", async () => {
      const { getAdapter } = await import("../adapter-registry.js");

      const adapter = getAdapter("slack");
      expect(adapter).not.toBeNull();
      expect(adapter?.channelType).toBe("slack");
    });

    it("returns discord adapter", async () => {
      const { getAdapter } = await import("../adapter-registry.js");

      const adapter = getAdapter("discord");
      expect(adapter).not.toBeNull();
      expect(adapter?.channelType).toBe("discord");
    });

    it("returns null for unknown channel type", async () => {
      const { getAdapter } = await import("../adapter-registry.js");

      const adapter = getAdapter("carrier_pigeon");
      expect(adapter).toBeNull();
    });

    it("allows manual registration", async () => {
      const { registerAdapter, getAdapter, resetRegistry } = await import(
        "../adapter-registry.js"
      );
      resetRegistry();

      const mockAdapter = {
        channelType: "smoke_signal",
        send: vi.fn(),
        validateConnection: vi.fn(),
        disconnect: vi.fn(),
      };

      registerAdapter(mockAdapter);
      expect(getAdapter("smoke_signal")).toBe(mockAdapter);
    });
  });

  // ── Template Rendering ───────────────────────────────────────────────

  describe("Template Rendering", () => {
    it("renders task_reminder for push channel", async () => {
      const { renderTemplate } = await import(
        "../../templates/template-engine.js"
      );

      const result = renderTemplate("push", "task_reminder", {
        user_name: "Alice",
        task_title: "Buy groceries",
        due_time: "in 30 minutes",
      });

      expect(result.text).toContain("Alice");
      expect(result.text).toContain("Buy groceries");
      expect(result.text).toContain("in 30 minutes");
    });

    it("renders task_reminder for telegram with markdown", async () => {
      const { renderTemplate } = await import(
        "../../templates/template-engine.js"
      );

      const result = renderTemplate("telegram", "task_reminder", {
        user_name: "Bob",
        task_title: "Deploy app",
        due_time: "tonight",
      });

      expect(result.text).toContain("Bob");
      expect(result.markdown).toBeDefined();
      expect(result.markdown).toContain("Bob");
    });

    it("renders task_reminder for email with HTML and subject", async () => {
      const { renderTemplate } = await import(
        "../../templates/template-engine.js"
      );

      const result = renderTemplate("email", "task_reminder", {
        user_name: "Carol",
        task_title: "Write report",
        due_time: "tomorrow",
      });

      expect(result.subject).toContain("Write report");
      expect(result.html).toBeDefined();
      expect(result.html).toContain("Carol");
      expect(result.html).toContain("UNJYNX");
    });

    it("renders daily_content for telegram", async () => {
      const { renderTemplate } = await import(
        "../../templates/template-engine.js"
      );

      const result = renderTemplate("telegram", "daily_content", {
        content_quote: "The only way to do great work is to love what you do.",
        content_author: "Steve Jobs",
      });

      expect(result.text).toContain("Steve Jobs");
      expect(result.markdown).toContain("Steve Jobs");
    });

    it("renders streak_nudge with count", async () => {
      const { renderTemplate } = await import(
        "../../templates/template-engine.js"
      );

      const result = renderTemplate("push", "streak_nudge", {
        streak_count: "7",
      });

      expect(result.text).toContain("7-day streak");
    });

    it("renders overdue_alert", async () => {
      const { renderTemplate } = await import(
        "../../templates/template-engine.js"
      );

      const result = renderTemplate("push", "overdue_alert", {
        task_title: "Submit tax return",
      });

      expect(result.text).toContain("Submit tax return");
      expect(result.text).toContain("overdue");
    });

    it("renders sms within 160 chars", async () => {
      const { renderTemplate } = await import(
        "../../templates/template-engine.js"
      );

      const result = renderTemplate("sms", "task_reminder", {
        user_name: "Dev",
        task_title: "Code review",
        due_time: "now",
      });

      expect(result.text.length).toBeLessThanOrEqual(160);
    });

    it("renders slack blocks for task_reminder", async () => {
      const { renderTemplate } = await import(
        "../../templates/template-engine.js"
      );

      const result = renderTemplate("slack", "task_reminder", {
        user_name: "Team",
        task_title: "Standup",
        due_time: "in 5 min",
      });

      expect(result.blocks).toBeDefined();
      expect(Array.isArray(result.blocks)).toBe(true);
    });

    it("renders discord embed for task_reminder", async () => {
      const { renderTemplate } = await import(
        "../../templates/template-engine.js"
      );

      const result = renderTemplate("discord", "task_reminder", {
        user_name: "Gamer",
        task_title: "Guild raid",
        due_time: "tonight",
      });

      expect(result.embed).toBeDefined();
    });

    it("falls back to push template for unknown channel", async () => {
      const { renderTemplate } = await import(
        "../../templates/template-engine.js"
      );

      const result = renderTemplate("carrier_pigeon", "task_reminder", {
        user_name: "Nobody",
        task_title: "Impossible",
        due_time: "never",
      });

      expect(result.text).toContain("Nobody");
    });

    it("returns error message for unknown message type", async () => {
      const { renderTemplate } = await import(
        "../../templates/template-engine.js"
      );

      const result = renderTemplate("push", "nonexistent_type", {});

      expect(result.text).toContain("Unknown message type");
    });

    it("preserves unresolved placeholders", async () => {
      const { renderTemplate } = await import(
        "../../templates/template-engine.js"
      );

      const result = renderTemplate("push", "task_reminder", {});

      expect(result.text).toContain("{user_name}");
      expect(result.text).toContain("{task_title}");
    });
  });
});
