import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ─── Types ───────────────────────────────────────────────────────

export type SidebarSection =
  | 'dashboard'
  | 'tasks-today'
  | 'tasks-week'
  | 'tasks-overdue'
  | 'tasks-completed'
  | 'projects'
  | 'channels'
  | 'calendar'
  | 'progress'
  | 'ai-chat'
  | 'game-mode'
  | 'settings'
  | 'profile';

interface ProjectItem {
  readonly id: string;
  readonly name: string;
  readonly color: string;
}

interface SidebarState {
  readonly isCollapsed: boolean;
  readonly isMobileOpen: boolean;
  readonly activeItem: SidebarSection;
  readonly expandedSections: ReadonlyArray<string>;
  readonly projects: ReadonlyArray<ProjectItem>;
}

interface SidebarActions {
  readonly toggleCollapsed: () => void;
  readonly setCollapsed: (collapsed: boolean) => void;
  readonly toggleMobileOpen: () => void;
  readonly setMobileOpen: (open: boolean) => void;
  readonly setActiveItem: (item: SidebarSection) => void;
  readonly toggleSection: (section: string) => void;
  readonly setProjects: (projects: ReadonlyArray<ProjectItem>) => void;
}

// ─── Store ───────────────────────────────────────────────────────

export const useSidebarStore = create<SidebarState & SidebarActions>()(
  persist(
    (set) => ({
      // State
      isCollapsed: false,
      isMobileOpen: false,
      activeItem: 'dashboard',
      expandedSections: ['tasks', 'projects', 'channels'],
      projects: [
        { id: 'p1', name: 'Website Redesign', color: '#6C3CE0' },
        { id: 'p2', name: 'Mobile App v2', color: '#00C896' },
        { id: 'p3', name: 'Marketing Q1', color: '#FF9F1C' },
      ],

      // Actions — all return new state (immutable)
      toggleCollapsed: () =>
        set((state) => ({ isCollapsed: !state.isCollapsed })),

      setCollapsed: (collapsed: boolean) =>
        set(() => ({ isCollapsed: collapsed })),

      toggleMobileOpen: () =>
        set((state) => ({ isMobileOpen: !state.isMobileOpen })),

      setMobileOpen: (open: boolean) =>
        set(() => ({ isMobileOpen: open })),

      setActiveItem: (item: SidebarSection) =>
        set(() => ({ activeItem: item })),

      toggleSection: (section: string) =>
        set((state) => ({
          expandedSections: state.expandedSections.includes(section)
            ? state.expandedSections.filter((s) => s !== section)
            : [...state.expandedSections, section],
        })),

      setProjects: (projects: ReadonlyArray<ProjectItem>) =>
        set(() => ({ projects })),
    }),
    {
      name: 'unjynx-sidebar',
      partialize: (state) => ({
        isCollapsed: state.isCollapsed,
        activeItem: state.activeItem,
        expandedSections: state.expandedSections,
      }),
    },
  ),
);
