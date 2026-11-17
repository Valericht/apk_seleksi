import { useEffect, useState } from 'react';
import { History as HistoryIcon, Undo2 } from 'lucide-react';
import { EmptyState } from '../components/common/EmptyState';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { useHistoryStore } from '../stores/historyStore';
import { useFileMover } from '../hooks/useFileMover';
import { formatDateTime, formatFileSize } from '../utils/formatters';
import type { MoveOperation } from '../types';

export function HistoryPage() {
  const { history, loadHistory } = useHistoryStore();
  const { undoOperation } = useFileMover();
  const [target, setTarget] = useState<MoveOperation | null>(null);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 pb-28 md:pb-8 space-y-3">
      <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Riwayat Pemindahan</h2>

      {history.length === 0 ? (
        <EmptyState
          icon={<HistoryIcon size={48} />}
          title="Belum ada riwayat"
          description="Setiap pemindahan file akan tercatat di sini (maksimal 100 operasi terakhir)."
        />
      ) : (
        <div className="space-y-2">
          {history.map((op) => (
            <div
              key={op.id}
              className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 dark:text-white">
                  {op.fileCount} file ({formatFileSize(op.totalSize)})
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {op.sourceName ?? 'Sumber'} → {op.targetFolderName}
                  {op.fallback && ' · mode unduh'}
                </p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500">{formatDateTime(op.timestamp)}</p>
              </div>
              {op.reversed ? (
                <span className="text-xs text-slate-400">Dikembalikan</span>
              ) : (
                <button
                  onClick={() => setTarget(op)}
                  disabled={op.fallback}
                  title={op.fallback ? 'Mode unduh tidak bisa dibatalkan otomatis' : undefined}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Undo2 size={14} />
                  Kembalikan
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!target}
        title="Kembalikan File"
        message={`Kembalikan ${target?.fileCount ?? 0} file dari '${target?.targetFolderName ?? ''}' ke lokasi asalnya?`}
        confirmText="Kembalikan"
        onConfirm={() => {
          const op = target;
          setTarget(null);
          if (op) void undoOperation(op);
        }}
        onCancel={() => setTarget(null)}
      />
    </div>
  );
}
