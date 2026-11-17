import { create } from 'zustand';
import type { MediaFile } from '../types';

interface SelectionState {
  selectedFiles: Map<string, MediaFile>;
  isSelecting: boolean;
  toggleSelect: (file: MediaFile) => void;
  selectAll: (files: MediaFile[]) => void;
  deselectAll: () => void;
  isSelected: (id: string) => boolean;
  getSelectedArray: () => MediaFile[];
  getSelectedCount: () => number;
  getTotalSize: () => number;
  getPhotoCount: () => number;
  getVideoCount: () => number;
}

export const useSelectionStore = create<SelectionState>((set, get) => ({
  selectedFiles: new Map(),
  isSelecting: false,

  toggleSelect: (file: MediaFile) => {
    const selected = new Map(get().selectedFiles);
    if (selected.has(file.id)) {
      selected.delete(file.id);
    } else {
      selected.set(file.id, file);
    }
    set({ selectedFiles: selected, isSelecting: selected.size > 0 });
  },

  selectAll: (files: MediaFile[]) => {
    const selected = new Map<string, MediaFile>();
    files.forEach((f) => selected.set(f.id, f));
    set({ selectedFiles: selected, isSelecting: selected.size > 0 });
  },

  deselectAll: () => {
    set({ selectedFiles: new Map(), isSelecting: false });
  },

  isSelected: (id: string) => get().selectedFiles.has(id),
  getSelectedArray: () => Array.from(get().selectedFiles.values()),
  getSelectedCount: () => get().selectedFiles.size,

  getTotalSize: () => {
    let total = 0;
    get().selectedFiles.forEach((f) => (total += f.size));
    return total;
  },

  getPhotoCount: () => {
    let count = 0;
    get().selectedFiles.forEach((f) => { if (f.type === 'photo') count++; });
    return count;
  },

  getVideoCount: () => {
    let count = 0;
    get().selectedFiles.forEach((f) => { if (f.type === 'video') count++; });
    return count;
  },
}));
