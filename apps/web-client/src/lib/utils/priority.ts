// ---------------------------------------------------------------------------
// Priority color helpers (mirrors Flutter's unjynxPriorityColor)
// ---------------------------------------------------------------------------

import type { Task } from '@/lib/api/tasks';

type Priority = Task['priority'];

const PRIORITY_COLORS: Record<Priority, string> = {
  urgent: '#FF6B8A',
  high: '#FF9F1C',
  medium: '#FFD700',
  low: '#00C896',
  none: '#9B8BB8',
} as const;

const PRIORITY_BG: Record<Priority, string> = {
  urgent: 'bg-unjynx-rose/20',
  high: 'bg-unjynx-amber/20',
  medium: 'bg-unjynx-gold/20',
  low: 'bg-unjynx-emerald/20',
  none: 'bg-[var(--muted)]',
} as const;

const PRIORITY_TEXT: Record<Priority, string> = {
  urgent: 'text-unjynx-rose',
  high: 'text-unjynx-amber',
  medium: 'text-unjynx-gold',
  low: 'text-unjynx-emerald',
  none: 'text-[var(--muted-foreground)]',
} as const;

const PRIORITY_BORDER: Record<Priority, string> = {
  urgent: 'border-unjynx-rose/40',
  high: 'border-unjynx-amber/40',
  medium: 'border-unjynx-gold/40',
  low: 'border-unjynx-emerald/40',
  none: 'border-[var(--border)]',
} as const;

const PRIORITY_LABELS: Record<Priority, string> = {
  urgent: 'Urgent',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
  none: 'None',
} as const;

export function priorityColor(priority: Priority): string {
  return PRIORITY_COLORS[priority];
}

export function priorityBg(priority: Priority): string {
  return PRIORITY_BG[priority];
}

export function priorityText(priority: Priority): string {
  return PRIORITY_TEXT[priority];
}

export function priorityBorder(priority: Priority): string {
  return PRIORITY_BORDER[priority];
}

export function priorityLabel(priority: Priority): string {
  return PRIORITY_LABELS[priority];
}
