import { create } from 'zustand';
import type { Folder } from '../types';
import { generateId } from '../utils/formatters';
import { db } from '../services/db';

interface FolderState {
  folders: Folder[];
  loading: boolean;
  loadFolders: () => Promise<void>;
  addFolder: (name: string, emoji?: string, color?: string) => Promise<Folder>;
  updateFolder: (id: string, updates: Partial<Folder>) => Promise<void>;
  deleteFolder: (id: string) => Promise<void>;
  reorderFolders: (folders: Folder[]) => Promise<void>;
}

export const useFolderStore = create<FolderState>((set, get) => ({
  folders: [],
  loading: false,

  loadFolders: async () => {
    set({ loading: true });
    const folders = await db.folders.orderBy('order').toArray();
    set({ folders, loading: false });
  },

  addFolder: async (name: string, emoji = '📁', color = '#6366F1') => {
    const folders = get().folders;
    const folder: Folder = {
      id: generateId(),
      name,
      color,
      emoji,
      order: folders.length,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await db.folders.add(folder);
    set({ folders: [...folders, folder] });
    return folder;
  },

  updateFolder: async (id: string, updates: Partial<Folder>) => {
    await db.folders.update(id, { ...updates, updatedAt: new Date() });
    set({
      folders: get().folders.map((f) =>
        f.id === id ? { ...f, ...updates, updatedAt: new Date() } : f
      ),
    });
  },

  deleteFolder: async (id: string) => {
    // isi folder jadi "Unfiled": catatan folder dihapus, file asli tetap aman
    await db.fileRecords.where('folderId').equals(id).delete();
    await db.folders.delete(id);
    set({ folders: get().folders.filter((f) => f.id !== id) });
  },

  reorderFolders: async (folders: Folder[]) => {
    const updated = folders.map((f, i) => ({ ...f, order: i }));
    await db.folders.bulkPut(updated);
    set({ folders: updated });
  },
}));
