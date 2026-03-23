'use client';

import { cn } from '@/lib/utils/cn';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { formatNumber } from '@/lib/utils/format';

interface StatsCardProps {
  readonly icon: React.ReactNode;
  readonly value: number;
  readonly label: string;
  readonly delta: number;
  readonly accentClass: string;
  readonly format?: (n: number) => string;
}

export function StatsCard({ icon, value, label, delta, accentClass, format: fmt }: StatsCardProps) {
  const displayValue = fmt ? fmt(value) : formatNumber(value);
  const isPositive = delta > 0;
  const isNeutral = delta === 0;

  return (
    <div className="glass-card p-4 group hover:shadow-unjynx-card-dark transition-all duration-200 hover:-translate-y-0.5">
      <div className="flex items-start justify-between mb-3">
        <div className={cn('p-2 rounded-lg', accentClass)}>
          {icon}
        </div>
        <div className="flex items-center gap-1">
          {isNeutral ? (
            <Minus size={14} className="text-[var(--muted-foreground)]" />
          ) : isPositive ? (
            <TrendingUp size={14} className="text-unjynx-emerald" />
          ) : (
            <TrendingDown size={14} className="text-unjynx-rose" />
          )}
          <span
            className={cn(
              'text-xs font-medium',
              isNeutral
                ? 'text-[var(--muted-foreground)]'
                : isPositive
                  ? 'text-unjynx-emerald'
                  : 'text-unjynx-rose',
            )}
          >
            {isPositive && '+'}{delta}%
          </span>
        </div>
      </div>
      <p className="font-bebas text-3xl leading-none text-[var(--foreground)] tracking-wider">
        {displayValue}
      </p>
      <p className="text-xs text-[var(--muted-foreground)] mt-1 font-medium">{label}</p>
    </div>
  );
}
