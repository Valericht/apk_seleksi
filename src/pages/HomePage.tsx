import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { DragEvent } from 'react';
import { FolderOpen, ImagePlus, Loader2, Play, Shuffle, Copy } from 'lucide-react';
import { FilterBar } from '../components/browser/FilterBar';
import { SelectionBar } from '../components/browser/SelectionBar';
import { StorageDashboard } from '../components/browser/StorageDashboard';
import { ThumbnailCard } from '../components/browser/ThumbnailCard';
import { PreviewModal } from '../components/preview/PreviewModal';
import { MoveFlow } from '../components/move/MoveFlow';
import { EmptyState } from '../components/common/EmptyState';
import { useMediaStore } from '../stores/mediaStore';
import { usePreferenceStore } from '../stores/preferenceStore';
import { useSelectionStore } from '../stores/selectionStore';
import { useDuplicateStore } from '../stores/duplicateStore';
import { useFolderStore } from '../stores/folderStore';
import { useFilteredMedia } from '../hooks/useMediaScanner';
import { PAGE_SIZE } from '../utils/constants';
import type { MediaFile, PageType } from '../types';

interface HomePageProps {
  supportsFS: boolean;
  onOpenSource: () => void;
  onPickFiles: () => void;
  onDropFiles: (files: FileList) => void;
  onNavigate: (page: PageType) => void;
}

const AUTO_GRID = 'grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8';

export function HomePage({ supportsFS, onOpenSource, onPickFiles, onDropFiles, onNavigate }: HomePageProps) {
  const filtered = useFilteredMedia();
  const totalFiles = useMediaStore((s) => s.files.length);
  const loading = useMediaStore((s) => s.loading);
  const scanCount = useMediaStore((s) => s.scanCount);
  const error = useMediaStore((s) => s.error);
  const pendingHandle = useMediaStore((s) => s.pendingHandle);
  const mode = useMediaStore((s) => s.mode);
  const resumePending = useMediaStore((s) => s.resumePending);
  const viewMode = usePreferenceStore((s) => s.viewMode);
  const gridColumns = usePreferenceStore((s) => s.gridColumns);
  const selectedFiles = useSelectionStore((s) => s.selectedFiles);
  const isSelecting = useSelectionStore((s) => s.isSelecting);
  const toggleSelect = useSelectionStore((s) => s.toggleSelect);
  const duplicateIds = useDuplicateStore((s) => s.duplicateIds);
  const folderCount = useFolderStore((s) => s.folders.length);

  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const [moveTargets, setMoveTargets] = useState<MediaFile[] | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const sentinel = useRef<HTMLDivElement | null>(null);

  // reset infinite scroll saat filter/sort/pencarian berubah
  const filter = usePreferenceStore((s) => s.filter);
  const sort = usePreferenceStore((s) => s.sort);
  const labelFilter = usePreferenceStore((s) => s.labelFilter);
  const searchQuery = usePreferenceStore((s) => s.searchQuery);
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [filter, sort, labelFilter, searchQuery]);

  // infinite scroll
  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) setVisibleCount((c) => c + PAGE_SIZE);
      },
      { rootMargin: '600px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [filtered.length, viewMode]);

  const visible = useMemo(() => filtered.slice(0, visibleCount), [filtered, visibleCount]);

  const handleOpen = useCallback(
    (file: MediaFile) => {
      const idx = filtered.findIndex((f) => f.id === file.id);
      if (idx >= 0) setPreviewIndex(idx);
    },
    [filtered],
  );

  const isSelected = useCallback((id: string) => useSelectionStore.getState().selectedFiles.has(id), []);

  const onDragOver = (e: DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };
  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length) onDropFiles(e.dataTransfer.files);
  };

  const gridClass = gridColumns === 0 ? AUTO_GRID : '';
  const gridStyle = gridColumns > 0 ? { gridTemplateColumns: `repeat(${gridColumns}, minmax(0, 1fr))` } : undefined;

  // ---- Belum ada media: onboarding ----
  if (totalFiles === 0) {
    return (
      <div onDragOver={onDragOver} onDragLeave={() => setDragOver(false)} onDrop={onDrop} className="min-h-[60vh]">
        {loading ? (
          <EmptyState
            icon={<Loader2 size={48} className="animate-spin" />}
            title="Memindai media..."
            description={`${scanCount} file ditemukan`}
          />
        ) : (
          <EmptyState
            icon={<FolderOpen size={64} />}
            title="Selamat datang di Media Seleksi"
            description={
              supportsFS
                ? 'Pilih folder sumber (misalnya DCIM atau Pictures). Aplikasi butuh izin akses agar bisa menampilkan dan memindahkan foto & video kamu. Tidak ada file yang diunggah ke server.'
                : 'Browser ini belum mendukung akses folder langsung. Pilih file (atau seret ke sini) — "memindahkan" akan mengunduh file ke folder tujuan, lalu hapus file asli secara manual.'
            }
            action={
              <div className="flex flex-col items-center gap-3">
                {pendingHandle && (
                  <button
                    onClick={() => void resumePending()}
                    className="flex items-center gap-2 px-5 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-xl transition-colors"
                  >
                    <Play size={18} />
                    Lanjutkan: {pendingHandle.name}
                  </button>
                )}
                <button
                  onClick={onOpenSource}
                  className="flex items-center gap-2 px-5 py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-medium rounded-xl transition-colors"
                >
                  {supportsFS ? <FolderOpen size={18} /> : <ImagePlus size={18} />}
                  {supportsFS ? 'Pilih Folder Sumber' : 'Pilih Foto & Video'}
                </button>
                {supportsFS && (
                  <button onClick={onPickFiles} className="text-xs text-slate-500 hover:text-indigo-500 underline">
                    atau pilih file satu per satu
                  </button>
                )}
                {folderCount === 0 && (
                  <p className="text-xs text-slate-400 dark:text-slate-500 max-w-xs">
                    Buat folder pertamamu di tab Folder untuk mulai mengorganisir!
                  </p>
                )}
                {error && <p className="text-sm text-red-500 max-w-sm">{error}</p>}
              </div>
            }
          />
        )}
        {dragOver && (
          <div className="fixed inset-0 z-40 bg-indigo-500/10 border-4 border-dashed border-indigo-500 pointer-events-none" />
        )}
      </div>
    );
  }

  return (
    <div
      className={`pb-40 md:pb-24 ${dragOver ? 'ring-2 ring-indigo-500 ring-inset' : ''}`}
      onDragOver={onDragOver}
      onDragLeave={() => setDragOver(false)}
      onDrop={onDrop}
    >
      <FilterBar />
      <StorageDashboard />

      <div className="flex items-center gap-2 px-4 pt-3 flex-wrap">
        <button
          onClick={() => onNavigate('swipe')}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-950/50"
        >
          <Shuffle size={14} />
          Sort Cepat
        </button>
        <button
          onClick={() => onNavigate('duplicates')}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-950/40"
        >
          <Copy size={14} />
          Cari Duplikat
        </button>
        <span className="ml-auto text-xs text-slate-500 dark:text-slate-400">
          {filtered.length} dari {totalFiles} file
          {mode === 'fallback' && ' · mode unduh'}
        </span>
      </div>

      {error && <p className="px-4 pt-2 text-sm text-red-500">{error}</p>}

      <div className="px-4 py-3">
        {filtered.length === 0 ? (
          <EmptyState
            icon={<ImagePlus size={48} />}
            title="Tidak ada hasil"
            description="Coba ubah filter, label, atau kata kunci pencarian."
          />
        ) : viewMode === 'grid' ? (
          <div className={`grid gap-2 ${gridClass}`} style={gridStyle}>
            {visible.map((file) => (
              <ThumbnailCard
                key={file.id}
                file={file}
                viewMode="grid"
                selected={selectedFiles.has(file.id)}
                selecting={isSelecting}
                isDuplicate={duplicateIds.has(file.id)}
                onToggle={toggleSelect}
                onOpen={handleOpen}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {visible.map((file) => (
              <ThumbnailCard
                key={file.id}
                file={file}
                viewMode="list"
                selected={selectedFiles.has(file.id)}
                selecting={isSelecting}
                isDuplicate={duplicateIds.has(file.id)}
                onToggle={toggleSelect}
                onOpen={handleOpen}
              />
            ))}
          </div>
        )}
        {visibleCount < filtered.length && <div ref={sentinel} className="h-10" />}
      </div>

      <SelectionBar allFiles={filtered} onMoveClick={() => setMoveTargets(useSelectionStore.getState().getSelectedArray())} />

      <PreviewModal
        open={previewIndex !== null}
        files={filtered}
        initialIndex={previewIndex ?? 0}
        isSelected={isSelected}
        onToggleSelect={toggleSelect}
        onClose={() => setPreviewIndex(null)}
        onMove={(file) => setMoveTargets([file])}
      />

      <MoveFlow files={moveTargets} onClose={() => setMoveTargets(null)} />
    </div>
  );
}
