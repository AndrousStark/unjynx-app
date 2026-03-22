import type {
  ChannelAdapter,
  ChannelSendResult,
  RenderedMessage,
} from "./channel-adapter.interface.js";
import { logger } from "../../middleware/logger.js";

// ── SMS (MSG91) Adapter ─────────────────────────────────────────────
// Sends transactional SMS via MSG91 API (cheapest for India).
// When MSG91_AUTH_KEY is not set, runs in mock mode.

const log = logger.child({ channel: "sms" });

const MSG91_SEND_URL = "https://control.msg91.com/api/v5/flow/";

function isMockMode(): boolean {
  return !process.env.MSG91_AUTH_KEY;
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
    log.info({
      action: "mock_send",
      recipient,
      message: message.text.substring(0, 100),
      timestamp: new Date().toISOString(),
    }, "Would have sent SMS (mock mode)");
    return {
      success: true,
      providerMessageId: `mock_sms_${Date.now()}`,
      costAmount: "0.00",
      costCurrency: "INR",
    };
  }

  try {
    const senderId = process.env.MSG91_SENDER_ID ?? "UNJYNX";

    const body = {
      sender: senderId,
      route: "4", // Transactional route
      country: "91",
      sms: [
        {
          message: message.text,
          to: [recipient.replace("+", "")],
        },
      ],
    };

    const response = await fetch(MSG91_SEND_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        authkey: process.env.MSG91_AUTH_KEY ?? "",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      return {
        success: false,
        errorType: "msg91_error",
        errorMessage: `MSG91 returned ${response.status}: ${error}`,
      };
    }

    const result = (await response.json()) as {
      type?: string;
      request_id?: string;
    };

    if (result.type === "error") {
      return {
        success: false,
        errorType: "msg91_error",
        errorMessage: "MSG91 returned error response",
      };
    }

    return {
      success: true,
      providerMessageId: result.request_id,
      costAmount: "0.20",
      costCurrency: "INR",
    };
  } catch (error) {
    return {
      success: false,
      errorType: "network_error",
      errorMessage:
        error instanceof Error ? error.message : "Unknown SMS error",
    };
  }
}

async function validateConnection(identifier: string): Promise<boolean> {
  return isValidE164Phone(identifier);
}

async function disconnect(_identifier: string): Promise<void> {
  // SMS connections are stateless — nothing to clean up
}

export function createSmsAdapter(): ChannelAdapter {
  return {
    channelType: "sms",
    send,
    validateConnection,
    disconnect,
  };
}
