'use client';

import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { decomposeTask } from '@/lib/api/ai';
import { createTask } from '@/lib/api/tasks';
import { cn } from '@/lib/utils/cn';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sparkles,
  ArrowLeft,
  Loader2,
  Check,
  X,
  Pencil,
  Clock,
  AlertCircle,
  Plus,
  Layers,
} from 'lucide-react';
import Link from 'next/link';

// ─── Types ──────────────────────────────────────────────────────

interface Subtask {
  title: string;
  estimatedMinutes: number;
  priority: string;
  included: boolean;
}

// ─── Subtask Card ───────────────────────────────────────────────

function SubtaskCard({
  subtask,
  index,
  onToggle,
  onEdit,
}: {
  subtask: Subtask;
  index: number;
  onToggle: () => void;
  onEdit: (title: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(subtask.title);

  const handleSave = () => {
    onEdit(editValue.trim());
    setEditing(false);
  };

  const priorityColors: Record<string, string> = {
    high: 'text-rose-400 bg-rose-500/10',
    medium: 'text-amber-400 bg-amber-500/10',
    low: 'text-emerald-400 bg-emerald-500/10',
  };

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-3.5 rounded-xl border transition-all',
        subtask.included
          ? 'border-[var(--border)] bg-[var(--background-surface)]'
          : 'border-[var(--border)] opacity-40',
      )}
    >
      {/* Checkbox */}
      <button
        onClick={onToggle}
        className={cn(
          'w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors',
          subtask.included ? 'bg-unjynx-violet border-unjynx-violet' : 'border-[var(--border)]',
        )}
      >
        {subtask.included && <Check size={12} className="text-white" />}
      </button>

      <div className="flex-1 min-w-0">
        {editing ? (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              className="flex-1 px-2 py-1 rounded-md bg-[var(--background)] border border-unjynx-violet/30 text-sm text-[var(--foreground)] outline-none focus:ring-1 focus:ring-unjynx-violet/30"
              autoFocus
            />
            <Button variant="ghost" size="icon-sm" onClick={handleSave}>
              <Check size={14} />
            </Button>
            <Button variant="ghost" size="icon-sm" onClick={() => setEditing(false)}>
              <X size={14} />
            </Button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-[var(--muted-foreground)] font-mono w-5">{index + 1}.</span>
              <p className="text-sm text-[var(--foreground)]">{subtask.title}</p>
              <button
                onClick={() => {
                  setEditValue(subtask.title);
                  setEditing(true);
                }}
                className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-[var(--background)] transition-all"
              >
                <Pencil size={10} className="text-[var(--muted-foreground)]" />
              </button>
            </div>
            <div className="flex items-center gap-2 mt-1 ml-5">
              <div className="flex items-center gap-1 text-[10px] text-[var(--muted-foreground)]">
                <Clock size={10} />
                {subtask.estimatedMinutes}m
              </div>
              <Badge
                variant="outline"
                className={cn('text-[9px] px-1.5 py-0 h-4', priorityColors[subtask.priority] ?? '')}
              >
                {subtask.priority}
              </Badge>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────

export default function AiDecomposePage() {
  const queryClient = useQueryClient();
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [reasoning, setReasoning] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [created, setCreated] = useState(false);

  // Decompose mutation
  const decomposeMutation = useMutation({
    mutationFn: () => decomposeTask(taskTitle, taskDescription || undefined),
    onSuccess: (result) => {
      setSubtasks(
        result.subtasks.map((s) => ({
          title: s.title,
          estimatedMinutes: s.estimatedMinutes,
          priority: s.priority,
          included: true,
        })),
      );
      setReasoning(result.reasoning);
    },
  });

  // Handle decompose
  const handleDecompose = useCallback(() => {
    if (!taskTitle.trim()) return;
    decomposeMutation.mutate();
  }, [taskTitle, decomposeMutation]);

  // Toggle subtask inclusion
  const toggleSubtask = useCallback((index: number) => {
    setSubtasks((prev) =>
      prev.map((s, i) => (i === index ? { ...s, included: !s.included } : s)),
    );
  }, []);

  // Edit subtask title
  const editSubtask = useCallback((index: number, title: string) => {
    if (!title) return;
    setSubtasks((prev) =>
      prev.map((s, i) => (i === index ? { ...s, title } : s)),
    );
  }, []);

  // Create all included subtasks
  const handleCreateAll = useCallback(async () => {
    const included = subtasks.filter((s) => s.included);
    if (included.length === 0) return;

    setIsCreating(true);
    try {
      await Promise.allSettled(
        included.map((sub) =>
          createTask({
            title: sub.title,
            priority: sub.priority as 'high' | 'medium' | 'low',
            description: `Part of: ${taskTitle}`,
          }),
        ),
      );
      setCreated(true);
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    } catch {
      // Partial creation is OK
    } finally {
      setIsCreating(false);
    }
  }, [subtasks, taskTitle, queryClient]);

  // Reset
  const handleReset = useCallback(() => {
    setTaskTitle('');
    setTaskDescription('');
    setSubtasks([]);
    setReasoning('');
    setCreated(false);
  }, []);

  const includedCount = subtasks.filter((s) => s.included).length;
  const totalMinutes = subtasks.filter((s) => s.included).reduce((sum, s) => sum + s.estimatedMinutes, 0);

  return (
    <div className="max-w-2xl mx-auto py-6 px-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/ai" className="p-1.5 rounded-lg hover:bg-[var(--background-surface)] transition-colors">
          <ArrowLeft size={18} className="text-[var(--muted-foreground)]" />
        </Link>
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-unjynx-violet to-pink-500 flex items-center justify-center shadow-lg shadow-unjynx-violet/20">
          <Layers size={18} className="text-white" />
        </div>
        <div>
          <h1 className="font-outfit text-lg font-bold text-[var(--foreground)]">AI Task Breakdown</h1>
          <p className="text-[10px] text-[var(--muted-foreground)]">Break complex tasks into actionable steps</p>
        </div>
      </div>

      {subtasks.length === 0 && !created ? (
        /* ─── Step 1: Input ──────────────────────────────── */
        <>
          <div className="space-y-4 mb-6">
            <div>
              <label className="text-xs font-medium text-[var(--foreground)] mb-1.5 block">
                Task to break down
              </label>
              <input
                type="text"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleDecompose()}
                placeholder="e.g. Launch new marketing campaign"
                className="w-full px-4 py-3 rounded-xl bg-[var(--background-surface)] border border-[var(--border)] text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] outline-none focus:border-unjynx-violet/50 focus:ring-2 focus:ring-unjynx-violet/10 transition-all"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-[var(--foreground)] mb-1.5 block">
                Description <span className="text-[var(--muted-foreground)]">(optional)</span>
              </label>
              <textarea
                value={taskDescription}
                onChange={(e) => setTaskDescription(e.target.value)}
                placeholder="Add context to get better subtasks..."
                rows={3}
                className="w-full px-4 py-3 rounded-xl bg-[var(--background-surface)] border border-[var(--border)] text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] outline-none resize-none focus:border-unjynx-violet/50 focus:ring-2 focus:ring-unjynx-violet/10 transition-all"
              />
            </div>
          </div>

          <Button
            onClick={handleDecompose}
            disabled={!taskTitle.trim() || decomposeMutation.isPending}
            className="w-full bg-gradient-to-r from-unjynx-violet to-pink-500 hover:opacity-90 transition-opacity"
            size="lg"
          >
            {decomposeMutation.isPending ? (
              <>
                <Loader2 size={16} className="mr-2 animate-spin" />
                AI is analyzing...
              </>
            ) : (
              <>
                <Sparkles size={16} className="mr-2" />
                Break it down
              </>
            )}
          </Button>

          {decomposeMutation.isError && (
            <div className="flex items-center gap-2 mt-3 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20">
              <AlertCircle size={14} className="text-rose-400 flex-shrink-0" />
              <p className="text-xs text-rose-300">
                {decomposeMutation.error instanceof Error ? decomposeMutation.error.message : 'Failed to decompose task.'}
              </p>
            </div>
          )}

          {/* Examples */}
          <div className="mt-8">
            <p className="text-xs text-[var(--muted-foreground)] mb-3">Try these examples:</p>
            <div className="space-y-2">
              {[
                'Build a landing page for the product',
                'Prepare for the quarterly review meeting',
                'Set up CI/CD pipeline for the project',
                'Plan a birthday party',
              ].map((example) => (
                <button
                  key={example}
                  onClick={() => setTaskTitle(example)}
                  className="block w-full text-left px-3 py-2 rounded-lg text-xs text-[var(--foreground-secondary)] hover:bg-[var(--background-surface)] hover:text-[var(--foreground)] border border-transparent hover:border-[var(--border)] transition-all"
                >
                  &ldquo;{example}&rdquo;
                </button>
              ))}
            </div>
          </div>
        </>
      ) : created ? (
        /* ─── Step 3: Success ────────────────────────────── */
        <div className="text-center py-12 animate-scale-in">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
            <Check size={28} className="text-emerald-400" />
          </div>
          <h2 className="font-outfit font-bold text-lg text-[var(--foreground)] mb-2">
            {includedCount} subtasks created!
          </h2>
          <p className="text-sm text-[var(--muted-foreground)] mb-6">
            Check your task list to see them.
          </p>
          <div className="flex gap-2 justify-center">
            <Button variant="outline" onClick={handleReset}>
              Break down another
            </Button>
            <Link href="/tasks">
              <Button variant="default">View tasks</Button>
            </Link>
          </div>
        </div>
      ) : (
        /* ─── Step 2: Review Subtasks ────────────────────── */
        <>
          {/* Reasoning banner */}
          {reasoning && (
            <div className="p-4 rounded-xl bg-gradient-to-r from-unjynx-violet/10 to-pink-500/10 border border-unjynx-violet/20 mb-5">
              <div className="flex items-start gap-2">
                <Sparkles size={14} className="text-unjynx-violet mt-0.5 flex-shrink-0" />
                <p className="text-xs text-[var(--foreground)] leading-relaxed">{reasoning}</p>
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="flex items-center gap-4 mb-4">
            <h2 className="text-sm font-medium text-[var(--foreground)]">
              Subtasks
              <span className="text-[var(--muted-foreground)] ml-1">({includedCount}/{subtasks.length} selected)</span>
            </h2>
            <Badge variant="outline" className="text-[10px]">
              <Clock size={10} className="mr-1" />
              ~{totalMinutes}m total
            </Badge>
          </div>

          {/* Subtask list */}
          <div className="space-y-2 mb-6 group">
            {subtasks.map((sub, i) => (
              <SubtaskCard
                key={i}
                subtask={sub}
                index={i}
                onToggle={() => toggleSubtask(i)}
                onEdit={(title) => editSubtask(i, title)}
              />
            ))}
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleReset} className="flex-1">
              <ArrowLeft size={14} className="mr-1.5" />
              Start over
            </Button>
            <Button
              onClick={handleCreateAll}
              disabled={includedCount === 0 || isCreating}
              className="flex-1 bg-gradient-to-r from-unjynx-violet to-pink-500 hover:opacity-90"
            >
              {isCreating ? (
                <>
                  <Loader2 size={14} className="mr-1.5 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus size={14} className="mr-1.5" />
                  Create {includedCount} subtask{includedCount !== 1 ? 's' : ''}
                </>
              )}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
