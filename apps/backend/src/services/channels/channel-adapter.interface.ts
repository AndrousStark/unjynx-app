// ── Channel Adapter Interface ─────────────────────────────────────────
// Hexagonal port: every notification channel (push, Telegram, email, etc.)
// implements this contract so the orchestrator stays channel-agnostic.

export interface RenderedMessage {
  readonly subject?: string;
  readonly text: string;
  readonly html?: string;
  readonly markdown?: string;
  readonly blocks?: readonly unknown[];
  readonly embed?: unknown;
  readonly buttons?: ReadonlyArray<{
    readonly label: string;
    readonly action: string;
    readonly data: string;
  }>;
}

export interface ChannelSendResult {
  readonly success: boolean;
  readonly providerMessageId?: string;
  readonly errorType?: string;
  readonly errorMessage?: string;
  readonly costAmount?: string;
  readonly costCurrency?: string;
}

export interface ChannelAdapter {
  readonly channelType: string;
  send(recipient: string, message: RenderedMessage): Promise<ChannelSendResult>;
  validateConnection(identifier: string): Promise<boolean>;
  disconnect(identifier: string): Promise<void>;
}
