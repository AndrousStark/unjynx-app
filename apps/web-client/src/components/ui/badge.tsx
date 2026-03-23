// ---------------------------------------------------------------------------
// Badge - shadcn/ui-style with UNJYNX priority colors
// ---------------------------------------------------------------------------

import { type HTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';

// ---------------------------------------------------------------------------
// Variants
// ---------------------------------------------------------------------------

const badgeVariants = cva(
  'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium font-dm-sans transition-colors',
  {
    variants: {
      variant: {
        default:
          'border border-[var(--border)] bg-[var(--background-elevated)] text-[var(--foreground)]',
        primary:
          'bg-unjynx-violet/15 text-unjynx-violet border border-unjynx-violet/20',
        success:
          'bg-unjynx-emerald/15 text-unjynx-emerald border border-unjynx-emerald/20',
        warning:
          'bg-unjynx-amber/15 text-unjynx-amber border border-unjynx-amber/20',
        destructive:
          'bg-unjynx-rose/15 text-unjynx-rose border border-unjynx-rose/20',
        gold:
          'bg-unjynx-gold/15 text-unjynx-gold border border-unjynx-gold/20',
        outline:
          'border border-[var(--border)] text-[var(--foreground-secondary)]',
        // Priority-specific
        'priority-urgent':
          'bg-unjynx-rose/15 text-unjynx-rose border border-unjynx-rose/20',
        'priority-high':
          'bg-unjynx-amber/15 text-unjynx-amber border border-unjynx-amber/20',
        'priority-medium':
          'bg-unjynx-gold/15 text-unjynx-gold border border-unjynx-gold/20',
        'priority-low':
          'bg-unjynx-emerald/15 text-unjynx-emerald border border-unjynx-emerald/20',
        'priority-none':
          'bg-[var(--background-elevated)] text-[var(--muted-foreground)] border border-[var(--border)]',
      },
      size: {
        default: 'px-2 py-0.5 text-xs',
        sm: 'px-1.5 py-0 text-[10px]',
        lg: 'px-3 py-1 text-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export interface BadgeProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  readonly dot?: boolean;
}

function Badge({ className, variant, size, dot, children, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props}>
      {dot ? (
        <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-current" />
      ) : null}
      {children}
    </div>
  );
}

export { Badge, badgeVariants };
