// ── Inbound Message Handler ─────────────────────────────────────────
// Orchestrates the processing of inbound user replies from any channel.
// Resolves the user, parses the command, executes it, and sends a
// confirmation reply back through the channel adapter.

import { eq, and } from "drizzle-orm";
import { contentDb as db } from "../../db/index.js";
import { notificationChannels } from "../../db/schema/index.js";
import { getAdapter } from "../../services/channels/adapter-registry.js";
import * as taskService from "../tasks/tasks.service.js";
import * as notificationRepo from "../notifications/notifications.repository.js";
import {
  parseInboundMessage,
  getHelpText,
  type InboundCommand,
} from "./inbound-parser.js";
import { logger } from "../../middleware/logger.js";

const log = logger.child({ module: "inbound-handler" });

// ── Types ──────────────────────────────────────────────────────────

export interface InboundResult {
  readonly action: string;
  readonly success: boolean;
  readonly replyText: string | null;
}

// ── Main Handler ───────────────────────────────────────────────────

/**
 * Processes an inbound message from any channel (WhatsApp, SMS, Telegram).
 *
 * 1. Resolves the user by channel type + identifier
 * 2. Parses the command from the raw text
 * 3. Executes the command (complete task, snooze, stop, help)
 * 4. Sends a confirmation reply back via the channel adapter
 *
 * Returns the result for logging/response purposes.
 */
export async function handleInboundMessage(
  channel: string,
  identifier: string,
  text: string,
): Promise<InboundResult> {
  log.info(
    { channel, identifier: maskIdentifier(identifier), rawLength: text.length },
    "Inbound message received",
  );

  // Step 1: Resolve user
  const userId = await resolveUserByChannel(channel, identifier);

  if (!userId) {
    log.warn(
      { channel, identifier: maskIdentifier(identifier) },
      "No user found for channel identifier",
    );
    // Still send a reply so the user knows what happened
    await sendReply(
      channel,
      identifier,
      `Your ${channel} account is not linked to UNJYNX. Connect it in the app first.`,
    );
    return { action: "unlinked", success: false, replyText: null };
  }

  // Step 2: Parse command
  const parsed = parseInboundMessage(text);

  log.info(
    {
      channel,
      userId,
      command: parsed.command,
      snoozeDuration: parsed.snoozeDuration,
    },
    "Parsed inbound command",
  );

  // Step 3: Execute command
  const result = await executeCommand(userId, channel, identifier, parsed);

  // Step 4: Send reply
  if (result.replyText) {
    await sendReply(channel, identifier, result.replyText);
  }

  return result;
}

// ── Command Executor ───────────────────────────────────────────────

async function executeCommand(
  userId: string,
  channel: string,
  identifier: string,
  parsed: InboundCommand,
): Promise<InboundResult> {
  switch (parsed.command) {
    case "done":
      return executeDone(userId);

    case "snooze":
      return executeSnooze(userId, parsed.snoozeDuration ?? 15);

    case "stop":
      return executeStop(userId, channel);

    case "help":
      return {
        action: "help",
        success: true,
        replyText: getHelpText(),
      };

    case "unknown":
      return {
        action: "unknown",
        success: false,
        replyText: `I didn't understand "${parsed.rawText}". Reply HELP for available commands.`,
      };
  }
}

// ── DONE Executor ──────────────────────────────────────────────────

async function executeDone(userId: string): Promise<InboundResult> {
  const recentTask = await findMostRecentNotifiedTask(userId);

  if (!recentTask) {
    return {
      action: "done",
      success: false,
      replyText:
        "No recent task found to complete. Open the app to manage your tasks.",
    };
  }

  const task = await taskService.completeTask(userId, recentTask.taskId);

  if (!task) {
    return {
      action: "done",
      success: false,
      replyText: "Task not found or already completed.",
    };
  }

  return {
    action: "done",
    success: true,
    replyText: `Done! '${task.title}' marked as complete.`,
  };
}

// ── SNOOZE Executor ────────────────────────────────────────────────

async function executeSnooze(
  userId: string,
  minutes: number,
): Promise<InboundResult> {
  const recentTask = await findMostRecentNotifiedTask(userId);

  if (!recentTask) {
    return {
      action: "snooze",
      success: false,
      replyText: "No recent task found to snooze.",
    };
  }

  const task = await taskService.snoozeTask(
    userId,
    recentTask.taskId,
    minutes,
  );

  if (!task) {
    return {
      action: "snooze",
      success: false,
      replyText: "Task not found.",
    };
  }

  const label = formatDurationLabel(minutes);
  return {
    action: "snooze",
    success: true,
    replyText: `Snoozed '${task.title}' for ${label}.`,
  };
}

// ── STOP Executor ──────────────────────────────────────────────────

async function executeStop(
  userId: string,
  channel: string,
): Promise<InboundResult> {
  await disableUserChannel(userId, channel);

  const channelName = channel.charAt(0).toUpperCase() + channel.slice(1);
  return {
    action: "stop",
    success: true,
    replyText: `${channelName} notifications disabled. You can re-enable them in the UNJYNX app.`,
  };
}

// ── Helpers ────────────────────────────────────────────────────────

async function resolveUserByChannel(
  channelType: string,
  identifier: string,
): Promise<string | null> {
  const [channel] = await db
    .select()
    .from(notificationChannels)
    .where(
      and(
        eq(
          notificationChannels.channelType,
          channelType as typeof notificationChannels.channelType.enumValues[number],
        ),
        eq(notificationChannels.channelIdentifier, identifier),
        eq(notificationChannels.isEnabled, true),
      ),
    );

  return channel?.userId ?? null;
}

async function findMostRecentNotifiedTask(
  userId: string,
): Promise<{ readonly taskId: string } | null> {
  const recent = await notificationRepo.findPendingNotifications(userId, 1);

  if (recent.length === 0 || !recent[0].taskId) {
    return null;
  }

  return { taskId: recent[0].taskId };
}

async function disableUserChannel(
  userId: string,
  channelType: string,
): Promise<void> {
  await db
    .update(notificationChannels)
    .set({ isEnabled: false, updatedAt: new Date() })
    .where(
      and(
        eq(notificationChannels.userId, userId),
        eq(
          notificationChannels.channelType,
          channelType as typeof notificationChannels.channelType.enumValues[number],
        ),
      ),
    );

  log.info({ userId, channelType }, "Channel disabled via STOP command");
}

async function sendReply(
  channel: string,
  recipient: string,
  text: string,
): Promise<void> {
  const adapter = getAdapter(channel);
  if (!adapter) {
    log.warn({ channel }, "No adapter found for channel, cannot send reply");
    return;
  }

  try {
    await adapter.send(recipient, { text });
  } catch (error) {
    log.error(
      {
        channel,
        recipient: maskIdentifier(recipient),
        error: error instanceof Error ? error.message : "Unknown",
      },
      "Failed to send channel reply",
    );
  }
}

function formatDurationLabel(minutes: number): string {
  if (minutes >= 60 && minutes % 60 === 0) {
    const hours = minutes / 60;
    return hours === 1 ? "1 hour" : `${hours} hours`;
  }
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  }
  return minutes === 1 ? "1 minute" : `${minutes} minutes`;
}

/**
 * Masks an identifier for safe logging (e.g., phone numbers, chat IDs).
 * Shows first 3 and last 2 characters with asterisks in between.
 */
function maskIdentifier(id: string): string {
  if (id.length <= 5) return "***";
  return `${id.slice(0, 3)}${"*".repeat(id.length - 5)}${id.slice(-2)}`;
}
