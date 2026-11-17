import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../services/db';

export interface FolderStats {
  count: number;
  size: number;
  photos: number;
  videos: number;
}

export function useFolderStats() {
  const records = useLiveQuery(() => db.fileRecords.toArray(), []);
  return useMemo(() => {
    const map: Record<string, FolderStats> = {};
    for (const r of records ?? []) {
      const s = (map[r.folderId] ??= { count: 0, size: 0, photos: 0, videos: 0 });
      s.count++;
      s.size += r.fileSize;
      if (r.fileType === 'photo') s.photos++;
      else s.videos++;
    }
    return map;
  }, [records]);
}
