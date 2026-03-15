import type {
  ChannelAdapter,
  ChannelSendResult,
  RenderedMessage,
} from "./channel-adapter.interface.js";

// ── Slack Web API Adapter ───────────────────────────────────────────
// Sends messages via Slack's chat.postMessage API.
// When SLACK_BOT_TOKEN is not set, runs in mock mode.

const SLACK_POST_URL = "https://slack.com/api/chat.postMessage";

function isMockMode(): boolean {
  return !process.env.SLACK_BOT_TOKEN;
}

function isValidSlackUserId(userId: string): boolean {
  // Slack user IDs start with U or W, followed by 8+ alphanumeric chars
  return /^[UW][A-Z0-9]{8,}$/.test(userId);
}

async function send(
  recipient: string,
  message: RenderedMessage,
): Promise<ChannelSendResult> {
  if (isMockMode()) {
    console.log(`[slack:mock] -> ${recipient}: ${message.text}`);
    return {
      success: true,
      providerMessageId: `mock_slack_${Date.now()}`,
    };
  }

  try {
    const body: Record<string, unknown> = {
      channel: recipient,
      text: message.text,
    };

    if (message.blocks && message.blocks.length > 0) {
      body.blocks = message.blocks;
    }

    const response = await fetch(SLACK_POST_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        Authorization: `Bearer ${process.env.SLACK_BOT_TOKEN}`,
      },
      body: JSON.stringify(body),
    });

    const result = (await response.json()) as {
      ok: boolean;
      ts?: string;
      error?: string;
    };

    if (!result.ok) {
      return {
        success: false,
        errorType: "slack_api_error",
        errorMessage: result.error ?? "Slack API error",
      };
    }

    return {
      success: true,
      providerMessageId: result.ts,
    };
  } catch (error) {
    return {
      success: false,
      errorType: "network_error",
      errorMessage:
        error instanceof Error ? error.message : "Unknown Slack error",
    };
  }
}

async function validateConnection(identifier: string): Promise<boolean> {
  return isValidSlackUserId(identifier);
}

async function disconnect(_identifier: string): Promise<void> {
  // Slack connections are managed via OAuth — nothing to clean up per user
}

export function createSlackAdapter(): ChannelAdapter {
  return {
    channelType: "slack",
    send,
    validateConnection,
    disconnect,
  };
}
