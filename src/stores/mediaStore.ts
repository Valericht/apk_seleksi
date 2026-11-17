import { create } from 'zustand';
import type { MediaFile } from '../types';
import { getMediaType, isMediaFile } from '../utils/fileTypes';
import { detectLabel } from '../services/labelDetector';
import { generateId } from '../utils/formatters';
import { db } from '../services/db';
import { releaseThumbnails } from '../services/thumbnailService';
import { ensurePermission, supportsFileSystemAccess } from '../services/fileService';
import { ROOT_DIR_NAME } from '../utils/constants';

interface MediaState {
  files: MediaFile[];
  loading: boolean;
  scanCount: number;
  sourceHandle: FileSystemDirectoryHandle | null;
  pendingHandle: FileSystemDirectoryHandle | null;
  error: string | null;
  /** 'fs' = File System Access API, 'fallback' = input file/drag & drop */
  mode: 'fs' | 'fallback' | null;
  openDirectory: () => Promise<void>;
  rescan: () => Promise<void>;
  restoreSource: () => Promise<void>;
  resumePending: () => Promise<void>;
  loadFromFiles: (files: File[]) => void;
  removeFiles: (ids: string[]) => void;
  clearFiles: () => void;
}

async function scanDirectory(
  root: FileSystemDirectoryHandle,
  onProgress: (count: number) => void,
): Promise<MediaFile[]> {
  const files: MediaFile[] = [];

  async function walk(dir: FileSystemDirectoryHandle, path: string, depth: number) {
    for await (const entry of dir.values()) {
      if (entry.kind === 'file') {
        if (!isMediaFile(entry.name)) continue;
        try {
          const file = await entry.getFile();
          const type = getMediaType(file.name, file.type);
          if (!type) continue;
          files.push({
            id: generateId(),
            name: file.name,
            size: file.size,
            type,
            mimeType: file.type,
            lastModified: file.lastModified,
            handle: entry,
            parentHandle: dir,
            file,
            label: detectLabel(file.name, path),
            parentPath: path,
          });
          if (files.length % 100 === 0) onProgress(files.length);
        } catch {
          // file tidak terbaca (terkunci/dihapus) — lewati
        }
      } else if (entry.kind === 'directory') {
        // folder hasil seleksi tidak ikut dipindai
        if (depth === 0 && entry.name === ROOT_DIR_NAME) continue;
        if (entry.name.startsWith('.')) continue;
        await walk(entry, path + '/' + entry.name, depth + 1);
      }
    }
  }

  await walk(root, root.name, 0);
  files.sort((a, b) => b.lastModified - a.lastModified);
  return files;
}

export const useMediaStore = create<MediaState>((set, get) => {
  async function runScan(handle: FileSystemDirectoryHandle) {
    set({ loading: true, error: null, scanCount: 0 });
    try {
      releaseThumbnails();
      const files = await scanDirectory(handle, (count) => set({ scanCount: count }));
      set({ files, sourceHandle: handle, pendingHandle: null, mode: 'fs', loading: false, scanCount: files.length });
      await db.meta.put({ key: 'sourceHandle', value: handle });
    } catch (e) {
      set({
        error: 'Gagal membaca folder: ' + (e instanceof Error ? e.message : String(e)),
        loading: false,
      });
    }
  }

  return {
    files: [],
    loading: false,
    scanCount: 0,
    sourceHandle: null,
    pendingHandle: null,
    error: null,
    mode: null,

    openDirectory: async () => {
      if (!supportsFileSystemAccess()) {
        set({ error: 'Browser tidak mendukung akses folder. Gunakan tombol pilih file.' });
        return;
      }
      try {
        const dir = await window.showDirectoryPicker({ mode: 'readwrite' });
        await runScan(dir);
      } catch (e) {
        if (e instanceof DOMException && e.name === 'AbortError') return;
        set({ error: 'Gagal membuka folder: ' + (e instanceof Error ? e.message : String(e)), loading: false });
      }
    },

    rescan: async () => {
      const handle = get().sourceHandle;
      if (handle) await runScan(handle);
    },

    restoreSource: async () => {
      if (!supportsFileSystemAccess() || get().sourceHandle) return;
      try {
        const rec = await db.meta.get('sourceHandle');
        const handle = rec?.value as FileSystemDirectoryHandle | undefined;
        if (!handle) return;
        const perm = await handle.queryPermission?.({ mode: 'readwrite' });
        if (perm === 'granted') await runScan(handle);
        else set({ pendingHandle: handle });
      } catch {
        // handle tidak valid lagi — abaikan
      }
    },

    resumePending: async () => {
      const handle = get().pendingHandle;
      if (!handle) return;
      const ok = await ensurePermission(handle, true);
      if (ok) await runScan(handle);
      else set({ error: 'Izin akses folder ditolak. Pilih folder lagi.' });
    },

    loadFromFiles: (list: File[]) => {
      releaseThumbnails();
      const files: MediaFile[] = [];
      for (const file of list) {
        const type = getMediaType(file.name, file.type);
        if (!type) continue;
        files.push({
          id: generateId(),
          name: file.name,
          size: file.size,
          type,
          mimeType: file.type,
          lastModified: file.lastModified,
          file,
          label: detectLabel(file.name),
        });
      }
      files.sort((a, b) => b.lastModified - a.lastModified);
      set({
        files,
        sourceHandle: null,
        pendingHandle: null,
        mode: 'fallback',
        loading: false,
        error: files.length === 0 ? 'Tidak ada foto/video yang didukung pada pilihan tersebut.' : null,
      });
    },

    removeFiles: (ids: string[]) => {
      const idSet = new Set(ids);
      releaseThumbnails(ids);
      set({ files: get().files.filter((f) => !idSet.has(f.id)) });
    },

    clearFiles: () => {
      releaseThumbnails();
      set({ files: [], sourceHandle: null, pendingHandle: null, mode: null, error: null });
      db.meta.delete('sourceHandle').catch(() => {});
    },
  };
});
