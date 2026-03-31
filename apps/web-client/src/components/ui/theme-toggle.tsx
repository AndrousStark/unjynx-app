'use client';

import { cn } from '@/lib/utils/cn';
import { useThemeStore } from '@/lib/store/theme-store';
import { Sun, Moon, Monitor } from 'lucide-react';

const THEME_OPTIONS = [
  { value: 'light' as const, icon: Sun, label: 'Light' },
  { value: 'dark' as const, icon: Moon, label: 'Dark' },
  { value: 'system' as const, icon: Monitor, label: 'System' },
] as const;

export function ThemeToggle({ size = 'md' }: { readonly size?: 'sm' | 'md' }) {
  const theme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);

  return (
    <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-[var(--background-surface)] border border-[var(--border)]">
      {THEME_OPTIONS.map((opt) => {
        const Icon = opt.icon;
        const isActive = theme === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => setTheme(opt.value)}
            className={cn(
              'flex items-center gap-1.5 rounded-md transition-all duration-200',
              size === 'sm' ? 'px-2 py-1' : 'px-3 py-1.5',
              isActive
                ? 'bg-[var(--accent)] text-white shadow-sm'
                : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]',
            )}
            title={opt.label}
          >
            <Icon size={size === 'sm' ? 12 : 14} />
            <span className={cn('font-medium', size === 'sm' ? 'text-[10px]' : 'text-xs')}>
              {opt.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
