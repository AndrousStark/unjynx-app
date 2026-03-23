// ---------------------------------------------------------------------------
// UnjynxShimmer - Loading skeleton with purple-tinted shimmer effect
// ---------------------------------------------------------------------------

import { cn } from '@/lib/utils/cn';

interface ShimmerProps {
  readonly className?: string;
  readonly variant?: 'line' | 'circle' | 'card' | 'stat';
}

export function Shimmer({ className, variant = 'line' }: ShimmerProps) {
  const baseClasses =
    'relative overflow-hidden bg-[var(--background-elevated)] rounded-lg before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-gradient-to-r before:from-transparent before:via-[var(--border)] before:to-transparent';

  const variants: Record<string, string> = {
    line: 'h-4 w-full',
    circle: 'h-10 w-10 rounded-full',
    card: 'h-32 w-full',
    stat: 'h-24 w-full',
  };

  return <div className={cn(baseClasses, variants[variant], className)} />;
}

export function ShimmerGroup({ count = 3, className }: { readonly count?: number; readonly className?: string }) {
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: count }, (_, i) => (
        <Shimmer key={i} className={i === 0 ? 'w-3/4' : i === count - 1 ? 'w-1/2' : 'w-full'} />
      ))}
    </div>
  );
}

export function StatsShimmer() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }, (_, i) => (
        <Shimmer key={i} variant="stat" />
      ))}
    </div>
  );
}

export function TaskListShimmer() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="flex items-center gap-3 p-3">
          <Shimmer variant="circle" className="h-5 w-5 flex-shrink-0" />
          <Shimmer className={cn('h-4', i % 2 === 0 ? 'w-2/3' : 'w-1/2')} />
          <Shimmer className="h-4 w-16 ml-auto" />
        </div>
      ))}
    </div>
  );
}

export function BoardShimmer() {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {Array.from({ length: 4 }, (_, col) => (
        <div key={col} className="min-w-[280px] space-y-3">
          <Shimmer className="h-8 w-24" />
          {Array.from({ length: 3 - col }, (_, row) => (
            <Shimmer key={row} variant="card" className="h-28" />
          ))}
        </div>
      ))}
    </div>
  );
}
