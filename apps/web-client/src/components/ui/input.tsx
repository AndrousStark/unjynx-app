// ---------------------------------------------------------------------------
// Input - shadcn/ui-style with UNJYNX theme
// ---------------------------------------------------------------------------

import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils/cn';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  readonly error?: string;
  readonly icon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, icon, ...props }, ref) => {
    return (
      <div className="relative w-full">
        {icon ? (
          <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]">
            {icon}
          </div>
        ) : null}
        <input
          type={type}
          className={cn(
            'flex h-10 w-full rounded-lg border bg-[var(--background-surface)] px-3 py-2 text-sm font-dm-sans text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]',
            'border-[var(--border)] focus:border-unjynx-violet focus:outline-none focus:ring-2 focus:ring-unjynx-violet/20',
            'transition-colors duration-150',
            'file:border-0 file:bg-transparent file:text-sm file:font-medium',
            'disabled:cursor-not-allowed disabled:opacity-50',
            icon && 'pl-10',
            error && 'border-unjynx-rose focus:border-unjynx-rose focus:ring-unjynx-rose/20',
            className,
          )}
          ref={ref}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? `${props.id}-error` : undefined}
          {...props}
        />
        {error ? (
          <p
            id={`${props.id}-error`}
            className="mt-1.5 text-xs text-unjynx-rose"
            role="alert"
          >
            {error}
          </p>
        ) : null}
      </div>
    );
  },
);

Input.displayName = 'Input';

export { Input };
