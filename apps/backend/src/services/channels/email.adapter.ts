import type {
  ChannelAdapter,
  ChannelSendResult,
  RenderedMessage,
} from "./channel-adapter.interface.js";

// ── Email (SendGrid) Adapter ─────────────────────────────────────────
// Sends transactional email via SendGrid v3 API.
// When SENDGRID_API_KEY is not set, runs in mock mode.

const SENDGRID_SEND_URL = "https://api.sendgrid.com/v3/mail/send";
const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL ?? "noreply@unjynx.app";
const FROM_NAME = process.env.SENDGRID_FROM_NAME ?? "UNJYNX";

function isMockMode(): boolean {
  return !process.env.SENDGRID_API_KEY;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email) && email.length <= 254;
}

async function send(
  email: string,
  message: RenderedMessage,
): Promise<ChannelSendResult> {
  if (isMockMode()) {
    console.log(`[email:mock] -> ${email}: ${message.subject ?? "(no subject)"} | ${message.text}`);
    return {
      success: true,
      providerMessageId: `mock_email_${Date.now()}`,
    };
  }

  try {
    const body = {
      personalizations: [{ to: [{ email }] }],
      from: { email: FROM_EMAIL, name: FROM_NAME },
      subject: message.subject ?? "UNJYNX Notification",
      content: [
        { type: "text/plain", value: message.text },
        ...(message.html
          ? [{ type: "text/html", value: message.html }]
          : []),
      ],
      headers: {
        "List-Unsubscribe": `<mailto:unsubscribe@unjynx.app?subject=unsubscribe>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
    };

    const response = await fetch(SENDGRID_SEND_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      return {
        success: false,
        errorType: "sendgrid_error",
        errorMessage: `SendGrid returned ${response.status}: ${error}`,
      };
    }

    // SendGrid returns the message ID in the X-Message-Id header
    const messageId = response.headers.get("X-Message-Id") ?? undefined;
    return {
      success: true,
      providerMessageId: messageId,
    };
  } catch (error) {
    return {
      success: false,
      errorType: "network_error",
      errorMessage:
        error instanceof Error ? error.message : "Unknown email error",
    };
  }
}

async function validateConnection(identifier: string): Promise<boolean> {
  return isValidEmail(identifier);
}

async function disconnect(_identifier: string): Promise<void> {
  // No server-side teardown needed for email
}

export function createEmailAdapter(): ChannelAdapter {
  return {
    channelType: "email",
    send,
    validateConnection,
    disconnect,
  };
}
