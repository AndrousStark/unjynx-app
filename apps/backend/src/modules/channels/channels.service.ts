import type { NotificationChannel } from "../../db/schema/index.js";
import { getAdapter } from "../../services/channels/adapter-registry.js";
import { renderTemplate } from "../../services/templates/template-engine.js";
import type { ChannelSendResult } from "../../services/channels/channel-adapter.interface.js";
import * as channelRepo from "./channels.repository.js";

// ── Channel Service ──────────────────────────────────────────────────

export async function getChannels(
  userId: string,
): Promise<NotificationChannel[]> {
  return channelRepo.findChannelsByUser(userId);
}

export async function connectChannel(
  userId: string,
  channelType: string,
  identifier: string,
  metadata?: string,
): Promise<NotificationChannel> {
  // Check if adapter exists and can validate the identifier
  const adapter = getAdapter(channelType);

  if (adapter) {
    const isValid = await adapter.validateConnection(identifier);
    if (!isValid) {
      throw new ChannelError(
        `Invalid identifier for ${channelType}`,
        "INVALID_IDENTIFIER",
      );
    }
  }

  // Check for existing channel — upsert semantics
  const existing = await channelRepo.findChannel(userId, channelType);

  if (existing) {
    const updated = await channelRepo.updateChannel(userId, channelType, {
      channelIdentifier: identifier,
      isVerified: false,
      verifiedAt: null,
      metadata: metadata ?? null,
    });
    return updated!;
  }

  return channelRepo.createChannel({
    userId,
    channelType: channelType as "push" | "telegram" | "email" | "whatsapp" | "sms" | "instagram" | "slack" | "discord",
    channelIdentifier: identifier,
    metadata: metadata ?? null,
  });
}

export async function disconnectChannel(
  userId: string,
  channelType: string,
): Promise<boolean> {
  const channel = await channelRepo.findChannel(userId, channelType);

  if (!channel) {
    return false;
  }

  // Best-effort adapter disconnect (e.g. Telegram goodbye message)
  const adapter = getAdapter(channelType);
  if (adapter) {
    try {
      await adapter.disconnect(channel.channelIdentifier);
    } catch {
      // Swallow — disconnect is best-effort
    }
  }

  return channelRepo.deleteChannel(userId, channelType);
}

export async function testChannel(
  userId: string,
  channelType: string,
): Promise<ChannelSendResult> {
  const channel = await channelRepo.findChannel(userId, channelType);

  if (!channel) {
    throw new ChannelError(
      `Channel ${channelType} is not connected`,
      "CHANNEL_NOT_FOUND",
    );
  }

  const adapter = getAdapter(channelType);

  if (!adapter) {
    throw new ChannelError(
      `No adapter available for ${channelType}`,
      "ADAPTER_NOT_FOUND",
    );
  }

  const message = renderTemplate(channelType, "task_reminder", {
    user_name: "there",
    task_title: "Test Notification",
    due_time: "now",
  });

  return adapter.send(channel.channelIdentifier, message);
}

// ── Error class ──────────────────────────────────────────────────────

export class ChannelError extends Error {
  readonly code: string;

  constructor(message: string, code: string) {
    super(message);
    this.name = "ChannelError";
    this.code = code;
  }
}
