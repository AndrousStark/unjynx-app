'use client';

import { cn } from '@/lib/utils/cn';
import { Zap, BookOpen, CheckSquare, Bug, Layers, TrendingUp } from 'lucide-react';

const TYPE_CONFIG: Record<string, { icon: React.ElementType; color: string; bg: string; label: string }> = {
  epic: { icon: Zap, color: 'text-purple-400', bg: 'bg-purple-500/10', label: 'Epic' },
  story: { icon: BookOpen, color: 'text-green-400', bg: 'bg-green-500/10', label: 'Story' },
  task: { icon: CheckSquare, color: 'text-blue-400', bg: 'bg-blue-500/10', label: 'Task' },
  bug: { icon: Bug, color: 'text-red-400', bg: 'bg-red-500/10', label: 'Bug' },
  subtask: { icon: Layers, color: 'text-gray-400', bg: 'bg-gray-500/10', label: 'Subtask' },
  improvement: { icon: TrendingUp, color: 'text-cyan-400', bg: 'bg-cyan-500/10', label: 'Improvement' },
};

interface TaskTypeBadgeProps {
  readonly type: string;
  readonly size?: 'xs' | 'sm' | 'md';
  readonly showLabel?: boolean;
}

export function TaskTypeBadge({ type, size = 'sm', showLabel = false }: TaskTypeBadgeProps) {
  const config = TYPE_CONFIG[type] ?? TYPE_CONFIG.task;
  const Icon = config.icon;

  const iconSize = size === 'xs' ? 10 : size === 'sm' ? 12 : 14;

  return (
    <div
      className={cn(
        'flex items-center gap-1 rounded',
        config.color,
        showLabel && cn(config.bg, 'px-1.5 py-0.5'),
      )}
      title={config.label}
    >
      <Icon size={iconSize} />
      {showLabel && (
        <span className={cn('font-medium', size === 'xs' ? 'text-[9px]' : 'text-[10px]')}>
          {config.label}
        </span>
      )}
    </div>
  );
}

/** Issue key badge (e.g., UNJX-42) */
export function IssueKeyBadge({ issueKey }: { readonly issueKey: string }) {
  return (
    <span className="text-[10px] font-mono text-[var(--muted-foreground)] bg-[var(--background-surface)] px-1.5 py-0.5 rounded">
      {issueKey}
    </span>
  );
}
