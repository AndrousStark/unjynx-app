'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils/cn';
import { Shimmer } from '@/components/ui/shimmer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  streamChat,
  queryAi,
  getAiUsage,
  type AiChatMessage,
  type Persona,
} from '@/lib/api/ai';
import {
  Send,
  Sparkles,
  Bot,
  User,
  Copy,
  Check,
  ThumbsUp,
  ThumbsDown,
  RotateCcw,
  Zap,
  Shield,
  Briefcase,
  Heart,
  Trophy,
  ArrowDown,
  Loader2,
  X,
} from 'lucide-react';

// ─── Personas ───────────────────────────────────────────────────

interface PersonaConfig {
  readonly id: Persona;
  readonly label: string;
  readonly description: string;
  readonly icon: React.ReactNode;
  readonly color: string;
}

const PERSONAS: readonly PersonaConfig[] = [
  { id: 'default', label: 'Assistant', description: 'Concise & actionable', icon: <Bot size={16} />, color: 'from-violet-500 to-purple-600' },
  { id: 'drill_sergeant', label: 'Drill Sergeant', description: 'No excuses, get it done', icon: <Shield size={16} />, color: 'from-red-500 to-orange-600' },
  { id: 'therapist', label: 'Therapist', description: 'Gentle & empathetic', icon: <Heart size={16} />, color: 'from-pink-400 to-rose-500' },
  { id: 'ceo', label: 'CEO', description: 'Strategic & decisive', icon: <Briefcase size={16} />, color: 'from-blue-500 to-cyan-500' },
  { id: 'coach', label: 'Coach', description: 'Energetic & motivating', icon: <Trophy size={16} />, color: 'from-emerald-500 to-green-500' },
];

// ─── Quick Actions ──────────────────────────────────────────────

const STARTER_PROMPTS: readonly { label: string; prompt: string; icon: React.ReactNode }[] = [
  { label: 'What should I focus on?', prompt: 'What should I focus on right now?', icon: <Zap size={14} /> },
  { label: 'Show my progress', prompt: 'Show my progress', icon: <Trophy size={14} /> },
  { label: 'Break down a task', prompt: 'Help me break down my most important task into subtasks', icon: <Sparkles size={14} /> },
  { label: 'Schedule my day', prompt: 'Help me plan my tasks for today', icon: <Bot size={14} /> },
];

const FOLLOW_UP_SUGGESTIONS: readonly string[] = [
  'Break this down into subtasks',
  'What should I do next?',
  'Schedule these tasks for me',
  'Show my weekly insights',
];

// ─── Streaming Cursor ───────────────────────────────────────────

function StreamingCursor() {
  return (
    <span className="inline-block w-0.5 h-4 bg-unjynx-violet animate-pulse ml-0.5 align-text-bottom" />
  );
}

// ─── Code Block ─────────────────────────────────────────────────

function CodeBlock({ children, className }: { children: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  const language = className?.replace('language-', '') ?? '';

  const handleCopy = () => {
    navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group rounded-xl overflow-hidden my-3">
      <div className="flex items-center justify-between px-4 py-2 bg-[#1e1e2e] text-[var(--muted-foreground)] text-xs">
        <span className="font-mono">{language || 'code'}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 hover:text-white transition-colors"
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="bg-[#0d0d1a] p-4 overflow-x-auto text-sm font-mono leading-relaxed">
        <code>{children}</code>
      </pre>
    </div>
  );
}

// ─── Markdown Renderer ──────────────────────────────────────────

function AiMarkdown({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        // Code blocks
        code({ className, children, ...props }) {
          const isBlock = className?.startsWith('language-');
          if (isBlock) {
            return <CodeBlock className={className}>{String(children).replace(/\n$/, '')}</CodeBlock>;
          }
          return (
            <code className="px-1.5 py-0.5 rounded-md bg-unjynx-violet/10 text-unjynx-violet text-[13px] font-mono" {...props}>
              {children}
            </code>
          );
        },
        // Paragraphs
        p({ children }) {
          return <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>;
        },
        // Lists
        ul({ children }) {
          return <ul className="list-disc list-inside mb-2 space-y-1 ml-1">{children}</ul>;
        },
        ol({ children }) {
          return <ol className="list-decimal list-inside mb-2 space-y-1 ml-1">{children}</ol>;
        },
        li({ children }) {
          return <li className="leading-relaxed">{children}</li>;
        },
        // Headings
        h1({ children }) {
          return <h1 className="text-lg font-bold font-outfit mb-2 mt-3">{children}</h1>;
        },
        h2({ children }) {
          return <h2 className="text-base font-bold font-outfit mb-2 mt-3">{children}</h2>;
        },
        h3({ children }) {
          return <h3 className="text-sm font-bold font-outfit mb-1.5 mt-2">{children}</h3>;
        },
        // Bold & italic
        strong({ children }) {
          return <strong className="font-semibold text-[var(--foreground)]">{children}</strong>;
        },
        // Links
        a({ children, href }) {
          return (
            <a href={href} target="_blank" rel="noopener noreferrer" className="text-unjynx-violet hover:underline">
              {children}
            </a>
          );
        },
        // Tables
        table({ children }) {
          return (
            <div className="overflow-x-auto my-3">
              <table className="w-full text-sm border-collapse">{children}</table>
            </div>
          );
        },
        th({ children }) {
          return <th className="border border-[var(--border)] px-3 py-1.5 bg-[var(--background-surface)] text-left font-medium">{children}</th>;
        },
        td({ children }) {
          return <td className="border border-[var(--border)] px-3 py-1.5">{children}</td>;
        },
        // Blockquotes
        blockquote({ children }) {
          return <blockquote className="border-l-3 border-unjynx-violet/40 pl-3 my-2 text-[var(--muted-foreground)] italic">{children}</blockquote>;
        },
        // Horizontal rule
        hr() {
          return <hr className="border-[var(--border)] my-3" />;
        },
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

// ─── Message Component ──────────────────────────────────────────

interface MessageProps {
  readonly message: AiChatMessage;
  readonly isStreaming?: boolean;
  readonly onRegenerate?: () => void;
}

function Message({ message, isStreaming, onRegenerate }: MessageProps) {
  const isUser = message.role === 'user';
  const [feedbackGiven, setFeedbackGiven] = useState<'up' | 'down' | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={cn('group animate-slide-up', isUser ? 'flex justify-end' : '')}>
      <div className={cn('flex gap-3', isUser ? 'flex-row-reverse max-w-[80%]' : 'max-w-[90%]')}>
        {/* Avatar */}
        <div
          className={cn(
            'w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5',
            isUser
              ? 'bg-gradient-to-br from-unjynx-gold to-unjynx-gold-rich'
              : 'bg-gradient-to-br from-unjynx-violet to-unjynx-lavender',
          )}
        >
          {isUser ? (
            <User size={13} className="text-unjynx-midnight" />
          ) : (
            <Sparkles size={13} className="text-white" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Name + time */}
          <div className={cn('flex items-center gap-2 mb-1', isUser && 'flex-row-reverse')}>
            <span className="text-xs font-medium text-[var(--foreground)]">
              {isUser ? 'You' : 'UNJYNX AI'}
            </span>
            <span className="text-[10px] text-[var(--muted-foreground)]">
              {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            {!isUser && message.source && message.source !== 'streaming' && (
              <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4">
                {message.source === 'layer1_intent' ? 'Instant' : message.source === 'layer2_cache' ? 'Cached' : 'AI'}
              </Badge>
            )}
          </div>

          {/* Message body */}
          <div
            className={cn(
              'rounded-2xl text-sm',
              isUser
                ? 'bg-unjynx-gold/12 px-4 py-3 rounded-tr-md text-[var(--foreground)]'
                : 'text-[var(--foreground)]',
            )}
          >
            {isUser ? (
              <p className="whitespace-pre-wrap">{message.content}</p>
            ) : (
              <div className="prose-sm">
                <AiMarkdown content={message.content} />
                {isStreaming && <StreamingCursor />}
              </div>
            )}
          </div>

          {/* Action bar (AI messages only) */}
          {!isUser && !isStreaming && message.content && (
            <div className="flex items-center gap-1 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={handleCopy}
                className="p-1 rounded hover:bg-[var(--background-surface)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                title="Copy"
              >
                {copied ? <Check size={13} /> : <Copy size={13} />}
              </button>
              <button
                onClick={() => setFeedbackGiven('up')}
                className={cn(
                  'p-1 rounded hover:bg-[var(--background-surface)] transition-colors',
                  feedbackGiven === 'up' ? 'text-emerald-400' : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]',
                )}
                title="Good response"
              >
                <ThumbsUp size={13} />
              </button>
              <button
                onClick={() => setFeedbackGiven('down')}
                className={cn(
                  'p-1 rounded hover:bg-[var(--background-surface)] transition-colors',
                  feedbackGiven === 'down' ? 'text-rose-400' : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]',
                )}
                title="Poor response"
              >
                <ThumbsDown size={13} />
              </button>
              {onRegenerate && (
                <button
                  onClick={onRegenerate}
                  className="p-1 rounded hover:bg-[var(--background-surface)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                  title="Regenerate"
                >
                  <RotateCcw size={13} />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Typing Indicator ───────────────────────────────────────────

function TypingIndicator() {
  return (
    <div className="flex items-center gap-3 animate-fade-in">
      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-unjynx-violet to-unjynx-lavender flex items-center justify-center">
        <Sparkles size={13} className="text-white" />
      </div>
      <div className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-[var(--background-surface)] border border-[var(--border)]">
        <span className="w-1.5 h-1.5 rounded-full bg-unjynx-violet animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-1.5 h-1.5 rounded-full bg-unjynx-violet animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-1.5 h-1.5 rounded-full bg-unjynx-violet animate-bounce" style={{ animationDelay: '300ms' }} />
        <span className="text-xs text-[var(--muted-foreground)] ml-1">Thinking...</span>
      </div>
    </div>
  );
}

// ─── Empty State ────────────────────────────────────────────────

function EmptyState({ onPrompt }: { onPrompt: (p: string) => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-4 animate-fade-in">
      {/* Animated gradient orb */}
      <div className="relative w-20 h-20 mb-6">
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-unjynx-violet/30 to-unjynx-gold/30 animate-pulse" />
        <div className="absolute inset-2 rounded-full bg-gradient-to-br from-unjynx-violet/20 to-transparent backdrop-blur-sm" />
        <div className="absolute inset-0 flex items-center justify-center">
          <Sparkles size={32} className="text-unjynx-violet" />
        </div>
      </div>

      <h2 className="font-outfit font-bold text-xl text-[var(--foreground)] mb-2">
        Hey! What can I help with?
      </h2>
      <p className="text-sm text-[var(--muted-foreground)] mb-8 max-w-md">
        I can manage your tasks, analyze your productivity, schedule your day, and break down complex projects. Just ask!
      </p>

      {/* Starter prompt cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-w-lg w-full">
        {STARTER_PROMPTS.map((item) => (
          <button
            key={item.label}
            onClick={() => onPrompt(item.prompt)}
            className="flex items-center gap-3 px-4 py-3 rounded-xl border border-[var(--border)] text-left text-sm hover:bg-[var(--background-surface)] hover:border-unjynx-violet/30 transition-all group"
          >
            <div className="w-8 h-8 rounded-lg bg-unjynx-violet/10 flex items-center justify-center flex-shrink-0 group-hover:bg-unjynx-violet/20 transition-colors">
              {item.icon}
            </div>
            <span className="text-[var(--foreground-secondary)] group-hover:text-[var(--foreground)] transition-colors">
              {item.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── AI Chat Page ───────────────────────────────────────────────

export default function AiChatPage() {
  // State
  const [messages, setMessages] = useState<AiChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [activePersona, setActivePersona] = useState<Persona>('default');
  const [isStreaming, setIsStreaming] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // AI usage
  const { data: usage } = useQuery({
    queryKey: ['ai', 'usage'],
    queryFn: getAiUsage,
    staleTime: 60_000,
  });

  // Auto-scroll
  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  }, []);

  useEffect(() => {
    if (!showScrollButton) scrollToBottom();
  }, [messages, showScrollButton, scrollToBottom]);

  // Detect manual scroll-up
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      setShowScrollButton(scrollHeight - scrollTop - clientHeight > 100);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = inputRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`;
  }, [input]);

  // ─── Send Message ────────────────────────────────────────────

  const handleSend = useCallback(async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || isStreaming) return;

    setInput('');

    // Add user message
    const userMsg: AiChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);

    // Build conversation history for context
    const history = messages
      .slice(-10)
      .map((m) => ({ role: m.role, content: m.content }));

    // First try the pipeline (non-streaming) for instant responses
    try {
      const pipelineResult = await queryAi(content, {
        persona: activePersona,
        conversationHistory: history,
      });

      // If resolved by Layer 1 (intent) or Layer 2 (cache), show instantly
      if (pipelineResult.source !== 'layer5_llm') {
        const aiMsg: AiChatMessage = {
          id: `ai-${Date.now()}`,
          role: 'assistant',
          content: pipelineResult.response,
          source: pipelineResult.source,
          model: pipelineResult.model,
          tokensUsed: pipelineResult.tokensUsed,
          createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, aiMsg]);
        return;
      }
    } catch {
      // Pipeline failed or returned LLM — fall through to streaming
    }

    // Stream from Claude
    setIsStreaming(true);
    const streamingId = `ai-${Date.now()}`;

    // Add empty AI message that will be filled by streaming
    const streamMsg: AiChatMessage = {
      id: streamingId,
      role: 'assistant',
      content: '',
      source: 'streaming',
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, streamMsg]);

    abortRef.current = streamChat({
      messages: [...history, { role: 'user' as const, content }],
      persona: activePersona,
      onChunk: (chunk) => {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === streamingId
              ? { ...m, content: m.content + chunk }
              : m,
          ),
        );
      },
      onDone: (usageData) => {
        setIsStreaming(false);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === streamingId
              ? { ...m, source: 'layer5_llm' as const, model: usageData?.model, tokensUsed: usageData?.tokensUsed }
              : m,
          ),
        );
        abortRef.current = null;
      },
      onError: (error) => {
        setIsStreaming(false);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === streamingId
              ? { ...m, content: `Sorry, something went wrong: ${error}`, source: 'layer5_llm' as const }
              : m,
          ),
        );
        abortRef.current = null;
      },
    });
  }, [input, isStreaming, messages, activePersona]);

  // Stop streaming
  const handleStop = useCallback(() => {
    abortRef.current?.abort();
    setIsStreaming(false);
    abortRef.current = null;
  }, []);

  // Regenerate last response
  const handleRegenerate = useCallback(() => {
    const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
    if (lastUserMsg) {
      // Remove last AI message
      setMessages((prev) => prev.slice(0, -1));
      handleSend(lastUserMsg.content);
    }
  }, [messages, handleSend]);

  // Follow-up suggestion
  const handleFollowUp = useCallback((suggestion: string) => {
    handleSend(suggestion);
  }, [handleSend]);

  const lastMessage = messages[messages.length - 1];
  const showFollowUps = lastMessage?.role === 'assistant' && !isStreaming && messages.length > 0;

  return (
    <div className="flex flex-col h-[calc(100vh-7.5rem)] animate-fade-in">
      {/* ─── Header ──────────────────────────────────────────── */}
      <div className="flex-shrink-0 pb-3 border-b border-[var(--border)]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-unjynx-violet to-unjynx-gold flex items-center justify-center shadow-lg shadow-unjynx-violet/20">
              <Sparkles size={18} className="text-white" />
            </div>
            <div>
              <h1 className="font-outfit text-lg font-bold text-[var(--foreground)]">AI Chat</h1>
              <p className="text-[10px] text-[var(--muted-foreground)]">
                Powered by Claude {usage ? `| ${usage.dailyLimit - 0}/${usage.dailyLimit} calls left` : ''}
              </p>
            </div>
          </div>

          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMessages([])}
              className="text-xs text-[var(--muted-foreground)]"
            >
              <X size={14} className="mr-1" />
              Clear
            </Button>
          )}
        </div>

        {/* Persona selector */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {PERSONAS.map((p) => (
            <button
              key={p.id}
              onClick={() => setActivePersona(p.id)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all',
                activePersona === p.id
                  ? `bg-gradient-to-r ${p.color} text-white shadow-md`
                  : 'bg-[var(--background-surface)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] border border-[var(--border)] hover:border-unjynx-violet/30',
              )}
              title={p.description}
            >
              {p.icon}
              <span className="hidden sm:inline">{p.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ─── Messages ────────────────────────────────────────── */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto py-4 space-y-5 min-h-0 relative scroll-smooth"
      >
        {messages.length === 0 ? (
          <EmptyState onPrompt={(p) => handleSend(p)} />
        ) : (
          <>
            {messages.map((msg, i) => (
              <Message
                key={msg.id}
                message={msg}
                isStreaming={isStreaming && i === messages.length - 1 && msg.role === 'assistant'}
                onRegenerate={
                  !isStreaming && msg.role === 'assistant' && i === messages.length - 1
                    ? handleRegenerate
                    : undefined
                }
              />
            ))}

            {/* Follow-up suggestions */}
            {showFollowUps && (
              <div className="flex flex-wrap gap-2 pl-10 animate-fade-in">
                {FOLLOW_UP_SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => handleFollowUp(s)}
                    className="px-3 py-1.5 rounded-full text-xs border border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:border-unjynx-violet/30 hover:bg-unjynx-violet/5 transition-all"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            <div ref={messagesEndRef} />
          </>
        )}

        {/* Scroll to bottom FAB */}
        {showScrollButton && (
          <button
            onClick={() => scrollToBottom()}
            className="sticky bottom-2 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-unjynx-violet text-white shadow-lg flex items-center justify-center hover:bg-unjynx-violet/90 transition-colors z-10"
          >
            <ArrowDown size={16} />
          </button>
        )}
      </div>

      {/* ─── Input Area ──────────────────────────────────────── */}
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
              placeholder="Ask anything... (tasks, scheduling, insights, or just chat)"
              rows={1}
              disabled={isStreaming}
              className="w-full px-4 py-3 pr-12 rounded-xl bg-[var(--background-surface)] border border-[var(--border)] text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] outline-none resize-none focus:border-unjynx-violet/50 focus:ring-2 focus:ring-unjynx-violet/10 transition-all disabled:opacity-50"
              style={{ minHeight: '48px', maxHeight: '160px' }}
            />
          </div>
          {isStreaming ? (
            <Button variant="destructive" size="icon" onClick={handleStop} className="flex-shrink-0">
              <X size={18} />
            </Button>
          ) : (
            <Button
              variant="default"
              size="icon"
              onClick={() => handleSend()}
              disabled={!input.trim()}
              className="flex-shrink-0 bg-gradient-to-r from-unjynx-violet to-unjynx-lavender hover:opacity-90 transition-opacity"
            >
              <Send size={18} />
            </Button>
          )}
        </div>
        <p className="text-[10px] text-[var(--muted-foreground)] mt-1.5 text-center">
          Enter to send · Shift+Enter for newline · Tasks detected automatically
        </p>
      </div>
    </div>
  );
}
