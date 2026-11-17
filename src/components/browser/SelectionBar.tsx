import { CheckSquare, FolderInput, X } from 'lucide-react';
import { useSelectionStore } from '../../stores/selectionStore';
import { formatFileSize } from '../../utils/formatters';
import type { MediaFile } from '../../types';

interface SelectionBarProps {
  allFiles: MediaFile[];
  onMoveClick: () => void;
}

export function SelectionBar({ allFiles, onMoveClick }: SelectionBarProps) {
  const { isSelecting, selectAll, deselectAll, getSelectedCount, getTotalSize, getPhotoCount, getVideoCount } = useSelectionStore();

  if (!isSelecting) return null;

  const count = getSelectedCount();
  const photoCount = getPhotoCount();
  const videoCount = getVideoCount();
  const totalSize = getTotalSize();

  return (
    <div className="fixed bottom-16 md:bottom-0 left-0 right-0 z-40 selection-bar-enter">
      <div className="bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 shadow-lg px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={deselectAll}
              aria-label="Batalkan semua pilihan"
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              <X size={18} className="text-slate-500" />
            </button>
            <div>
              <p className="text-sm font-medium text-slate-900 dark:text-white">
                {count} file dipilih
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {photoCount > 0 && `${photoCount} foto`}
                {photoCount > 0 && videoCount > 0 && ', '}
                {videoCount > 0 && `${videoCount} video`}
                {' — '}{formatFileSize(totalSize)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => selectAll(allFiles)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              <CheckSquare size={14} />
              Pilih Semua
            </button>
            <button
              onClick={onMoveClick}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium rounded-xl transition-colors"
            >
              <FolderInput size={16} />
              Pindahkan ke...
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
