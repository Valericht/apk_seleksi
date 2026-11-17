import { useCallback } from 'react';
import { useMediaStore } from '../stores/mediaStore';
import { useMoveStore } from '../stores/moveStore';
import { useHistoryStore } from '../stores/historyStore';
import { useSelectionStore } from '../stores/selectionStore';
import { useToastStore } from '../components/common/ToastContainer';
import { db } from '../services/db';
import {
  describeError,
  downloadFile,
  ensurePermission,
  getDestinationDir,
  moveMediaFile,
  reverseEntry,
} from '../services/fileService';
import { generateId } from '../utils/formatters';
import { UNDO_DURATION_MS } from '../utils/constants';
import type { FileRecord, Folder, MediaFile, MoveFileEntry, MoveOperation } from '../types';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

interface MoveOptions {
  /** tanpa overlay progress (dipakai swipe mode) */
  silent?: boolean;
}

export function useFileMover() {
  const undoOperation = useCallback(async (op: MoveOperation) => {
    const toast = useToastStore.getState().addToast;
    const move = useMoveStore.getState();
    if (op.reversed) return;
    if (op.fallback) {
      toast({ type: 'warning', message: 'Operasi mode download tidak bisa dibatalkan otomatis. Hapus/pindah file manual.' });
      return;
    }
    const first = op.files[0];
    if (!first?.toDir) {
      toast({ type: 'error', message: 'Data folder tidak tersedia, undo tidak bisa dilakukan.' });
      return;
    }
    try {
      if (!(await ensurePermission(first.toDir, true))) {
        toast({ type: 'error', message: 'Izin akses folder ditolak.' });
        return;
      }
    } catch (e) {
      toast({ type: 'error', message: describeError(e) });
      return;
    }

    move.start(op.files.length, 'Mengembalikan file...');
    let okCount = 0;
    const failed: string[] = [];
    try {
      for (let i = 0; i < op.files.length; i++) {
        const entry = op.files[i];
        move.update(i, entry.fileName);
        try {
          await reverseEntry(entry);
          okCount++;
        } catch (e) {
          failed.push(`${entry.fileName}: ${describeError(e)}`);
        }
        move.update(i + 1, entry.fileName);
      }
    } finally {
      move.finish();
    }

    if (okCount > 0) {
      await db.fileRecords.where('operationId').equals(op.id).delete();
      if (failed.length === 0) await useHistoryStore.getState().reverseOperation(op.id);
      await useMediaStore.getState().rescan();
    }
    if (failed.length) {
      toast({ type: 'warning', message: `${okCount} file dikembalikan, ${failed.length} gagal (${failed[0]})`, duration: 8000 });
    } else {
      toast({ type: 'success', message: `${okCount} file dikembalikan ke lokasi asal` });
    }
  }, []);

  const moveFiles = useCallback(
    async (files: MediaFile[], folder: Folder, options: MoveOptions = {}) => {
      const toast = useToastStore.getState().addToast;
      const media = useMediaStore.getState();
      const move = useMoveStore.getState();
      if (files.length === 0) return;

      const moved: MediaFile[] = [];
      const entries: MoveFileEntry[] = [];
      const failed: string[] = [];
      const useFS = media.mode === 'fs' && !!media.sourceHandle;

      if (!options.silent) move.start(files.length, 'Memindahkan file...');
      try {
        let destDir: FileSystemDirectoryHandle | null = null;
        if (useFS && media.sourceHandle) {
          if (!(await ensurePermission(media.sourceHandle, true))) {
            toast({ type: 'error', message: 'Izin akses folder ditolak. Buka folder sumber lagi.' });
            return;
          }
          destDir = await getDestinationDir(media.sourceHandle, folder.name);
        }

        for (let i = 0; i < files.length; i++) {
          if (useMoveStore.getState().cancelRequested) break;
          const file = files[i];
          move.update(i, file.name);
          try {
            if (destDir) {
              entries.push(await moveMediaFile(file, destDir, folder.name));
            } else if (file.file) {
              const newName = `${folder.name} - ${file.name}`;
              downloadFile(file.file, newName);
              entries.push({ fileName: file.name, newName, fromPath: file.name, toPath: newName });
              await sleep(350); // browser membatasi download beruntun
            } else {
              throw new Error('File tidak tersedia');
            }
            moved.push(file);
          } catch (e) {
            failed.push(`${file.name}: ${describeError(e)}`);
            if (e instanceof DOMException && e.name === 'QuotaExceededError') break;
          }
          move.update(i + 1, file.name);
        }
      } catch (e) {
        failed.push(describeError(e));
      } finally {
        if (!options.silent) move.finish();
      }

      if (moved.length > 0) {
        media.removeFiles(moved.map((f) => f.id));
        useSelectionStore.getState().deselectAll();

        const op = await useHistoryStore.getState().addOperation({
          fileCount: moved.length,
          totalSize: moved.reduce((sum, f) => sum + f.size, 0),
          targetFolderId: folder.id,
          targetFolderName: folder.name,
          files: entries,
          sourceName: media.sourceHandle?.name,
          fallback: !useFS,
        });

        const records: FileRecord[] = moved.map((f, i) => ({
          id: generateId(),
          fileName: f.name,
          fileSize: f.size,
          fileType: f.type,
          mimeType: f.mimeType,
          folderId: folder.id,
          originalPath: entries[i].fromPath,
          currentPath: entries[i].toPath,
          movedAt: new Date(),
          label: f.label,
          operationId: op.id,
        }));
        await db.fileRecords.bulkAdd(records);

        toast({
          type: 'success',
          message: useFS
            ? `${moved.length} file dipindahkan ke '${folder.name}'`
            : `${moved.length} file diunduh sebagai '${folder.name} - ...'. Hapus file asli secara manual.`,
          undoAction: useFS ? () => void undoOperation(op) : undefined,
          duration: options.silent ? 5000 : UNDO_DURATION_MS,
        });
      }

      if (failed.length > 0) {
        toast({
          type: 'error',
          message: `${failed.length} file gagal dipindah (${failed[0]})`,
          duration: 8000,
        });
      }
    },
    [undoOperation],
  );

  return { moveFiles, undoOperation };
}
