'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils/cn';
import { formatDistanceToNow } from 'date-fns';
import type { Message } from '@/lib/api/messaging';
import {
  MessageSquare,
  Edit3,
  Trash2,
  SmilePlus,
  Pin,
  MoreHorizontal,
  Send,
  Reply,
} from 'lucide-react';

// ─── Message Bubble ──────────────────────────────────────────────

interface MessageBubbleProps {
  readonly message: Message;
  readonly isOwn: boolean;
  readonly showHeader: boolean;
  readonly onReply?: (messageId: string) => void;
  readonly onEdit?: (messageId: string, content: string) => void;
  readonly onDelete?: (messageId: string) => void;
  readonly onReact?: (messageId: string, emoji: string) => void;
}

export function MessageBubble({
  message,
  isOwn,
  showHeader,
  onReply,
  onEdit,
  onDelete,
  onReact,
}: MessageBubbleProps) {
  const [showActions, setShowActions] = useState(false);

  if (message.isDeleted) {
    return (
      <div className="px-4 py-1">
        <p className="text-xs text-[var(--muted-foreground)] italic">This message was deleted</p>
      </div>
    );
  }

  return (
    <div
      className="group px-4 py-1 hover:bg-[var(--background-surface)]/50 transition-colors relative"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="flex gap-2.5">
        {/* Avatar (only on header messages) */}
        {showHeader ? (
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--accent)] to-[var(--gold)] flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5">
            {message.userId.slice(0, 2).toUpperCase()}
          </div>
        ) : (
          <div className="w-8 flex-shrink-0" />
        )}

        <div className="flex-1 min-w-0">
          {/* Header: name + timestamp */}
          {showHeader && (
            <div className="flex items-baseline gap-2 mb-0.5">
              <span className="text-sm font-semibold text-[var(--foreground)]">
                {isOwn ? 'You' : message.userId.slice(0, 8)}
              </span>
              <span className="text-[10px] text-[var(--muted-foreground)]">
                {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
              </span>
              {message.isEdited && (
                <span className="text-[9px] text-[var(--muted-foreground)]">(edited)</span>
              )}
            </div>
          )}

          {/* Content */}
          <p className="text-sm text-[var(--foreground)] whitespace-pre-wrap break-words">
            {message.content}
          </p>

          {/* Thread indicator */}
          {message.isThreadRoot && message.replyCount > 0 && (
            <button
              onClick={() => onReply?.(message.id)}
              className="flex items-center gap-1 mt-1 text-[10px] text-[var(--accent)] hover:underline"
            >
              <Reply size={10} />
              {message.replyCount} {message.replyCount === 1 ? 'reply' : 'replies'}
            </button>
          )}
        </div>
      </div>

      {/* Hover actions */}
      {showActions && (
        <div className="absolute right-4 top-0 -translate-y-1/2 flex items-center gap-0.5 px-1 py-0.5 rounded-lg border border-[var(--border)] bg-[var(--card)] shadow-md">
          <button
            onClick={() => onReact?.(message.id, '👍')}
            className="p-1 rounded hover:bg-[var(--background-surface)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
            title="React"
          >
            <SmilePlus size={14} />
          </button>
          <button
            onClick={() => onReply?.(message.id)}
            className="p-1 rounded hover:bg-[var(--background-surface)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
            title="Reply in thread"
          >
            <MessageSquare size={14} />
          </button>
          {isOwn && (
            <>
              <button
                onClick={() => onEdit?.(message.id, message.content)}
                className="p-1 rounded hover:bg-[var(--background-surface)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                title="Edit"
              >
                <Edit3 size={14} />
              </button>
              <button
                onClick={() => onDelete?.(message.id)}
                className="p-1 rounded hover:bg-[var(--background-surface)] text-[var(--muted-foreground)] hover:text-[var(--destructive)] transition-colors"
                title="Delete"
              >
                <Trash2 size={14} />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Message Input ───────────────────────────────────────────────

interface MessageInputProps {
  readonly onSend: (content: string) => void;
  readonly placeholder?: string;
  readonly disabled?: boolean;
  readonly threadId?: string;
}

export function MessageInput({
  onSend,
  placeholder = 'Type a message...',
  disabled = false,
}: MessageInputProps) {
  const [content, setContent] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [content]);

  const handleSend = useCallback(() => {
    const trimmed = content.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setContent('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [content, onSend]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  return (
    <div className="border-t border-[var(--border)] p-3 bg-[var(--background)]">
      <div className="flex items-end gap-2 rounded-xl border border-[var(--border)] bg-[var(--background-surface)] px-3 py-2 focus-within:border-[var(--accent)]/50 focus-within:ring-2 focus-within:ring-[var(--accent)]/10 transition-all">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          className="flex-1 text-sm bg-transparent text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] outline-none resize-none max-h-[200px]"
        />
        <button
          onClick={handleSend}
          disabled={!content.trim() || disabled}
          className={cn(
            'flex-shrink-0 p-1.5 rounded-lg transition-colors',
            content.trim()
              ? 'bg-[var(--accent)] text-white hover:opacity-90'
              : 'text-[var(--muted-foreground)]',
          )}
        >
          <Send size={16} />
        </button>
      </div>
      <p className="text-[9px] text-[var(--muted-foreground)] mt-1 px-1">
        Enter to send, Shift+Enter for new line
      </p>
    </div>
  );
}
