import { useState } from 'react';
import { Copy, Loader2, ScanSearch } from 'lucide-react';
import { EmptyState } from '../components/common/EmptyState';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { useToastStore } from '../components/common/ToastContainer';
import { DuplicateGroupCard } from '../components/duplicate/DuplicateGroupCard';
import { useDuplicates } from '../hooks/useDuplicates';
import { useDuplicateStore, type DuplicateGroup, type DuplicateMode } from '../stores/duplicateStore';
import { useMediaStore } from '../stores/mediaStore';
import { deleteMediaFile, describeError, ensurePermission } from '../services/fileService';

const MODES: { value: DuplicateMode; label: string; hint: string }[] = [
  { value: 'name-size', label: 'Nama + ukuran', hint: 'Cepat. Nama dan ukuran file sama persis.' },
  { value: 'size', label: 'Ukuran saja', hint: 'Cepat, tapi bisa salah deteksi.' },
  { value: 'hash', label: 'Isi file (hash)', hint: 'Paling akurat, lebih lambat untuk file besar.' },
];

export function DuplicatePage() {
  const { scan } = useDuplicates();
  const { groups, scanning, progress, scanned } = useDuplicateStore();
  const dropFiles = useDuplicateStore((s) => s.dropFiles);
  const totalFiles = useMediaStore((s) => s.files.length);
  const mode = useMediaStore((s) => s.mode);
  const sourceHandle = useMediaStore((s) => s.sourceHandle);
  const removeFiles = useMediaStore((s) => s.removeFiles);
  const addToast = useToastStore((s) => s.addToast);

  const [scanMode, setScanMode] = useState<DuplicateMode>('name-size');
  const [keepMap, setKeepMap] = useState<Record<string, string>>({});
  const [pending, setPending] = useState<DuplicateGroup | null>(null);

  const canDelete = mode === 'fs';
  const keepIdOf = (g: DuplicateGroup) => keepMap[g.key] && g.files.some((f) => f.id === keepMap[g.key]) ? keepMap[g.key] : g.files[0].id;

  const resolve = async () => {
    const group = pending;
    setPending(null);
    if (!group) return;
    if (sourceHandle && !(await ensurePermission(sourceHandle, true))) {
      addToast({ type: 'error', message: 'Izin akses folder ditolak.' });
      return;
    }
    const keep = keepIdOf(group);
    const removed: string[] = [];
    let failed = 0;
    for (const f of group.files) {
      if (f.id === keep) continue;
      try {
        await deleteMediaFile(f);
        removed.push(f.id);
      } catch (e) {
        failed++;
        addToast({ type: 'error', message: `${f.name}: ${describeError(e)}`, duration: 6000 });
      }
    }
    if (removed.length) {
      removeFiles(removed);
      dropFiles(removed);
      addToast({ type: failed ? 'warning' : 'success', message: `${removed.length} file duplikat dihapus` });
    }
  };

  if (totalFiles === 0) {
    return (
      <EmptyState
        icon={<Copy size={48} />}
        title="Belum ada file"
        description="Buka folder sumber di Beranda dulu untuk memindai duplikat."
      />
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-4 pb-28 md:pb-8 space-y-4">
      <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Duplikat</h2>

      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 space-y-3">
        <div className="flex flex-wrap gap-2">
          {MODES.map((m) => (
            <button
              key={m.value}
              onClick={() => setScanMode(m.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                scanMode === m.value
                  ? 'bg-indigo-500 text-white'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">{MODES.find((m) => m.value === scanMode)?.hint}</p>
        <button
          onClick={() => void scan(scanMode)}
          disabled={scanning}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-60 text-white text-sm font-medium rounded-xl"
        >
          {scanning ? <Loader2 size={16} className="animate-spin" /> : <ScanSearch size={16} />}
          {scanning ? `Memindai ${progress.current}/${progress.total}` : 'Mulai Pindai'}
        </button>
        {!canDelete && (
          <p className="text-xs text-amber-600 dark:text-amber-400">
            Penghapusan file hanya tersedia saat folder dibuka lewat akses folder langsung (Chrome/Edge desktop).
          </p>
        )}
      </div>

      {scanned && groups.length === 0 && (
        <EmptyState icon={<Copy size={48} />} title="Tidak ada duplikat" description="Semua file terlihat unik." />
      )}

      <div className="space-y-3">
        {groups.map((g) => (
          <DuplicateGroupCard
            key={g.key}
            group={g}
            keepId={keepIdOf(g)}
            canDelete={canDelete}
            onKeep={(id) => setKeepMap((m) => ({ ...m, [g.key]: id }))}
            onResolve={() => setPending(g)}
          />
        ))}
      </div>

      <ConfirmDialog
        open={!!pending}
        title="Hapus Duplikat"
        message={`Hapus ${(pending?.files.length ?? 1) - 1} file lain dan simpan 1? File dihapus permanen dari perangkat.`}
        confirmText="Hapus"
        variant="danger"
        onConfirm={() => void resolve()}
        onCancel={() => setPending(null)}
      />
    </div>
  );
}
