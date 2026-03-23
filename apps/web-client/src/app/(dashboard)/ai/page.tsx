'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getChatHistory, sendChatMessage, type AiChatMessage } from '@/lib/api/ai';
import { cn } from '@/lib/utils/cn';
import { Shimmer } from '@/components/ui/shimmer';
import { Button } from '@/components/ui/button';
import {
  Send,
  Sparkles,
  Bot,
  User,
  RefreshCw,
  Zap,
  Calendar,
  ListChecks,
  Brain,
} from 'lucide-react';

// ─── Persona Chips ──────────────────────────────────────────────

interface Persona {
  readonly id: string;
  readonly label: string;
  readonly icon: React.ReactNode;
}

const PERSONAS: readonly Persona[] = [
  { id: 'default', label: 'Assistant', icon: <Bot size={14} /> },
  { id: 'coach', label: 'Productivity Coach', icon: <Zap size={14} /> },
  { id: 'planner', label: 'Task Planner', icon: <Calendar size={14} /> },
  { id: 'analyst', label: 'Insights Analyst', icon: <Brain size={14} /> },
];

// ─── Quick Actions ──────────────────────────────────────────────

const QUICK_ACTIONS: readonly { label: string; prompt: string }[] = [
  { label: 'What should I focus on?', prompt: 'What should I focus on right now based on my task priorities and deadlines?' },
  { label: 'Break down my tasks', prompt: 'Help me break down my most important task into smaller subtasks.' },
  { label: 'Weekly review', prompt: 'Give me a weekly review summary of my productivity and task completion.' },
  { label: 'Schedule my day', prompt: 'Help me plan and schedule my tasks for today based on priority and energy levels.' },
];

// ─── Message Bubble ─────────────────────────────────────────────

function MessageBubble({ message }: { readonly message: AiChatMessage }) {
  const isUser = message.role === 'user';

  return (
    <div
      className={cn(
        'flex gap-3 max-w-[85%] animate-slide-up',
        isUser ? 'ml-auto flex-row-reverse' : 'mr-auto',
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
          isUser
            ? 'bg-gradient-to-br from-unjynx-gold to-unjynx-gold-rich'
            : 'bg-gradient-to-br from-unjynx-violet to-unjynx-lavender',
        )}
      >
        {isUser ? (
          <User size={14} className="text-unjynx-midnight" />
        ) : (
          <Sparkles size={14} className="text-white" />
        )}
      </div>

      {/* Bubble */}
      <div
        className={cn(
          'px-4 py-3 rounded-2xl text-sm leading-relaxed',
          isUser
            ? 'bg-unjynx-gold/15 text-[var(--foreground)] rounded-br-md'
            : 'bg-[var(--background-elevated)] text-[var(--foreground)] rounded-bl-md border border-[var(--border)]',
        )}
      >
        <p className="whitespace-pre-wrap">{message.content}</p>
        <p
          className={cn(
            'text-[10px] mt-1.5',
            isUser ? 'text-unjynx-gold-rich/60 text-right' : 'text-[var(--muted-foreground)]',
          )}
        >
          {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  );
}

// ─── Typing Indicator ───────────────────────────────────────────

function TypingIndicator() {
  return (
    <div className="flex items-center gap-3 mr-auto">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-unjynx-violet to-unjynx-lavender flex items-center justify-center">
        <Sparkles size={14} className="text-white" />
      </div>
      <div className="px-4 py-3 rounded-2xl rounded-bl-md bg-[var(--background-elevated)] border border-[var(--border)]">
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-unjynx-violet animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 rounded-full bg-unjynx-violet animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 rounded-full bg-unjynx-violet animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}

// ─── AI Chat Page ───────────────────────────────────────────────

export default function AiChatPage() {
  const queryClient = useQueryClient();
  const [input, setInput] = useState('');
  const [activePersona, setActivePersona] = useState('default');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { data: messages, isLoading } = useQuery({
    queryKey: ['ai', 'chat'],
    queryFn: () => getChatHistory({ limit: 50 }),
    staleTime: 30_000,
  });

  const sendMutation = useMutation({
    mutationFn: (message: string) => sendChatMessage(message),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai', 'chat'] });
    },
  });

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sendMutation.isPending]);

  const handleSend = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed || sendMutation.isPending) return;

    // Optimistic: add user message locally
    const optimisticMsg: AiChatMessage = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: trimmed,
      metadata: null,
      createdAt: new Date().toISOString(),
    };

    queryClient.setQueryData<readonly AiChatMessage[]>(['ai', 'chat'], (old) =>
      old ? [...old, optimisticMsg] : [optimisticMsg],
    );

    setInput('');
    sendMutation.mutate(trimmed);
  }, [input, sendMutation, queryClient]);

  const handleQuickAction = useCallback((prompt: string) => {
    setInput(prompt);
    // Auto-send
    const optimisticMsg: AiChatMessage = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: prompt,
      metadata: null,
      createdAt: new Date().toISOString(),
    };

    queryClient.setQueryData<readonly AiChatMessage[]>(['ai', 'chat'], (old) =>
      old ? [...old, optimisticMsg] : [optimisticMsg],
    );

    setInput('');
    sendMutation.mutate(prompt);
  }, [sendMutation, queryClient]);

  const allMessages = messages ?? [];

  return (
    <div className="flex flex-col h-[calc(100vh-theme(spacing.navbar-h)-theme(spacing.views-bar-h)-3rem)] animate-fade-in">
      {/* Header */}
      <div className="flex-shrink-0 pb-3 border-b border-[var(--border)]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-unjynx-violet to-unjynx-gold flex items-center justify-center">
              <Sparkles size={16} className="text-white" />
            </div>
            <div>
              <h1 className="font-outfit text-lg font-bold text-[var(--foreground)]">AI Chat</h1>
              <p className="text-[10px] text-[var(--muted-foreground)]">Powered by Claude</p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => queryClient.invalidateQueries({ queryKey: ['ai', 'chat'] })}
            title="Refresh"
          >
            <RefreshCw size={16} />
          </Button>
        </div>

        {/* Persona chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {PERSONAS.map((p) => (
            <button
              key={p.id}
              onClick={() => setActivePersona(p.id)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors',
                activePersona === p.id
                  ? 'bg-unjynx-violet text-white'
                  : 'bg-[var(--background-surface)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] border border-[var(--border)]',
              )}
            >
              {p.icon}
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4 min-h-0">
        {isLoading ? (
          <div className="space-y-4 px-4">
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className={cn('flex gap-3', i % 2 === 0 ? 'mr-auto' : 'ml-auto')}>
                <Shimmer variant="circle" className="w-8 h-8" />
                <Shimmer className={cn('h-16 rounded-2xl', i % 2 === 0 ? 'w-2/3' : 'w-1/2')} />
              </div>
            ))}
          </div>
        ) : allMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-unjynx-violet/20 to-unjynx-gold/20 flex items-center justify-center mb-4">
              <Sparkles size={28} className="text-unjynx-violet" />
            </div>
            <h2 className="font-outfit font-semibold text-base text-[var(--foreground)] mb-1">
              How can I help?
            </h2>
            <p className="text-sm text-[var(--muted-foreground)] mb-6 max-w-sm">
              Ask me about your tasks, get scheduling suggestions, or request productivity insights.
            </p>

            {/* Quick action pills */}
            <div className="flex flex-wrap gap-2 justify-center max-w-md">
              {QUICK_ACTIONS.map((action) => (
                <button
                  key={action.label}
                  onClick={() => handleQuickAction(action.prompt)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[var(--border)] text-xs text-[var(--foreground-secondary)] hover:text-[var(--foreground)] hover:bg-[var(--background-surface)] hover:border-unjynx-violet/30 transition-colors"
                >
                  <ListChecks size={12} className="text-unjynx-violet" />
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          allMessages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))
        )}

        {sendMutation.isPending && <TypingIndicator />}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="flex-shrink-0 pt-3 border-t border-[var(--border)]">
        <div className="flex items-end gap-2">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Ask UNJYNX AI anything..."
              rows={1}
              className="w-full px-4 py-3 rounded-xl bg-[var(--background-surface)] border border-[var(--border)] text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] outline-none resize-none focus:border-unjynx-violet/50 focus:ring-1 focus:ring-unjynx-violet/20 transition-all"
              style={{ minHeight: '48px', maxHeight: '120px' }}
            />
          </div>
          <Button
            variant="default"
            size="icon"
            onClick={handleSend}
            disabled={!input.trim() || sendMutation.isPending}
            className="flex-shrink-0"
          >
            <Send size={18} />
          </Button>
        </div>
        <p className="text-[10px] text-[var(--muted-foreground)] mt-1.5 text-center">
          AI responses are task-specific. Press Enter to send, Shift+Enter for new line.
        </p>
      </div>
    </div>
  );
}
