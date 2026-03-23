// ---------------------------------------------------------------------------
// UnjynxEmptyState - Empty state with branding
// ---------------------------------------------------------------------------

import { cn } from '@/lib/utils/cn';

interface EmptyStateProps {
  readonly icon?: React.ReactNode;
  readonly title: string;
  readonly description: string;
  readonly action?: React.ReactNode;
  readonly className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 px-4 text-center', className)}>
      {/* Decorative rings */}
      <div className="relative mb-6">
        <div className="absolute inset-0 rounded-full bg-unjynx-violet/10 blur-xl scale-150" />
        <div className="relative w-20 h-20 rounded-full bg-[var(--background-elevated)] border border-[var(--border)] flex items-center justify-center">
          {icon ?? (
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-unjynx-gold"
            >
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          )}
        </div>
      </div>

      <h3 className="font-outfit text-lg font-semibold text-[var(--foreground)] mb-2">
        {title}
      </h3>
      <p className="text-sm text-[var(--foreground-secondary)] max-w-sm mb-6">
        {description}
      </p>

      {action}

      {/* UNJYNX tagline */}
      <p className="mt-8 text-xs text-[var(--muted-foreground)] font-outfit tracking-wider uppercase">
        Break the satisfactory
      </p>
    </div>
  );
}
