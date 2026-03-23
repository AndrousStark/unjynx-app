import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ─── Types ───────────────────────────────────────────────────────

export type ViewType = 'list' | 'board' | 'calendar' | 'timeline' | 'table';

export type SortField = 'due_date' | 'priority' | 'created_at' | 'title' | 'updated_at';
export type SortDirection = 'asc' | 'desc';

export interface FilterState {
  readonly priority: ReadonlyArray<string>;
  readonly status: ReadonlyArray<string>;
  readonly assignee: ReadonlyArray<string>;
  readonly project: ReadonlyArray<string>;
  readonly tags: ReadonlyArray<string>;
}

interface ViewsState {
  readonly activeView: ViewType;
  readonly sort: {
    readonly field: SortField;
    readonly direction: SortDirection;
  };
  readonly filters: FilterState;
  readonly isFilterOpen: boolean;
}

interface ViewsActions {
  readonly setActiveView: (view: ViewType) => void;
  readonly setSort: (field: SortField, direction: SortDirection) => void;
  readonly setFilter: <K extends keyof FilterState>(
    key: K,
    value: FilterState[K],
  ) => void;
  readonly clearFilters: () => void;
  readonly toggleFilterPanel: () => void;
}

// ─── Constants ───────────────────────────────────────────────────

const EMPTY_FILTERS: FilterState = {
  priority: [],
  status: [],
  assignee: [],
  project: [],
  tags: [],
};

// ─── Store ───────────────────────────────────────────────────────

export const useViewsStore = create<ViewsState & ViewsActions>()(
  persist(
    (set) => ({
      // State
      activeView: 'list',
      sort: { field: 'due_date', direction: 'asc' },
      filters: EMPTY_FILTERS,
      isFilterOpen: false,

      // Actions — all immutable
      setActiveView: (view: ViewType) =>
        set(() => ({ activeView: view })),

      setSort: (field: SortField, direction: SortDirection) =>
        set(() => ({ sort: { field, direction } })),

      setFilter: (key, value) =>
        set((state) => ({
          filters: { ...state.filters, [key]: value },
        })),

      clearFilters: () =>
        set(() => ({ filters: EMPTY_FILTERS })),

      toggleFilterPanel: () =>
        set((state) => ({ isFilterOpen: !state.isFilterOpen })),
    }),
    {
      name: 'unjynx-views',
      partialize: (state) => ({
        activeView: state.activeView,
        sort: state.sort,
      }),
    },
  ),
);
