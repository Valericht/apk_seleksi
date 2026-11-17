import { useState } from 'react';
import { MoveDialog } from './MoveDialog';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { useFileMover } from '../../hooks/useFileMover';
import type { Folder, MediaFile } from '../../types';

interface MoveFlowProps {
  /** file yang akan dipindah; null = alur tertutup */
  files: MediaFile[] | null;
  onClose: () => void;
}

/** Alur: pilih folder tujuan -> konfirmasi -> pindahkan (progress tampil global). */
export function MoveFlow({ files, onClose }: MoveFlowProps) {
  const { moveFiles } = useFileMover();
  const [target, setTarget] = useState<Folder | null>(null);

  const count = files?.length ?? 0;

  const close = () => {
    setTarget(null);
    onClose();
  };

  const confirm = () => {
    if (!files || !target) return;
    const list = files;
    const folder = target;
    close();
    void moveFiles(list, folder);
  };

  return (
    <>
      <MoveDialog open={!!files && !target} fileCount={count} onMove={setTarget} onClose={close} />
      <ConfirmDialog
        open={!!files && !!target}
        title="Pindahkan File"
        message={`Pindahkan ${count} file ke folder '${target?.name ?? ''}'?`}
        confirmText="Pindahkan"
        onConfirm={confirm}
        onCancel={() => setTarget(null)}
      />
    </>
  );
}
