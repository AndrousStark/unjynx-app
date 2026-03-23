import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ─── Types ───────────────────────────────────────────────────────

type Theme = 'light' | 'dark' | 'system';

interface ThemeState {
  readonly theme: Theme;
}

interface ThemeActions {
  readonly setTheme: (theme: Theme) => void;
  readonly toggleTheme: () => void;
}

// ─── Store ───────────────────────────────────────────────────────

export const useThemeStore = create<ThemeState & ThemeActions>()(
  persist(
    (set) => ({
      theme: 'dark',

      setTheme: (theme: Theme) => set(() => ({ theme })),

      toggleTheme: () =>
        set((state) => ({
          theme: state.theme === 'dark' ? 'light' : 'dark',
        })),
    }),
    { name: 'unjynx-theme' },
  ),
);
