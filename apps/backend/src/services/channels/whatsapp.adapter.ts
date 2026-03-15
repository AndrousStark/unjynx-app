import type {
  ChannelAdapter,
  ChannelSendResult,
  RenderedMessage,
} from "./channel-adapter.interface.js";

// ── WhatsApp (Gupshup BSP) Adapter ─────────────────────────────────
// Sends template messages via Gupshup HTTP API (cheapest for India).
// When GUPSHUP_API_KEY is not set, runs in mock mode.

const GUPSHUP_SEND_URL = "https://api.gupshup.io/wa/api/v1/msg";

function isMockMode(): boolean {
  return !process.env.GUPSHUP_API_KEY;
}

function isValidE164Phone(phone: string): boolean {
  // E.164: starts with +, followed by 10-15 digits
  return /^\+\d{10,15}$/.test(phone);
}

async function send(
  recipient: string,
  message: RenderedMessage,
): Promise<ChannelSendResult> {
  if (isMockMode()) {
    console.log(`[whatsapp:mock] -> ${recipient}: ${message.text}`);
    return {
      success: true,
      providerMessageId: `mock_wa_${Date.now()}`,
      costAmount: "0.00",
      costCurrency: "INR",
    };
  }

  try {
    const appName = process.env.GUPSHUP_APP_NAME ?? "";

    const params = new URLSearchParams({
      channel: "whatsapp",
      source: appName,
      destination: recipient.replace("+", ""),
      "src.name": appName,
      message: JSON.stringify({
        type: "text",
        text: message.text,
      }),
    });

    const response = await fetch(GUPSHUP_SEND_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        apikey: process.env.GUPSHUP_API_KEY ?? "",
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const error = await response.text();
      return {
        success: false,
        errorType: "gupshup_error",
        errorMessage: `Gupshup returned ${response.status}: ${error}`,
      };
    }

    const result = (await response.json()) as { messageId?: string };
    return {
      success: true,
      providerMessageId: result.messageId,
      costAmount: "0.47",
      costCurrency: "INR",
    };
  } catch (error) {
    return {
      success: false,
      errorType: "network_error",
      errorMessage:
        error instanceof Error ? error.message : "Unknown WhatsApp error",
    };
  }
}

async function validateConnection(identifier: string): Promise<boolean> {
  return isValidE164Phone(identifier);
}

async function disconnect(_identifier: string): Promise<void> {
  // WhatsApp connections are managed via opt-in — nothing to clean up
}

export function createWhatsAppAdapter(): ChannelAdapter {
  return {
    channelType: "whatsapp",
    send,
    validateConnection,
    disconnect,
  };
}
