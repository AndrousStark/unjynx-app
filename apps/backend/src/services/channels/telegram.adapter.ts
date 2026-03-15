import type {
  ChannelAdapter,
  ChannelSendResult,
  RenderedMessage,
} from "./channel-adapter.interface.js";

// ── Telegram Bot API Adapter ─────────────────────────────────────────
// Sends messages via the Telegram Bot API (direct HTTP, no grammy).
// When TELEGRAM_BOT_TOKEN is not set, runs in mock mode.

function getBotToken(): string | undefined {
  return process.env.TELEGRAM_BOT_TOKEN;
}

function isMockMode(): boolean {
  return !getBotToken();
}

function botApiUrl(method: string): string {
  return `https://api.telegram.org/bot${getBotToken()}/${method}`;
}

function isValidChatId(chatId: string): boolean {
  // Telegram chat IDs are numeric (positive for users, negative for groups)
  return /^-?\d+$/.test(chatId);
}

function buildInlineKeyboard(
  buttons: ReadonlyArray<{
    readonly label: string;
    readonly action: string;
    readonly data: string;
  }>,
): unknown {
  return {
    inline_keyboard: [
      buttons.map((btn) => ({
        text: btn.label,
        callback_data: `${btn.action}:${btn.data}`,
      })),
    ],
  };
}

async function send(
  chatId: string,
  message: RenderedMessage,
): Promise<ChannelSendResult> {
  if (isMockMode()) {
    console.log(`[telegram:mock] -> ${chatId}: ${message.text}`);
    return {
      success: true,
      providerMessageId: `mock_tg_${Date.now()}`,
    };
  }

  try {
    const body: Record<string, unknown> = {
      chat_id: chatId,
      text: message.markdown ?? message.text,
      parse_mode: message.markdown ? "MarkdownV2" : undefined,
    };

    if (message.buttons && message.buttons.length > 0) {
      body.reply_markup = buildInlineKeyboard(message.buttons);
    }

    const response = await fetch(botApiUrl("sendMessage"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const result = (await response.json()) as {
      ok: boolean;
      result?: { message_id: number };
      description?: string;
    };

    if (!result.ok) {
      return {
        success: false,
        errorType: "telegram_api_error",
        errorMessage: result.description ?? "Telegram API error",
      };
    }

    return {
      success: true,
      providerMessageId: String(result.result?.message_id),
    };
  } catch (error) {
    return {
      success: false,
      errorType: "network_error",
      errorMessage:
        error instanceof Error ? error.message : "Unknown Telegram error",
    };
  }
}

async function validateConnection(identifier: string): Promise<boolean> {
  return isValidChatId(identifier);
}

async function disconnect(chatId: string): Promise<void> {
  if (isMockMode()) {
    console.log(`[telegram:mock] Goodbye sent to ${chatId}`);
    return;
  }

  // Best-effort goodbye message — errors are swallowed
  try {
    await fetch(botApiUrl("sendMessage"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: "You have disconnected UNJYNX notifications. You can reconnect anytime!",
      }),
    });
  } catch {
    // Swallow — disconnect is best-effort
  }
}

export function createTelegramAdapter(): ChannelAdapter {
  return {
    channelType: "telegram",
    send,
    validateConnection,
    disconnect,
  };
}
