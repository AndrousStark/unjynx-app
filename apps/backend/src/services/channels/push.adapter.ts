import type {
  ChannelAdapter,
  ChannelSendResult,
  RenderedMessage,
} from "./channel-adapter.interface.js";

// ── Push (FCM) Adapter ───────────────────────────────────────────────
// In production, sends via Firebase Cloud Messaging HTTP v1 API.
// When FCM_SERVICE_ACCOUNT_KEY is not set, runs in mock mode.

const FCM_SEND_URL =
  "https://fcm.googleapis.com/v1/projects/{PROJECT_ID}/messages:send";

function isMockMode(): boolean {
  return !process.env.FCM_SERVICE_ACCOUNT_KEY;
}

function isValidFcmToken(token: string): boolean {
  // FCM tokens are typically 100-300 char base64-like strings
  return token.length >= 32 && token.length <= 4096 && /^[A-Za-z0-9_:/-]+$/.test(token);
}

async function send(
  recipient: string,
  message: RenderedMessage,
): Promise<ChannelSendResult> {
  if (isMockMode()) {
    console.log(`[push:mock] -> ${recipient}: ${message.text}`);
    return {
      success: true,
      providerMessageId: `mock_push_${Date.now()}`,
    };
  }

  try {
    const projectId = process.env.FCM_PROJECT_ID ?? "";
    const url = FCM_SEND_URL.replace("{PROJECT_ID}", projectId);

    const body = {
      message: {
        token: recipient,
        notification: {
          title: message.subject ?? "UNJYNX",
          body: message.text,
        },
        data: message.buttons
          ? { actions: JSON.stringify(message.buttons) }
          : undefined,
      },
    };

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.FCM_SERVICE_ACCOUNT_KEY}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      return {
        success: false,
        errorType: "fcm_error",
        errorMessage: `FCM returned ${response.status}: ${error}`,
      };
    }

    const result = (await response.json()) as { name?: string };
    return {
      success: true,
      providerMessageId: result.name,
    };
  } catch (error) {
    return {
      success: false,
      errorType: "network_error",
      errorMessage:
        error instanceof Error ? error.message : "Unknown push error",
    };
  }
}

async function validateConnection(identifier: string): Promise<boolean> {
  return isValidFcmToken(identifier);
}

async function disconnect(_identifier: string): Promise<void> {
  // Push tokens are managed on the client side — nothing to clean up
}

export function createPushAdapter(): ChannelAdapter {
  return {
    channelType: "push",
    send,
    validateConnection,
    disconnect,
  };
}
