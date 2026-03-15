import type { ChannelAdapter } from "./channel-adapter.interface.js";
import { createPushAdapter } from "./push.adapter.js";
import { createTelegramAdapter } from "./telegram.adapter.js";
import { createEmailAdapter } from "./email.adapter.js";
import { createWhatsAppAdapter } from "./whatsapp.adapter.js";
import { createSmsAdapter } from "./sms.adapter.js";
import { createInstagramAdapter } from "./instagram.adapter.js";
import { createSlackAdapter } from "./slack.adapter.js";
import { createDiscordAdapter } from "./discord.adapter.js";

// ── Adapter Registry ─────────────────────────────────────────────────
// Lazy-initialized registry of channel adapters. Each adapter self-
// registers only when its required environment variables are present
// (or falls back to mock mode when they are not).

const adapters = new Map<string, ChannelAdapter>();
let initialized = false;

export function getAdapter(channelType: string): ChannelAdapter | null {
  if (!initialized) {
    initializeAdapters();
  }
  return adapters.get(channelType) ?? null;
}

export function registerAdapter(adapter: ChannelAdapter): void {
  adapters.set(adapter.channelType, adapter);
}

export function getAllAdapters(): ReadonlyMap<string, ChannelAdapter> {
  if (!initialized) {
    initializeAdapters();
  }
  return adapters;
}

/** Exposed for testing — resets the registry to uninitialized state. */
export function resetRegistry(): void {
  adapters.clear();
  initialized = false;
}

function initializeAdapters(): void {
  initialized = true;

  registerAdapter(createPushAdapter());
  registerAdapter(createTelegramAdapter());
  registerAdapter(createEmailAdapter());
  registerAdapter(createWhatsAppAdapter());
  registerAdapter(createSmsAdapter());
  registerAdapter(createInstagramAdapter());
  registerAdapter(createSlackAdapter());
  registerAdapter(createDiscordAdapter());
}
