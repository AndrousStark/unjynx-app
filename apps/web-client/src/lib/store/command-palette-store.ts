import { create } from 'zustand';

// ─── Types ───────────────────────────────────────────────────────

interface CommandPaletteState {
  readonly isOpen: boolean;
}

interface CommandPaletteActions {
  readonly open: () => void;
  readonly close: () => void;
  readonly toggle: () => void;
}

// ─── Store ───────────────────────────────────────────────────────

export const useCommandPaletteStore = create<CommandPaletteState & CommandPaletteActions>()(
  (set) => ({
    isOpen: false,

    open: () => set(() => ({ isOpen: true })),
    close: () => set(() => ({ isOpen: false })),
    toggle: () => set((state) => ({ isOpen: !state.isOpen })),
  }),
);
