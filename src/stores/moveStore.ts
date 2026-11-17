import { create } from 'zustand';

interface MoveProgressState {
  active: boolean;
  current: number;
  total: number;
  title: string;
  currentFileName?: string;
  cancelRequested: boolean;
  start: (total: number, title?: string) => void;
  update: (current: number, fileName?: string) => void;
  finish: () => void;
  requestCancel: () => void;
}

export const useMoveStore = create<MoveProgressState>((set) => ({
  active: false,
  current: 0,
  total: 0,
  title: 'Memindahkan file...',
  currentFileName: undefined,
  cancelRequested: false,
  start: (total, title = 'Memindahkan file...') => set({ active: true, current: 0, total, title, currentFileName: undefined, cancelRequested: false }),
  update: (current, fileName) => set({ current, currentFileName: fileName }),
  finish: () => set({ active: false, cancelRequested: false }),
  requestCancel: () => set({ cancelRequested: true }),
}));
