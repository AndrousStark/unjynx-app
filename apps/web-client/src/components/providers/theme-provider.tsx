'use client';

import { useEffect } from 'react';
import { useThemeStore } from '@/lib/store/theme-store';

export function ThemeProvider({ children }: { readonly children: React.ReactNode }) {
  const theme = useThemeStore((s) => s.theme);

  useEffect(() => {
    const root = document.documentElement;

    if (theme === 'system') {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.toggle('dark', isDark);
      root.classList.toggle('light', !isDark);

      const handler = (e: MediaQueryListEvent) => {
        root.classList.toggle('dark', e.matches);
        root.classList.toggle('light', !e.matches);
      };

      const mql = window.matchMedia('(prefers-color-scheme: dark)');
      mql.addEventListener('change', handler);
      return () => mql.removeEventListener('change', handler);
    }

    root.classList.toggle('dark', theme === 'dark');
    root.classList.toggle('light', theme === 'light');
  }, [theme]);

  return <>{children}</>;
}
