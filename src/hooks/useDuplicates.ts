import { useCallback } from 'react';
import { useMediaStore } from '../stores/mediaStore';
import { useDuplicateStore, type DuplicateGroup, type DuplicateMode } from '../stores/duplicateStore';
import type { MediaFile } from '../types';

const HASH_FULL_LIMIT = 64 * 1024 * 1024;
const CHUNK = 4 * 1024 * 1024;
const tick = () => new Promise((r) => setTimeout(r, 0));

async function hashFile(file: File): Promise<string> {
  let buf: ArrayBuffer;
  if (file.size <= HASH_FULL_LIMIT) {
    buf = await file.arrayBuffer();
  } else {
    // file besar: hash sampel (awal + tengah + akhir) agar cepat
    const mid = Math.floor(file.size / 2);
    buf = await new Blob([
      file.slice(0, CHUNK),
      file.slice(mid - CHUNK / 2, mid + CHUNK / 2),
      file.slice(file.size - CHUNK),
    ]).arrayBuffer();
  }
  const digest = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function toGroups(map: Map<string, MediaFile[]>): DuplicateGroup[] {
  return Array.from(map.entries())
    .filter(([, files]) => files.length > 1)
    .map(([key, files]) => ({
      key,
      files: [...files].sort((a, b) => a.lastModified - b.lastModified),
    }))
    .sort((a, b) => b.files[0].size * b.files.length - a.files[0].size * a.files.length);
}

export function useDuplicates() {
  const scan = useCallback(async (mode: DuplicateMode) => {
    const store = useDuplicateStore.getState();
    const files = useMediaStore.getState().files;
    store.setScanning(true);
    store.setProgress(0, files.length);

    try {
      const bySize = new Map<number, MediaFile[]>();
      for (const f of files) {
        if (f.size === 0) continue;
        const arr = bySize.get(f.size);
        if (arr) arr.push(f);
        else bySize.set(f.size, [f]);
      }

      const result = new Map<string, MediaFile[]>();
      const push = (key: string, f: MediaFile) => {
        const arr = result.get(key);
        if (arr) arr.push(f);
        else result.set(key, [f]);
      };

      if (mode === 'size') {
        bySize.forEach((list, size) => list.forEach((f) => push(String(size), f)));
      } else if (mode === 'name-size') {
        bySize.forEach((list, size) => list.forEach((f) => push(`${f.name.toLowerCase()}|${size}`, f)));
      } else {
        const candidates = Array.from(bySize.values()).filter((l) => l.length > 1).flat();
        store.setProgress(0, candidates.length);
        let done = 0;
        for (const f of candidates) {
          if (f.file) {
            try {
              push(`${f.size}:${await hashFile(f.file)}`, f);
            } catch {
              // file tidak terbaca — lewati
            }
          }
          done++;
          if (done % 5 === 0) {
            store.setProgress(done, candidates.length);
            await tick();
          }
        }
      }
      useDuplicateStore.getState().setResult(toGroups(result));
    } catch {
      useDuplicateStore.getState().setScanning(false);
    }
  }, []);

  return { scan };
}
