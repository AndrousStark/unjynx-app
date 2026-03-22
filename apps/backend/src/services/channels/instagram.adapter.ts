import type {
  ChannelAdapter,
  ChannelSendResult,
  RenderedMessage,
} from "./channel-adapter.interface.js";
import { logger } from "../../middleware/logger.js";

// ── Instagram Messenger API Adapter ─────────────────────────────────
// Sends DMs via the Instagram Messenger API (Facebook Graph API).
// Uses "Friend First" approach: send follow request from official page,
// user accepts, then we can message within the 24h window.
// When INSTAGRAM_ACCESS_TOKEN is not set, runs in mock mode.

const log = logger.child({ channel: "instagram" });

function isMockMode(): boolean {
  return !process.env.INSTAGRAM_ACCESS_TOKEN;
}

function getGraphApiUrl(): string {
  const pageId = process.env.INSTAGRAM_PAGE_ID ?? "";
  return `https://graph.facebook.com/v21.0/${pageId}/messages`;
}

function isValidInstagramUsername(username: string): boolean {
  // Instagram usernames: 1-30 chars, alphanumeric + underscores + periods
  return /^[a-zA-Z0-9_.]{1,30}$/.test(username);
}

async function send(
  recipient: string,
  message: RenderedMessage,
): Promise<ChannelSendResult> {
  if (isMockMode()) {
    log.info({
      action: "mock_send",
      recipient,
      message: message.text.substring(0, 100),
      timestamp: new Date().toISOString(),
    }, "Would have sent Instagram DM (mock mode)");
    return {
      success: true,
      providerMessageId: `mock_ig_${Date.now()}`,
    };
  }

  try {
    const body = {
      recipient: { id: recipient },
      message: { text: message.text },
      messaging_type: "MESSAGE_TAG",
      tag: "CONFIRMED_EVENT_UPDATE",
    };

    const response = await fetch(getGraphApiUrl(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.INSTAGRAM_ACCESS_TOKEN}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      return {
        success: false,
        errorType: "instagram_api_error",
        errorMessage: `Instagram API returned ${response.status}: ${error}`,
      };
    }

    const result = (await response.json()) as { message_id?: string };
    return {
      success: true,
      providerMessageId: result.message_id,
    };
  } catch (error) {
    return {
      success: false,
      errorType: "network_error",
      errorMessage:
        error instanceof Error ? error.message : "Unknown Instagram error",
    };
  }
}

async function validateConnection(identifier: string): Promise<boolean> {
  return isValidInstagramUsername(identifier);
}

async function disconnect(_identifier: string): Promise<void> {
  // Best effort — cannot programmatically remove a friend on Instagram
}

export function createInstagramAdapter(): ChannelAdapter {
  return {
    channelType: "instagram",
    send,
    validateConnection,
    disconnect,
  };
}
