'use client';

import { useQuery } from '@tanstack/react-query';
import { getChannels, type Channel, type ChannelType } from '@/lib/api/channels';
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

// ─── Channel Card ───────────────────────────────────────────────

function ChannelCard({
  info,
  channel,
}: {
  readonly info: ChannelInfo;
  readonly channel: Channel | null;
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
          <Button variant="default" size="sm" className="w-full">
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
  const { data: channels, isLoading } = useQuery({
    queryKey: ['channels'],
    queryFn: getChannels,
    staleTime: 60_000,
  });

  // Map channels by type
  const channelMap = new Map<ChannelType, Channel>();
  if (channels) {
    for (const ch of channels) {
      channelMap.set(ch.type, ch);
    }
  }

  const connectedCount = channels?.filter((c) => c.status === 'active').length ?? 0;

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
    </div>
  );
}
