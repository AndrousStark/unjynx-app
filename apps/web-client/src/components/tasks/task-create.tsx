'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useCreateTask } from '@/lib/hooks/use-tasks';
import { cn } from '@/lib/utils/cn';
import { Button } from '@/components/ui/button';
import {
  X,
  Calendar,
  Flag,
  FolderOpen,
  Sparkles,
  Hash,
} from 'lucide-react';
import type { Task, CreateTaskPayload } from '@/lib/api/tasks';

interface TaskCreateModalProps {
  readonly open: boolean;
  readonly onClose: () => void;
}

// ─── NLP Hint ───────────────────────────────────────────────────

function parseNlpHints(input: string): { dateHint: string | null; priorityHint: Task['priority'] | null } {
  let dateHint: string | null = null;
  let priorityHint: Task['priority'] | null = null;

  if (/\btomorrow\b/i.test(input)) dateHint = 'Tomorrow';
  else if (/\btoday\b/i.test(input)) dateHint = 'Today';
  else if (/\bnext week\b/i.test(input)) dateHint = 'Next week';
  else if (/\bmonday\b/i.test(input)) dateHint = 'Monday';
  else if (/\bfriday\b/i.test(input)) dateHint = 'Friday';

  if (/\burgent\b|!{3}/i.test(input)) priorityHint = 'urgent';
  else if (/\bhigh\b|!{2}/i.test(input)) priorityHint = 'high';
  else if (/\bmedium\b|!{1}(?!!)/i.test(input)) priorityHint = 'medium';
  else if (/\blow\b/i.test(input)) priorityHint = 'low';

  return { dateHint, priorityHint };
}

// ─── Priority Button ────────────────────────────────────────────

const PRIORITIES: readonly { value: Task['priority']; label: string; color: string }[] = [
  { value: 'none', label: 'None', color: '#9B8BB8' },
  { value: 'low', label: 'Low', color: '#00C896' },
  { value: 'medium', label: 'Medium', color: '#FFD700' },
  { value: 'high', label: 'High', color: '#FF9F1C' },
  { value: 'urgent', label: 'Urgent', color: '#FF6B8A' },
];

// ─── Component ──────────────────────────────────────────────────

export function TaskCreateModal({ open, onClose }: TaskCreateModalProps) {
  const createMutation = useCreateTask();
  const inputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Task['priority']>('none');
  const [dueDate, setDueDate] = useState('');
  const [showDetails, setShowDetails] = useState(false);

  const hints = parseNlpHints(title);

  // Focus input on open
  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  // Reset on close
  const handleClose = useCallback(() => {
    setTitle('');
    setDescription('');
    setPriority('none');
    setDueDate('');
    setShowDetails(false);
    onClose();
  }, [onClose]);

  // Escape to close
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') handleClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, handleClose]);

  function handleSubmit() {
    const trimmed = title.trim();
    if (!trimmed) return;

    const payload: CreateTaskPayload = {
      title: trimmed,
      description: description.trim() || undefined,
      priority: priority !== 'none' ? priority : undefined,
      dueDate: dueDate || undefined,
    };

    createMutation.mutate(payload, {
      onSuccess: () => handleClose(),
    });
  }

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={handleClose} />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4">
        <div
          className="w-full max-w-lg bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-unjynx-panel animate-scale-in"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
            <h2 className="font-outfit font-semibold text-[var(--foreground)]">New Task</h2>
            <button
              onClick={handleClose}
              className="p-1 rounded-lg hover:bg-[var(--background-surface)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="p-4 space-y-3">
            {/* Title input */}
            <div>
              <input
                ref={inputRef}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
                placeholder="What needs to be done?"
                className="w-full text-[var(--foreground)] bg-transparent text-base font-medium outline-none placeholder:text-[var(--muted-foreground)]"
              />

              {/* NLP hints */}
              {(hints.dateHint || hints.priorityHint) && (
                <div className="flex items-center gap-2 mt-2">
                  <Sparkles size={12} className="text-unjynx-gold" />
                  <span className="text-xs text-[var(--muted-foreground)]">
                    {hints.dateHint && `Due: ${hints.dateHint}`}
                    {hints.dateHint && hints.priorityHint && ' | '}
                    {hints.priorityHint && `Priority: ${hints.priorityHint}`}
                  </span>
                </div>
              )}
            </div>

            {/* Description */}
            {showDetails && (
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add a description..."
                className="w-full text-sm text-[var(--foreground)] bg-[var(--background-surface)] rounded-lg p-3 outline-none resize-y min-h-[60px] placeholder:text-[var(--muted-foreground)] border border-[var(--border)]"
                rows={2}
              />
            )}

            {/* Quick actions row */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Due date */}
              <div className="relative">
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <button className={cn(
                  'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs transition-colors',
                  dueDate
                    ? 'border-unjynx-violet/50 text-unjynx-violet bg-unjynx-violet/10'
                    : 'border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--background-surface)]',
                )}>
                  <Calendar size={14} />
                  {dueDate || 'Due date'}
                </button>
              </div>

              {/* Priority */}
              <div className="flex items-center gap-1">
                {PRIORITIES.map((p) => (
                  <button
                    key={p.value}
                    onClick={() => setPriority(p.value)}
                    className={cn(
                      'w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all',
                      priority === p.value
                        ? 'scale-110 shadow-sm'
                        : 'opacity-50 hover:opacity-100',
                    )}
                    style={{
                      borderColor: p.color,
                      backgroundColor: priority === p.value ? p.color + '30' : 'transparent',
                    }}
                    title={p.label}
                  >
                    {priority === p.value && (
                      <Flag size={10} style={{ color: p.color }} />
                    )}
                  </button>
                ))}
              </div>

              {/* More details toggle */}
              {!showDetails && (
                <button
                  onClick={() => setShowDetails(true)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[var(--border)] text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--background-surface)] transition-colors"
                >
                  <Hash size={14} />
                  More
                </button>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-[var(--border)]">
            <Button variant="ghost" size="sm" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleSubmit}
              disabled={!title.trim()}
              isLoading={createMutation.isPending}
            >
              Create Task
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
