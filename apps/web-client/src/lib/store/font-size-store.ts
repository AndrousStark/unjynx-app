import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type FontSize = 'small' | 'default' | 'large';

interface FontSizeState {
  readonly fontSize: FontSize;
}

interface FontSizeActions {
  readonly setFontSize: (size: FontSize) => void;
}

// ---------------------------------------------------------------------------
// CSS variable mapping
// ---------------------------------------------------------------------------

const FONT_SIZE_MAP: Record<FontSize, string> = {
  small: '14px',
  default: '16px',
  large: '18px',
} as const;

function applyFontSize(size: FontSize): void {
  if (typeof document === 'undefined') return;
  document.documentElement.style.fontSize = FONT_SIZE_MAP[size];
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useFontSizeStore = create<FontSizeState & FontSizeActions>()(
  persist(
    (set) => ({
      fontSize: 'default',

      setFontSize: (fontSize: FontSize) => {
        applyFontSize(fontSize);
        set(() => ({ fontSize }));
      },
    }),
    {
      name: 'unjynx-font-size',
      onRehydrateStorage: () => (state) => {
        if (state) {
          applyFontSize(state.fontSize);
        }
      },
    },
  ),
);
