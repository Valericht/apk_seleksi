interface ProgressOverlayProps {
  open: boolean;
  current: number;
  total: number;
  currentFileName?: string;
  title?: string;
  onCancel?: () => void;
}

export function ProgressOverlay({ open, current, total, currentFileName, title = 'Memindahkan file...', onCancel }: ProgressOverlayProps) {
  if (!open) return null;
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h3>
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-slate-500 dark:text-slate-400">
            <span>{current}/{total} file</span>
            <span>{pct}%</span>
          </div>
          <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500 rounded-full transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
          {currentFileName && (
            <p className="text-xs text-slate-400 dark:text-slate-500 truncate">{currentFileName}</p>
          )}
        </div>
        {onCancel && (
          <button
            onClick={onCancel}
            className="w-full py-2 text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
          >
            Batalkan
          </button>
        )}
      </div>
    </div>
  );
}
