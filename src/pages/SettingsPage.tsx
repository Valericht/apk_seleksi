import { useEffect, useState } from 'react';
import { Monitor, Moon, Sun } from 'lucide-react';
import { usePreferenceStore } from '../stores/preferenceStore';
import { useMediaStore } from '../stores/mediaStore';
import { formatFileSize } from '../utils/formatters';
import { getStorageEstimate, supportsFileSystemAccess } from '../services/fileService';
import type { ViewMode } from '../types';

const THEMES = [
  { value: 'light', label: 'Terang', icon: <Sun size={16} /> },
  { value: 'dark', label: 'Gelap', icon: <Moon size={16} /> },
  { value: 'system', label: 'Sistem', icon: <Monitor size={16} /> },
] as const;

export function SettingsPage() {
  const { theme, setTheme, viewMode, setViewMode, gridColumns, setGridColumns, filter, setFilter } = usePreferenceStore();
  const sourceName = useMediaStore((s) => s.sourceHandle?.name);
  const clearFiles = useMediaStore((s) => s.clearFiles);
  const mode = useMediaStore((s) => s.mode);
  const [est, setEst] = useState<{ usage: number; quota: number } | null>(null);

  useEffect(() => {
    getStorageEstimate().then(setEst);
  }, []);

  const section = 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 space-y-3';
  const seg = (active: boolean) =>
    `flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-colors ${
      active ? 'bg-indigo-500 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
    }`;

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 pb-28 md:pb-8 space-y-4">
      <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Pengaturan</h2>

      <section className={section}>
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Tema</h3>
        <div className="flex gap-2">
          {THEMES.map((t) => (
            <button key={t.value} onClick={() => setTheme(t.value)} className={seg(theme === t.value)}>
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>
      </section>

      <section className={section}>
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Tampilan</h3>
        <div className="flex gap-2">
          {(['grid', 'list'] as ViewMode[]).map((v) => (
            <button key={v} onClick={() => setViewMode(v)} className={seg(viewMode === v)}>
              {v === 'grid' ? 'Grid' : 'Daftar'}
            </button>
          ))}
        </div>
        <div>
          <label className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
            <span>Jumlah kolom grid</span>
            <span>{gridColumns === 0 ? 'Otomatis' : gridColumns}</span>
          </label>
          <input
            type="range"
            min={1}
            max={8}
            step={1}
            value={gridColumns === 0 ? 1 : gridColumns}
            onChange={(e) => {
              const n = Number(e.target.value);
              setGridColumns(n === 1 ? 0 : n);
            }}
            className="w-full accent-indigo-500"
            aria-label="Jumlah kolom grid"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'photo', 'video'] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={seg(filter === f)}>
              {f === 'all' ? 'Semua' : f === 'photo' ? 'Foto' : 'Video'}
            </button>
          ))}
        </div>
        <p className="text-[11px] text-slate-400">Filter default saat membuka beranda.</p>
      </section>

      <section className={section}>
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Penyimpanan & Sumber</h3>
        <dl className="text-sm space-y-1 text-slate-600 dark:text-slate-300">
          <div className="flex justify-between">
            <dt>Mode</dt>
            <dd>
              {supportsFileSystemAccess() ? 'Akses folder langsung' : 'Fallback (input file + unduh)'}
            </dd>
          </div>
          {sourceName && (
            <div className="flex justify-between">
              <dt>Folder sumber</dt>
              <dd className="truncate max-w-[60%]">{sourceName}</dd>
            </div>
          )}
          {est && (
            <>
              <div className="flex justify-between">
                <dt>Kuota browser terpakai</dt>
                <dd>{formatFileSize(est.usage)}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Kuota browser tersisa</dt>
                <dd>{formatFileSize(Math.max(0, est.quota - est.usage))}</dd>
              </div>
            </>
          )}
        </dl>
        {mode && (
          <button
            onClick={clearFiles}
            className="w-full py-2 text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
          >
            Lepas folder sumber
          </button>
        )}
      </section>

      <p className="text-center text-xs text-slate-400">Media Seleksi v1.0 · data tersimpan lokal di perangkat</p>
    </div>
  );
}
