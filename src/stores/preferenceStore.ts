import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { FilterType, MediaLabel, SortType, SwipeDirection, SwipeAssignment, SwipeMap, ViewMode } from '../types';

interface PreferenceState {
  theme: 'light' | 'dark' | 'system';
  viewMode: ViewMode;
  /** 0 = otomatis (responsif), 2-8 = jumlah kolom tetap */
  gridColumns: number;
  filter: FilterType;
  sort: SortType;
  swipeMap: SwipeMap;
  searchQuery: string;
  labelFilter: MediaLabel | 'all';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setViewMode: (mode: ViewMode) => void;
  setGridColumns: (n: number) => void;
  setFilter: (filter: FilterType) => void;
  setSort: (sort: SortType) => void;
  setSwipeAssignment: (dir: SwipeDirection, value: SwipeAssignment) => void;
  setSearchQuery: (query: string) => void;
  setLabelFilter: (label: MediaLabel | 'all') => void;
}

export const usePreferenceStore = create<PreferenceState>()(
  persist(
    (set) => ({
      theme: 'system',
      viewMode: 'grid',
      gridColumns: 0,
      filter: 'all',
      sort: 'date-desc',
      swipeMap: { left: null, right: null, up: null, down: 'skip' },
      searchQuery: '',
      labelFilter: 'all',
      setTheme: (theme) => set({ theme }),
      setViewMode: (mode) => set({ viewMode: mode }),
      setGridColumns: (n) => set({ gridColumns: n }),
      setFilter: (filter) => set({ filter }),
      setSort: (sort) => set({ sort }),
      setSwipeAssignment: (dir, value) =>
        set((s) => ({ swipeMap: { ...s.swipeMap, [dir]: value } })),
      setSearchQuery: (query) => set({ searchQuery: query }),
      setLabelFilter: (label) => set({ labelFilter: label }),
    }),
    {
      name: 'media-seleksi-preferences',
      partialize: (s) => ({
        theme: s.theme,
        viewMode: s.viewMode,
        gridColumns: s.gridColumns,
        filter: s.filter,
        sort: s.sort,
        swipeMap: s.swipeMap,
      }),
    },
  ),
);
