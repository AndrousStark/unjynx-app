import type {
  ChannelAdapter,
  ChannelSendResult,
  RenderedMessage,
} from "./channel-adapter.interface.js";

// ── Discord Bot API Adapter ─────────────────────────────────────────
// Sends messages via Discord Bot API to a channel or DM channel.
// When DISCORD_BOT_TOKEN is not set, runs in mock mode.

const DISCORD_API_BASE = "https://discord.com/api/v10";

function isMockMode(): boolean {
  return !process.env.DISCORD_BOT_TOKEN;
}

function isValidDiscordId(id: string): boolean {
  // Discord snowflake IDs are 17-20 digit numeric strings
  return /^\d{17,20}$/.test(id);
}

function buildEmbed(message: RenderedMessage): unknown {
  return {
    title: message.subject ?? "UNJYNX Notification",
    description: message.markdown ?? message.text,
    color: 0x7c3aed, // Midnight purple brand color
  };
}

async function send(
  channelId: string,
  message: RenderedMessage,
): Promise<ChannelSendResult> {
  if (isMockMode()) {
    console.log(`[discord:mock] -> ${channelId}: ${message.text}`);
    return {
      success: true,
      providerMessageId: `mock_discord_${Date.now()}`,
    };
  }

  try {
    const url = `${DISCORD_API_BASE}/channels/${channelId}/messages`;

    const body: Record<string, unknown> = {
      content: message.text,
    };

    if (message.embed) {
      body.embeds = [message.embed];
    } else {
      body.embeds = [buildEmbed(message)];
    }

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      return {
        success: false,
        errorType: "discord_api_error",
        errorMessage: `Discord API returned ${response.status}: ${error}`,
      };
    }

    const result = (await response.json()) as { id?: string };
    return {
      success: true,
      providerMessageId: result.id,
    };
  } catch (error) {
    return {
      success: false,
      errorType: "network_error",
      errorMessage:
        error instanceof Error ? error.message : "Unknown Discord error",
    };
  }
}

async function validateConnection(identifier: string): Promise<boolean> {
  return isValidDiscordId(identifier);
}

async function disconnect(_identifier: string): Promise<void> {
  // Discord bot connections are managed server-side — nothing to clean up
}

export function createDiscordAdapter(): ChannelAdapter {
  return {
    channelType: "discord",
    send,
    validateConnection,
    disconnect,
  };
}
