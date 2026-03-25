'use client';

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getChannels, addChannel, type Channel, type ChannelType, type AddChannelPayload } from '@/lib/api/channels';
import { cn } from '@/lib/utils/cn';
import { Shimmer } from '@/components/ui/shimmer';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import {
  Radio,
  MessageSquare,
  Send,
  Mail,
  Smartphone,
  Instagram,
  Hash,
  Gamepad2,
  Bell,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  Settings,
  X,
  Info,
  Copy,
} from 'lucide-react';

// ─── Channel Config ─────────────────────────────────────────────

interface ChannelInfo {
  readonly type: ChannelType;
  readonly name: string;
  readonly icon: React.ReactNode;
  readonly color: string;
  readonly description: string;
}

const CHANNEL_INFO: readonly ChannelInfo[] = [
  {
    type: 'whatsapp',
    name: 'WhatsApp',
    icon: <MessageSquare size={24} />,
    color: '#25D366',
    description: 'Send task reminders via WhatsApp messages',
  },
  {
    type: 'telegram',
    name: 'Telegram',
    icon: <Send size={24} />,
    color: '#0088CC',
    description: 'Free reminders through Telegram bot',
  },
  {
    type: 'sms',
    name: 'SMS',
    icon: <Smartphone size={24} />,
    color: '#FF9F1C',
    description: 'Text message reminders to your phone',
  },
  {
    type: 'email',
    name: 'Email',
    icon: <Mail size={24} />,
    color: '#6C3CE0',
    description: 'Reminder emails with task details',
  },
  {
    type: 'instagram',
    name: 'Instagram',
    icon: <Instagram size={24} />,
    color: '#E1306C',
    description: 'DM reminders via Instagram (Friend First)',
  },
  {
    type: 'slack',
    name: 'Slack',
    icon: <Hash size={24} />,
    color: '#4A154B',
    description: 'Slack channel or DM notifications',
  },
  {
    type: 'discord',
    name: 'Discord',
    icon: <Gamepad2 size={24} />,
    color: '#5865F2',
    description: 'Discord server or DM reminders',
  },
  {
    type: 'push',
    name: 'Push Notifications',
    icon: <Bell size={24} />,
    color: '#FFD700',
    description: 'In-app and browser push notifications',
  },
];

// ─── Status Indicator ───────────────────────────────────────────

function StatusIndicator({ status }: { readonly status: Channel['status'] | 'not_connected' }) {
  if (status === 'active') {
    return (
      <div className="flex items-center gap-1.5">
        <CheckCircle2 size={14} className="text-unjynx-emerald" />
        <span className="text-xs font-medium text-unjynx-emerald">Connected</span>
      </div>
    );
  }
  if (status === 'pending') {
    return (
      <div className="flex items-center gap-1.5">
        <Clock size={14} className="text-unjynx-amber" />
        <span className="text-xs font-medium text-unjynx-amber">Pending</span>
      </div>
    );
  }
  if (status === 'failed') {
    return (
      <div className="flex items-center gap-1.5">
        <XCircle size={14} className="text-unjynx-rose" />
        <span className="text-xs font-medium text-unjynx-rose">Failed</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-2 h-2 rounded-full bg-[var(--muted-foreground)]" />
      <span className="text-xs text-[var(--muted-foreground)]">Not connected</span>
    </div>
  );
}

// ─── Connect Dialog ─────────────────────────────────────────────

interface ConnectDialogProps {
  readonly channelType: ChannelType | null;
  readonly channelName: string;
  readonly onClose: () => void;
  readonly onSubmit: (payload: AddChannelPayload) => void;
  readonly isSubmitting: boolean;
}

function ConnectDialog({ channelType, channelName, onClose, onSubmit, isSubmitting }: ConnectDialogProps) {
  const [identifier, setIdentifier] = useState('');
  const [copied, setCopied] = useState(false);

  if (!channelType) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) return;
    onSubmit({ type: channelType, identifier: identifier.trim() });
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Channel-specific content
  const renderContent = () => {
    switch (channelType) {
      case 'push':
        return (
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 rounded-lg bg-unjynx-gold/10 border border-unjynx-gold/20">
              <Info size={18} className="text-unjynx-gold flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-[var(--foreground)]">Auto-connected via mobile app</p>
                <p className="text-xs text-[var(--muted-foreground)] mt-1">
                  Push notifications are automatically enabled when you install the UNJYNX mobile app.
                  Download it from the App Store or Google Play to receive push reminders.
                </p>
              </div>
            </div>
          </div>
        );

      case 'telegram':
        return (
          <div className="space-y-4">
            <p className="text-sm text-[var(--muted-foreground)]">
              Connect Telegram in 3 steps:
            </p>
            <ol className="space-y-3 text-sm text-[var(--foreground)]">
              <li className="flex gap-2">
                <span className="font-semibold text-unjynx-violet">1.</span>
                Open Telegram and search for{' '}
                <button
                  onClick={() => handleCopy('@UnjynxBot')}
                  className="font-mono text-unjynx-violet hover:underline inline-flex items-center gap-1"
                >
                  @UnjynxBot <Copy size={12} />
                </button>
                {copied && <span className="text-xs text-unjynx-emerald">Copied!</span>}
              </li>
              <li className="flex gap-2">
                <span className="font-semibold text-unjynx-violet">2.</span>
                <span>Send <code className="px-1 py-0.5 rounded bg-[var(--background-surface)] font-mono text-xs">/start</code> to the bot</span>
              </li>
              <li className="flex gap-2">
                <span className="font-semibold text-unjynx-violet">3.</span>
                <span>The bot will link your account automatically</span>
              </li>
            </ol>
            <a
              href="https://t.me/UnjynxBot"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0088CC] text-white text-sm font-medium hover:bg-[#0088CC]/90 transition-colors"
            >
              <Send size={16} />
              Open @UnjynxBot
              <ExternalLink size={14} />
            </a>
          </div>
        );

      case 'instagram':
        return (
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 rounded-lg bg-pink-500/10 border border-pink-500/20">
              <Info size={18} className="text-pink-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-[var(--foreground)]">Friend First Approach</p>
                <p className="text-xs text-[var(--muted-foreground)] mt-1">
                  Instagram restricts automated messages. Here is how we work around it:
                </p>
              </div>
            </div>
            <ol className="space-y-2 text-sm text-[var(--foreground)]">
              <li className="flex gap-2">
                <span className="font-semibold text-unjynx-violet">1.</span>
                <span>We send a follow request from our official Instagram page <strong>@unjynx_app</strong></span>
              </li>
              <li className="flex gap-2">
                <span className="font-semibold text-unjynx-violet">2.</span>
                <span>Accept the follow request on Instagram</span>
              </li>
              <li className="flex gap-2">
                <span className="font-semibold text-unjynx-violet">3.</span>
                <span>Once connected, we can send you DM reminders</span>
              </li>
            </ol>
            <form onSubmit={handleSubmit} className="space-y-3">
              <label className="block">
                <span className="text-xs font-medium text-[var(--foreground)]">Your Instagram username</span>
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="@yourusername"
                  className="mt-1 w-full px-3 py-2 rounded-lg bg-[var(--background-surface)] border border-[var(--border)] text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-unjynx-violet/40"
                />
              </label>
              <Button type="submit" variant="default" size="sm" className="w-full" disabled={!identifier.trim() || isSubmitting}>
                {isSubmitting ? 'Connecting...' : 'Send Follow Request'}
              </Button>
            </form>
          </div>
        );

      case 'email':
        return (
          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block">
              <span className="text-xs font-medium text-[var(--foreground)]">Email address</span>
              <input
                type="email"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="you@example.com"
                required
                className="mt-1 w-full px-3 py-2 rounded-lg bg-[var(--background-surface)] border border-[var(--border)] text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-unjynx-violet/40"
              />
            </label>
            <p className="text-xs text-[var(--muted-foreground)]">
              We will send a verification code to confirm your email.
            </p>
            <Button type="submit" variant="default" size="sm" className="w-full" disabled={!identifier.trim() || isSubmitting}>
              {isSubmitting ? 'Connecting...' : 'Connect Email'}
            </Button>
          </form>
        );

      case 'whatsapp':
        return (
          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block">
              <span className="text-xs font-medium text-[var(--foreground)]">Phone number (with country code)</span>
              <input
                type="tel"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="+91 98765 43210"
                required
                className="mt-1 w-full px-3 py-2 rounded-lg bg-[var(--background-surface)] border border-[var(--border)] text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-unjynx-violet/40"
              />
            </label>
            <p className="text-xs text-[var(--muted-foreground)]">
              We will send a verification code via WhatsApp to confirm your number.
            </p>
            <Button type="submit" variant="default" size="sm" className="w-full" disabled={!identifier.trim() || isSubmitting}>
              {isSubmitting ? 'Connecting...' : 'Connect WhatsApp'}
            </Button>
          </form>
        );

      case 'sms':
        return (
          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block">
              <span className="text-xs font-medium text-[var(--foreground)]">Phone number (with country code)</span>
              <input
                type="tel"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="+91 98765 43210"
                required
                className="mt-1 w-full px-3 py-2 rounded-lg bg-[var(--background-surface)] border border-[var(--border)] text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-unjynx-violet/40"
              />
            </label>
            <p className="text-xs text-[var(--muted-foreground)]">
              We will send a verification code via SMS to confirm your number.
            </p>
            <Button type="submit" variant="default" size="sm" className="w-full" disabled={!identifier.trim() || isSubmitting}>
              {isSubmitting ? 'Connecting...' : 'Connect SMS'}
            </Button>
          </form>
        );

      case 'slack':
        return (
          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block">
              <span className="text-xs font-medium text-[var(--foreground)]">Slack Incoming Webhook URL</span>
              <input
                type="url"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="https://hooks.slack.com/services/T.../B.../..."
                required
                className="mt-1 w-full px-3 py-2 rounded-lg bg-[var(--background-surface)] border border-[var(--border)] text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-unjynx-violet/40 font-mono text-xs"
              />
            </label>
            <p className="text-xs text-[var(--muted-foreground)]">
              Create an incoming webhook in your Slack workspace settings under Apps &gt; Incoming Webhooks.
            </p>
            <Button type="submit" variant="default" size="sm" className="w-full" disabled={!identifier.trim() || isSubmitting}>
              {isSubmitting ? 'Connecting...' : 'Connect Slack'}
            </Button>
          </form>
        );

      case 'discord':
        return (
          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block">
              <span className="text-xs font-medium text-[var(--foreground)]">Discord Webhook URL</span>
              <input
                type="url"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="https://discord.com/api/webhooks/..."
                required
                className="mt-1 w-full px-3 py-2 rounded-lg bg-[var(--background-surface)] border border-[var(--border)] text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-unjynx-violet/40 font-mono text-xs"
              />
            </label>
            <p className="text-xs text-[var(--muted-foreground)]">
              In your Discord server, go to Channel Settings &gt; Integrations &gt; Webhooks &gt; New Webhook.
            </p>
            <Button type="submit" variant="default" size="sm" className="w-full" disabled={!identifier.trim() || isSubmitting}>
              {isSubmitting ? 'Connecting...' : 'Connect Discord'}
            </Button>
          </form>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Dialog */}
      <div className="relative w-full max-w-md mx-4 rounded-2xl bg-[var(--background)] border border-[var(--border)] shadow-2xl p-6 animate-fade-in">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg hover:bg-[var(--background-surface)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
        >
          <X size={18} />
        </button>

        {/* Title */}
        <h2 className="font-outfit font-bold text-lg text-[var(--foreground)] mb-1">
          Connect {channelName}
        </h2>
        <p className="text-xs text-[var(--muted-foreground)] mb-5">
          Set up {channelName} to receive task reminders
        </p>

        {renderContent()}
      </div>
    </div>
  );
}

// ─── Channel Card ───────────────────────────────────────────────

function ChannelCard({
  info,
  channel,
  onConnect,
}: {
  readonly info: ChannelInfo;
  readonly channel: Channel | null;
  readonly onConnect: (type: ChannelType) => void;
}) {
  const isConnected = channel?.status === 'active';

  return (
    <div
      className={cn(
        'glass-card p-5 group hover:shadow-unjynx-card-dark transition-all duration-200 hover:-translate-y-0.5',
        isConnected && 'border-unjynx-emerald/20',
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: info.color + '20', color: info.color }}
        >
          {info.icon}
        </div>
        <StatusIndicator status={channel?.status ?? 'not_connected'} />
      </div>

      {/* Info */}
      <h3 className="font-outfit font-semibold text-base text-[var(--foreground)] mb-1">
        {info.name}
      </h3>
      <p className="text-xs text-[var(--muted-foreground)] mb-4 line-clamp-2">
        {info.description}
      </p>

      {/* Stats (if connected) */}
      {isConnected && (
        <div className="flex items-center gap-4 mb-4 pb-4 border-b border-[var(--border)]">
          <div>
            <p className="font-bebas text-xl text-[var(--foreground)]">0</p>
            <p className="text-[10px] text-[var(--muted-foreground)]">Sent Today</p>
          </div>
          <div>
            <p className="text-xs text-[var(--muted-foreground)]">
              {channel?.identifier && `${channel.identifier.slice(0, 20)}...`}
            </p>
          </div>
        </div>
      )}

      {/* Action */}
      <div className="flex items-center gap-2">
        {isConnected ? (
          <>
            <Button variant="outline" size="sm" className="flex-1">
              <Settings size={14} />
              Configure
            </Button>
            <Button variant="ghost" size="icon-sm">
              <ExternalLink size={14} />
            </Button>
          </>
        ) : (
          <Button variant="default" size="sm" className="w-full" onClick={() => onConnect(info.type)}>
            <Plus size={14} />
            Connect
          </Button>
        )}
      </div>
    </div>
  );
}

// ─── Channels Page ──────────────────────────────────────────────

export default function ChannelsPage() {
  const queryClient = useQueryClient();
  const [connectingType, setConnectingType] = useState<ChannelType | null>(null);

  const { data: channels, isLoading } = useQuery({
    queryKey: ['channels'],
    queryFn: getChannels,
    staleTime: 60_000,
  });

  const addChannelMutation = useMutation({
    mutationFn: (payload: AddChannelPayload) => addChannel(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channels'] });
      setConnectingType(null);
    },
  });

  const handleOpenConnect = useCallback((type: ChannelType) => {
    setConnectingType(type);
  }, []);

  const handleCloseConnect = useCallback(() => {
    setConnectingType(null);
  }, []);

  const handleSubmitChannel = useCallback(
    (payload: AddChannelPayload) => {
      addChannelMutation.mutate(payload);
    },
    [addChannelMutation],
  );

  // Map channels by type
  const channelMap = new Map<ChannelType, Channel>();
  if (channels) {
    for (const ch of channels) {
      channelMap.set(ch.type, ch);
    }
  }

  const connectedCount = channels?.filter((c) => c.status === 'active').length ?? 0;
  const connectingInfo = CHANNEL_INFO.find((i) => i.type === connectingType);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <h1 className="font-outfit text-xl font-bold text-[var(--foreground)]">Channels</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }, (_, i) => (
            <Shimmer key={i} variant="card" className="h-[200px]" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="font-outfit text-xl font-bold text-[var(--foreground)]">Channels</h1>
        <p className="text-sm text-[var(--muted-foreground)] mt-1">
          Connect your messaging platforms to receive task reminders everywhere.
          <span className="text-unjynx-emerald font-medium ml-1">
            {connectedCount}/{CHANNEL_INFO.length} connected
          </span>
        </p>
      </div>

      {/* Channel Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {CHANNEL_INFO.map((info) => (
          <ChannelCard
            key={info.type}
            info={info}
            channel={channelMap.get(info.type) ?? null}
            onConnect={handleOpenConnect}
          />
        ))}
      </div>

      {/* Info card */}
      <div className="glass-card p-5 border-unjynx-gold/20">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-unjynx-gold/15 flex items-center justify-center flex-shrink-0">
            <Radio size={20} className="text-unjynx-gold" />
          </div>
          <div>
            <h3 className="font-outfit font-semibold text-sm text-[var(--foreground)]">
              Social Media Reminders
            </h3>
            <p className="text-xs text-[var(--muted-foreground)] mt-1 max-w-lg">
              UNJYNX is the only productivity app that sends reminders via WhatsApp, Telegram,
              Instagram, and more. Never miss a deadline, no matter where you are.
            </p>
          </div>
        </div>
      </div>

      {/* Connect Dialog */}
      {connectingType && (
        <ConnectDialog
          channelType={connectingType}
          channelName={connectingInfo?.name ?? connectingType}
          onClose={handleCloseConnect}
          onSubmit={handleSubmitChannel}
          isSubmitting={addChannelMutation.isPending}
        />
      )}
    </div>
  );
}
