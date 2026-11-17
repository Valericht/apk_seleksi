import { create } from 'zustand';
import type { MediaFile } from '../types';

export type DuplicateMode = 'name-size' | 'size' | 'hash';

export interface DuplicateGroup {
  key: string;
  files: MediaFile[];
}

interface DuplicateState {
  groups: DuplicateGroup[];
  duplicateIds: Set<string>;
  scanning: boolean;
  progress: { current: number; total: number };
  scanned: boolean;
  setScanning: (scanning: boolean) => void;
  setProgress: (current: number, total: number) => void;
  setResult: (groups: DuplicateGroup[]) => void;
  dropFiles: (ids: string[]) => void;
  reset: () => void;
}

function toIds(groups: DuplicateGroup[]) {
  const ids = new Set<string>();
  groups.forEach((g) => g.files.forEach((f) => ids.add(f.id)));
  return ids;
}

export const useDuplicateStore = create<DuplicateState>((set, get) => ({
  groups: [],
  duplicateIds: new Set(),
  scanning: false,
  progress: { current: 0, total: 0 },
  scanned: false,
  setScanning: (scanning) => set({ scanning }),
  setProgress: (current, total) => set({ progress: { current, total } }),
  setResult: (groups) => set({ groups, duplicateIds: toIds(groups), scanned: true, scanning: false }),
  dropFiles: (ids) => {
    const drop = new Set(ids);
    const groups = get()
      .groups.map((g) => ({ ...g, files: g.files.filter((f) => !drop.has(f.id)) }))
      .filter((g) => g.files.length > 1);
    set({ groups, duplicateIds: toIds(groups) });
  },
  reset: () => set({ groups: [], duplicateIds: new Set(), scanned: false, scanning: false }),
}));
