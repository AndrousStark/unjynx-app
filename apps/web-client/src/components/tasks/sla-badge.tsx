'use client';

import { cn } from '@/lib/utils/cn';
import { Shield, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface SlaBadgeProps {
  /** Due date ISO string */
  readonly dueDate: string | null;
  /** Task status */
  readonly status: string;
  /** Compact mode (icon only, no text) */
  readonly compact?: boolean;
}

/**
 * SLA indicator badge based on due date proximity.
 *
 * Logic:
 *   - Completed → green check (met SLA)
 *   - Overdue → red (breached)
 *   - Due within 24h → yellow (at risk)
 *   - Due within 3 days → blue (on track)
 *   - Due later → hidden (not urgent)
 */
export function SlaBadge({ dueDate, status, compact = false }: SlaBadgeProps) {
  if (!dueDate) return null;

  const isDone = status === 'done' || status === 'completed';
  const now = Date.now();
  const due = new Date(dueDate).getTime();
  const hoursUntilDue = (due - now) / (1000 * 60 * 60);

  // Completed tasks always show green
  if (isDone) {
    if (compact) return null; // Don't clutter completed tasks
    return (
      <span className="flex items-center gap-0.5 text-[9px] text-[var(--success)]" title="SLA met">
        <CheckCircle2 size={10} />
        {!compact && 'Met'}
      </span>
    );
  }

  // Overdue
  if (hoursUntilDue < 0) {
    return (
      <span
        className={cn(
          'flex items-center gap-0.5 text-[9px] font-medium text-[var(--destructive)]',
          !compact && 'px-1.5 py-0.5 rounded bg-[var(--destructive)]/10',
        )}
        title={`Overdue by ${Math.abs(Math.round(hoursUntilDue))}h`}
      >
        <AlertTriangle size={10} />
        {!compact && 'Breached'}
      </span>
    );
  }

  // Due within 24 hours → at risk
  if (hoursUntilDue <= 24) {
    return (
      <span
        className={cn(
          'flex items-center gap-0.5 text-[9px] font-medium text-[var(--warning)]',
          !compact && 'px-1.5 py-0.5 rounded bg-[var(--warning)]/10',
        )}
        title={`Due in ${Math.round(hoursUntilDue)}h`}
      >
        <Clock size={10} />
        {!compact && `${Math.round(hoursUntilDue)}h`}
      </span>
    );
  }

  // Due within 3 days → on track but visible
  if (hoursUntilDue <= 72) {
    return (
      <span
        className="flex items-center gap-0.5 text-[9px] text-[var(--accent)]"
        title={`Due in ${Math.round(hoursUntilDue / 24)}d`}
      >
        <Shield size={10} />
        {!compact && `${Math.round(hoursUntilDue / 24)}d`}
      </span>
    );
  }

  // Due later → no indicator needed
  return null;
}
