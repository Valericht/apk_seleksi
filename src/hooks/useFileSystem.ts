import { useCallback, useRef } from 'react';
import type { ChangeEvent } from 'react';
import { useMediaStore } from '../stores/mediaStore';
import { supportsFileSystemAccess } from '../services/fileService';

/** Wrapper File System Access API dengan fallback <input type="file">. */
export function useFileSystem() {
  const supportsFS = supportsFileSystemAccess();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const openDirectory = useMediaStore((s) => s.openDirectory);
  const loadFromFiles = useMediaStore((s) => s.loadFromFiles);

  const pickFiles = useCallback(() => inputRef.current?.click(), []);

  const openSource = useCallback(() => {
    if (supportsFS) void openDirectory();
    else pickFiles();
  }, [supportsFS, openDirectory, pickFiles]);

  const onInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const list = e.target.files;
      if (list && list.length) loadFromFiles(Array.from(list));
      e.target.value = '';
    },
    [loadFromFiles],
  );

  const onDropFiles = useCallback(
    (list: FileList) => {
      if (list.length) loadFromFiles(Array.from(list));
    },
    [loadFromFiles],
  );

  return { supportsFS, inputRef, openSource, pickFiles, onInputChange, onDropFiles };
}
