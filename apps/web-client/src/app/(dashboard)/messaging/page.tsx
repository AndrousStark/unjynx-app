'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils/cn';
import { Button } from '@/components/ui/button';
import { Shimmer } from '@/components/ui/shimmer';
import { useAuth } from '@/lib/hooks/use-auth';
import { ChannelList } from '@/components/messaging/channel-list';
import { MessageBubble } from '@/components/messaging/message-view';
import { RichMessageInput } from '@/components/messaging/rich-message-input';
import {
  getChannels,
  getChannel,
  getMessages,
  sendMessage,
  editMessage,
  deleteMessage,
  addReaction,
  getUnreadCounts,
  markAsRead,
  createChannel,
  type MsgChannel,
  type Message,
} from '@/lib/api/messaging';
import {
  MessageCircle,
  Hash,
  Users,
  Settings,
  Pin,
  Search,
  Plus,
  Loader2,
  X,
} from 'lucide-react';

// ─── Create Channel Modal ────────────────────────────────────────

function CreateChannelModal({
  onClose,
  onCreated,
}: {
  readonly onClose: () => void;
  readonly onCreated: (channel: MsgChannel) => void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);

  const mutation = useMutation({
    mutationFn: () =>
      createChannel({
        name: name.trim().toLowerCase().replace(/\s+/g, '-'),
        description: description.trim() || undefined,
        channelType: isPrivate ? 'private' : 'public',
      }),
    onSuccess: (channel) => onCreated(channel),
  });

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md p-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-outfit text-lg font-bold text-[var(--foreground)]">Create Channel</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-[var(--background-surface)]">
            <X size={16} className="text-[var(--muted-foreground)]" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-[var(--foreground)] mb-1 block">Channel Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., general, design-team"
              className="w-full px-3 py-2 rounded-lg bg-[var(--background-surface)] border border-[var(--border)] text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] outline-none focus:border-[var(--accent)]/50"
              autoFocus
            />
          </div>
          <div>
            <label className="text-xs font-medium text-[var(--foreground)] mb-1 block">Description (optional)</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this channel about?"
              className="w-full px-3 py-2 rounded-lg bg-[var(--background-surface)] border border-[var(--border)] text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] outline-none focus:border-[var(--accent)]/50"
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
              className="rounded border-[var(--border)]"
            />
            <span className="text-xs text-[var(--foreground)]">Make this channel private</span>
          </label>
        </div>

        <div className="flex justify-end gap-2 mt-5">
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={() => mutation.mutate()} disabled={!name.trim() || mutation.isPending}>
            {mutation.isPending ? <Loader2 size={12} className="animate-spin mr-1" /> : <Plus size={12} className="mr-1" />}
            Create
          </Button>
        </div>
      </div>
    </>
  );
}

// ─── Channel Header ──────────────────────────────────────────────

function ChannelHeader({ channel }: { readonly channel: MsgChannel }) {
  const Icon = channel.channelType === 'private' ? Settings : Hash;

  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] bg-[var(--background)]">
      <div className="flex items-center gap-2">
        <Icon size={16} className="text-[var(--muted-foreground)]" />
        <h2 className="text-sm font-semibold text-[var(--foreground)]">{channel.name ?? 'Direct Message'}</h2>
        {channel.topic && (
          <span className="text-xs text-[var(--muted-foreground)] border-l border-[var(--border)] pl-2 ml-1 hidden md:inline">
            {channel.topic}
          </span>
        )}
      </div>
      <div className="flex items-center gap-1.5 text-[var(--muted-foreground)]">
        <span className="text-[10px]">{channel.memberCount} members</span>
        <button className="p-1 rounded hover:bg-[var(--background-surface)]"><Pin size={14} /></button>
        <button className="p-1 rounded hover:bg-[var(--background-surface)]"><Search size={14} /></button>
        <button className="p-1 rounded hover:bg-[var(--background-surface)]"><Users size={14} /></button>
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────

export default function MessagingPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeChannelId, setActiveChannelId] = useState<string | null>(null);
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const userId = (user as { id: string } | undefined)?.id ?? '';

  // Fetch channels
  const { data: channels, isLoading: loadingChannels } = useQuery({
    queryKey: ['messaging-channels'],
    queryFn: getChannels,
    staleTime: 30_000,
  });

  // Fetch unread counts
  const { data: unreadCounts } = useQuery({
    queryKey: ['messaging-unread'],
    queryFn: getUnreadCounts,
    staleTime: 15_000,
    refetchInterval: 30_000,
  });

  // Fetch active channel details
  const { data: activeChannel } = useQuery({
    queryKey: ['messaging-channel', activeChannelId],
    queryFn: () => getChannel(activeChannelId!),
    enabled: !!activeChannelId,
  });

  // Fetch messages for active channel
  const { data: messages, isLoading: loadingMessages } = useQuery({
    queryKey: ['messages', activeChannelId],
    queryFn: () => getMessages(activeChannelId!, { limit: 50 }),
    enabled: !!activeChannelId,
    staleTime: 10_000,
    refetchInterval: 15_000,
  });

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send message mutation
  const sendMutation = useMutation({
    mutationFn: (content: string) => sendMessage(activeChannelId!, { content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', activeChannelId] });
      queryClient.invalidateQueries({ queryKey: ['messaging-unread'] });
    },
  });

  // Edit mutation
  const editMutation = useMutation({
    mutationFn: ({ id, content }: { id: string; content: string }) => editMessage(id, content),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['messages', activeChannelId] }),
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteMessage(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['messages', activeChannelId] }),
  });

  // React mutation
  const reactMutation = useMutation({
    mutationFn: ({ messageId, emoji }: { messageId: string; emoji: string }) => addReaction(messageId, emoji),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['messages', activeChannelId] }),
  });

  // Mark as read when viewing
  useEffect(() => {
    if (!activeChannelId || !messages || messages.length === 0) return;
    const lastMsg = messages[0]; // messages are desc order
    if (lastMsg) {
      markAsRead(activeChannelId, lastMsg.id).catch(() => {});
    }
  }, [activeChannelId, messages]);

  const handleChannelCreated = useCallback(
    (channel: MsgChannel) => {
      queryClient.invalidateQueries({ queryKey: ['messaging-channels'] });
      setActiveChannelId(channel.id);
      setShowCreateChannel(false);
    },
    [queryClient],
  );

  // Determine which messages should show headers (group consecutive by same user)
  const sortedMessages = [...(messages ?? [])].reverse();
  const shouldShowHeader = (msg: Message, idx: number): boolean => {
    if (idx === 0) return true;
    const prev = sortedMessages[idx - 1];
    if (prev.userId !== msg.userId) return true;
    const gap = new Date(msg.createdAt).getTime() - new Date(prev.createdAt).getTime();
    return gap > 5 * 60_000; // 5 min gap = new header
  };

  return (
    <div className="flex h-[calc(100vh-64px)] animate-fade-in">
      {/* Channel Sidebar */}
      <div className="w-64 flex-shrink-0 hidden md:block">
        {loadingChannels ? (
          <div className="p-3 space-y-2">
            {Array.from({ length: 8 }, (_, i) => <Shimmer key={i} className="h-8 rounded-lg" />)}
          </div>
        ) : (
          <ChannelList
            channels={channels ?? []}
            unreadCounts={unreadCounts ?? []}
            activeChannelId={activeChannelId}
            onSelect={setActiveChannelId}
            onCreateChannel={() => setShowCreateChannel(true)}
            onCreateDm={() => {}}
          />
        )}
      </div>

      {/* Message Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {activeChannel ? (
          <>
            <ChannelHeader channel={activeChannel} />

            {/* Messages */}
            <div className="flex-1 overflow-y-auto">
              {loadingMessages ? (
                <div className="p-4 space-y-3">
                  {Array.from({ length: 6 }, (_, i) => <Shimmer key={i} className="h-16 rounded-lg" />)}
                </div>
              ) : sortedMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full">
                  <MessageCircle size={40} className="text-[var(--muted-foreground)] mb-3" />
                  <p className="text-sm text-[var(--foreground)]">No messages yet</p>
                  <p className="text-xs text-[var(--muted-foreground)] mt-1">Be the first to say something!</p>
                </div>
              ) : (
                <div className="py-2">
                  {sortedMessages.map((msg, idx) => (
                    <MessageBubble
                      key={msg.id}
                      message={msg}
                      isOwn={msg.userId === userId}
                      showHeader={shouldShowHeader(msg, idx)}
                      onEdit={(id, content) => {
                        const newContent = prompt('Edit message:', content);
                        if (newContent && newContent !== content) {
                          editMutation.mutate({ id, content: newContent });
                        }
                      }}
                      onDelete={(id) => {
                        if (confirm('Delete this message?')) {
                          deleteMutation.mutate(id);
                        }
                      }}
                      onReact={(messageId, emoji) => reactMutation.mutate({ messageId, emoji })}
                    />
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Rich Text Input */}
            <RichMessageInput
              onSend={(content) => sendMutation.mutate(content)}
              disabled={sendMutation.isPending}
              placeholder={`Message #${activeChannel.name ?? 'channel'}...`}
            />
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full">
            <MessageCircle size={48} className="text-[var(--muted-foreground)] mb-4" />
            <h2 className="text-lg font-semibold text-[var(--foreground)] mb-1">Welcome to Messages</h2>
            <p className="text-sm text-[var(--muted-foreground)] mb-4">Select a channel to start chatting</p>
            <Button size="sm" onClick={() => setShowCreateChannel(true)}>
              <Plus size={14} className="mr-1.5" /> Create a Channel
            </Button>
          </div>
        )}
      </div>

      {/* Create Channel Modal */}
      {showCreateChannel && (
        <CreateChannelModal
          onClose={() => setShowCreateChannel(false)}
          onCreated={handleChannelCreated}
        />
      )}
    </div>
  );
}
