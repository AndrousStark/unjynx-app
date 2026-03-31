'use client';

import { cn } from '@/lib/utils/cn';
import type { MsgChannel, UnreadCount } from '@/lib/api/messaging';
import { Hash, Lock, User, Users, Plus, Search } from 'lucide-react';
import { useState, useMemo } from 'react';

interface ChannelListProps {
  readonly channels: readonly MsgChannel[];
  readonly unreadCounts: readonly UnreadCount[];
  readonly activeChannelId: string | null;
  readonly onSelect: (channelId: string) => void;
  readonly onCreateChannel: () => void;
  readonly onCreateDm: () => void;
}

const CHANNEL_ICONS: Record<string, React.ElementType> = {
  public: Hash,
  private: Lock,
  dm: User,
  group_dm: Users,
};

export function ChannelList({
  channels,
  unreadCounts,
  activeChannelId,
  onSelect,
  onCreateChannel,
  onCreateDm,
}: ChannelListProps) {
  const [search, setSearch] = useState('');

  const unreadMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const u of unreadCounts) map.set(u.channelId, u.unreadCount);
    return map;
  }, [unreadCounts]);

  const publicChannels = channels.filter((c) => c.channelType === 'public' || c.channelType === 'private');
  const dmChannels = channels.filter((c) => c.channelType === 'dm' || c.channelType === 'group_dm');

  const filteredPublic = search
    ? publicChannels.filter((c) => c.name?.toLowerCase().includes(search.toLowerCase()))
    : publicChannels;

  const filteredDms = search
    ? dmChannels.filter((c) => c.name?.toLowerCase().includes(search.toLowerCase()))
    : dmChannels;

  return (
    <div className="flex flex-col h-full border-r border-[var(--border)] bg-[var(--sidebar)]">
      {/* Header */}
      <div className="p-3 border-b border-[var(--border)]">
        <h2 className="font-outfit text-sm font-bold text-[var(--foreground)] mb-2">Messages</h2>
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[var(--background-surface)] border border-[var(--border)]">
          <Search size={12} className="text-[var(--muted-foreground)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search channels..."
            className="flex-1 text-xs bg-transparent text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] outline-none"
          />
        </div>
      </div>

      {/* Channel list */}
      <div className="flex-1 overflow-y-auto py-1">
        {/* Channels section */}
        <div className="px-3 py-1.5 flex items-center justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
            Channels
          </span>
          <button
            onClick={onCreateChannel}
            className="p-0.5 rounded hover:bg-[var(--sidebar-hover)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
          >
            <Plus size={12} />
          </button>
        </div>

        {filteredPublic.map((channel) => {
          const Icon = CHANNEL_ICONS[channel.channelType] ?? Hash;
          const unread = unreadMap.get(channel.id) ?? 0;
          const isActive = channel.id === activeChannelId;

          return (
            <button
              key={channel.id}
              onClick={() => onSelect(channel.id)}
              className={cn(
                'flex items-center gap-2 w-full px-3 py-1.5 text-left transition-colors',
                'hover:bg-[var(--sidebar-hover)]',
                isActive && 'bg-[var(--sidebar-active)]/10 text-[var(--sidebar-active)]',
              )}
            >
              <Icon size={14} className={isActive ? 'text-[var(--sidebar-active)]' : 'text-[var(--muted-foreground)]'} />
              <span className={cn(
                'text-sm truncate flex-1',
                unread > 0 ? 'font-semibold text-[var(--foreground)]' : 'text-[var(--sidebar-foreground)]',
                isActive && 'text-[var(--sidebar-active)]',
              )}>
                {channel.name ?? 'Unnamed'}
              </span>
              {unread > 0 && (
                <span className="flex-shrink-0 min-w-[18px] h-[18px] px-1 rounded-full bg-[var(--destructive)] text-white text-[10px] font-bold flex items-center justify-center">
                  {unread > 99 ? '99+' : unread}
                </span>
              )}
            </button>
          );
        })}

        {/* DMs section */}
        <div className="px-3 py-1.5 mt-2 flex items-center justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
            Direct Messages
          </span>
          <button
            onClick={onCreateDm}
            className="p-0.5 rounded hover:bg-[var(--sidebar-hover)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
          >
            <Plus size={12} />
          </button>
        </div>

        {filteredDms.map((channel) => {
          const unread = unreadMap.get(channel.id) ?? 0;
          const isActive = channel.id === activeChannelId;

          return (
            <button
              key={channel.id}
              onClick={() => onSelect(channel.id)}
              className={cn(
                'flex items-center gap-2 w-full px-3 py-1.5 text-left transition-colors',
                'hover:bg-[var(--sidebar-hover)]',
                isActive && 'bg-[var(--sidebar-active)]/10',
              )}
            >
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[var(--accent)]/40 to-[var(--gold)]/40 flex items-center justify-center text-[10px] text-[var(--foreground)] font-bold flex-shrink-0">
                {(channel.name ?? 'D')[0].toUpperCase()}
              </div>
              <span className={cn(
                'text-sm truncate flex-1',
                unread > 0 ? 'font-semibold text-[var(--foreground)]' : 'text-[var(--sidebar-foreground)]',
              )}>
                {channel.name ?? 'Direct Message'}
              </span>
              {unread > 0 && (
                <span className="flex-shrink-0 w-2 h-2 rounded-full bg-[var(--accent)]" />
              )}
            </button>
          );
        })}

        {filteredPublic.length === 0 && filteredDms.length === 0 && (
          <p className="px-3 py-4 text-xs text-[var(--muted-foreground)] text-center">
            {search ? 'No channels match your search' : 'No channels yet'}
          </p>
        )}
      </div>
    </div>
  );
}
