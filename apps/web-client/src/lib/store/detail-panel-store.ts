import { create } from 'zustand';

// ─── Types ───────────────────────────────────────────────────────

interface DetailPanelState {
  readonly isOpen: boolean;
  readonly contentId: string | null;
  readonly contentType: 'task' | 'project' | 'channel' | null;
}

interface DetailPanelActions {
  readonly openPanel: (contentType: DetailPanelState['contentType'], contentId: string) => void;
  readonly closePanel: () => void;
}

// ─── Store ───────────────────────────────────────────────────────

export const useDetailPanelStore = create<DetailPanelState & DetailPanelActions>()(
  (set) => ({
    isOpen: false,
    contentId: null,
    contentType: null,

    openPanel: (contentType, contentId) =>
      set(() => ({ isOpen: true, contentType, contentId })),

    closePanel: () =>
      set(() => ({ isOpen: false, contentId: null, contentType: null })),
  }),
);
