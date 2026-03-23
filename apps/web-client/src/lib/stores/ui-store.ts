// ---------------------------------------------------------------------------
// UI Store (Zustand)
// ---------------------------------------------------------------------------
// Global UI state: sidebar, detail panel, theme, command palette, etc.
// ---------------------------------------------------------------------------

import { create } from 'zustand';

export type ViewType = 'list' | 'board' | 'calendar' | 'timeline' | 'table';

interface UiState {
  // Sidebar
  readonly sidebarOpen: boolean;
  readonly sidebarCollapsed: boolean;
  // Detail panel
  readonly detailPanelOpen: boolean;
  readonly detailPanelTaskId: string | null;
  // Command palette
  readonly commandPaletteOpen: boolean;
  // Theme
  readonly theme: 'dark' | 'light';
  // Current view
  readonly activeView: ViewType;
  // Task creation
  readonly createTaskOpen: boolean;
}

interface UiActions {
  readonly toggleSidebar: () => void;
  readonly setSidebarOpen: (open: boolean) => void;
  readonly setSidebarCollapsed: (collapsed: boolean) => void;
  readonly openDetailPanel: (taskId: string) => void;
  readonly closeDetailPanel: () => void;
  readonly toggleCommandPalette: () => void;
  readonly setCommandPaletteOpen: (open: boolean) => void;
  readonly setTheme: (theme: 'dark' | 'light') => void;
  readonly toggleTheme: () => void;
  readonly setActiveView: (view: ViewType) => void;
  readonly setCreateTaskOpen: (open: boolean) => void;
}

export const useUiStore = create<UiState & UiActions>()((set) => ({
  // Initial state
  sidebarOpen: true,
  sidebarCollapsed: false,
  detailPanelOpen: false,
  detailPanelTaskId: null,
  commandPaletteOpen: false,
  theme: 'dark',
  activeView: 'list',
  createTaskOpen: false,

  // Actions (all return new state objects - immutable)
  toggleSidebar: () =>
    set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) =>
    set(() => ({ sidebarOpen: open })),
  setSidebarCollapsed: (collapsed) =>
    set(() => ({ sidebarCollapsed: collapsed })),
  openDetailPanel: (taskId) =>
    set(() => ({ detailPanelOpen: true, detailPanelTaskId: taskId })),
  closeDetailPanel: () =>
    set(() => ({ detailPanelOpen: false, detailPanelTaskId: null })),
  toggleCommandPalette: () =>
    set((s) => ({ commandPaletteOpen: !s.commandPaletteOpen })),
  setCommandPaletteOpen: (open) =>
    set(() => ({ commandPaletteOpen: open })),
  setTheme: (theme) =>
    set(() => ({ theme })),
  toggleTheme: () =>
    set((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),
  setActiveView: (view) =>
    set(() => ({ activeView: view })),
  setCreateTaskOpen: (open) =>
    set(() => ({ createTaskOpen: open })),
}));
