import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, CheckCircle2, Film, SkipForward, Settings2 } from 'lucide-react';
import { EmptyState } from '../components/common/EmptyState';
import { useToastStore } from '../components/common/ToastContainer';
import { useFilteredMedia } from '../hooks/useMediaScanner';
import { useSwipeGesture } from '../hooks/useSwipeGesture';
import { useFileMover } from '../hooks/useFileMover';
import { useFolderStore } from '../stores/folderStore';
import { usePreferenceStore } from '../stores/preferenceStore';
import type { PageType, SwipeDirection } from '../types';

const DIRS: { dir: SwipeDirection; label: string; icon: React.ReactNode; pos: string }[] = [
  { dir: 'up', label: 'Atas', icon: <ArrowUp size={16} />, pos: 'top-2 left-1/2 -translate-x-1/2' },
  { dir: 'down', label: 'Bawah', icon: <ArrowDown size={16} />, pos: 'bottom-2 left-1/2 -translate-x-1/2' },
  { dir: 'left', label: 'Kiri', icon: <ArrowLeft size={16} />, pos: 'left-2 top-1/2 -translate-y-1/2' },
  { dir: 'right', label: 'Kanan', icon: <ArrowRight size={16} />, pos: 'right-2 top-1/2 -translate-y-1/2' },
];

interface SwipeSortPageProps {
  onNavigate: (page: PageType) => void;
}

export function SwipeSortPage({ onNavigate }: SwipeSortPageProps) {
  const files = useFilteredMedia();
  const folders = useFolderStore((s) => s.folders);
  const swipeMap = usePreferenceStore((s) => s.swipeMap);
  const setSwipeAssignment = usePreferenceStore((s) => s.setSwipeAssignment);
  const addToast = useToastStore((s) => s.addToast);
  const { moveFiles } = useFileMover();

  const [total] = useState(() => files.length);
  const [skipped, setSkipped] = useState<Set<string>>(new Set());
  const [showConfig, setShowConfig] = useState(false);
  const [src, setSrc] = useState('');
  const busy = useRef(false);

  const queue = files.filter((f) => !skipped.has(f.id));
  const current = queue[0];
  const processed = Math.max(0, total - queue.length);

  useEffect(() => {
    if (!current?.file) {
      setSrc('');
      return;
    }
    const url = URL.createObjectURL(current.file);
    setSrc(url);
    return () => URL.revokeObjectURL(url);
  }, [current]);

  const label = useCallback(
    (dir: SwipeDirection) => {
      const a = swipeMap[dir];
      if (a === 'skip') return 'Lewati';
      if (!a) return 'Belum diatur';
      const f = folders.find((x) => x.id === a);
      return f ? `${f.emoji} ${f.name}` : 'Folder dihapus';
    },
    [swipeMap, folders],
  );

  const handleSwipe = useCallback(
    async (dir: SwipeDirection) => {
      if (!current || busy.current) return;
      const assigned = swipeMap[dir];
      if (assigned === 'skip') {
        setSkipped((prev) => new Set(prev).add(current.id));
        return;
      }
      const folder = folders.find((f) => f.id === assigned);
      if (!folder) {
        addToast({ type: 'warning', message: `Atur folder untuk arah ${dir} dulu (ikon pengaturan).`, duration: 4000 });
        setShowConfig(true);
        return;
      }
      busy.current = true;
      try {
        await moveFiles([current], folder, { silent: true });
      } finally {
        busy.current = false;
      }
    },
    [current, swipeMap, folders, moveFiles, addToast],
  );

  const { offset, dragging, activeDir, handlers } = useSwipeGesture((d) => void handleSwipe(d));

  // Dukungan keyboard (desktop)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && ['INPUT', 'SELECT', 'TEXTAREA'].includes(target.tagName)) return;
      const map: Record<string, SwipeDirection> = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down' };
      const dir = map[e.key];
      if (dir) {
        e.preventDefault();
        void handleSwipe(dir);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleSwipe]);

  if (total === 0) {
    return (
      <EmptyState
        icon={<Film size={48} />}
        title="Belum ada file"
        description="Buka folder sumber di Beranda dulu, lalu kembali ke Sort Cepat."
        action={
          <button onClick={() => onNavigate('home')} className="px-4 py-2 bg-indigo-500 text-white rounded-xl text-sm font-medium">
            Ke Beranda
          </button>
        }
      />
    );
  }

  if (!current) {
    return (
      <EmptyState
        icon={<CheckCircle2 size={56} className="text-green-500" />}
        title="Selesai!"
        description={`${processed} dari ${total} file sudah disortir.`}
        action={
          <button onClick={() => onNavigate('home')} className="px-4 py-2 bg-indigo-500 text-white rounded-xl text-sm font-medium">
            Kembali ke Beranda
          </button>
        }
      />
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-3 pb-28 md:pb-6 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
          {processed}/{total} file sudah disortir
        </p>
        <button
          onClick={() => setShowConfig((v) => !v)}
          aria-label="Atur arah swipe"
          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
        >
          <Settings2 size={18} />
        </button>
      </div>
      <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
        <div className="h-full bg-indigo-500 transition-all" style={{ width: `${(processed / total) * 100}%` }} />
      </div>

      {showConfig && (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 grid grid-cols-2 gap-2">
          {DIRS.map((d) => (
            <label key={d.dir} className="text-xs text-slate-500 dark:text-slate-400 space-y-1">
              <span className="flex items-center gap-1">{d.icon} Swipe {d.label}</span>
              <select
                value={swipeMap[d.dir] ?? ''}
                onChange={(e) => setSwipeAssignment(d.dir, e.target.value === '' ? null : e.target.value)}
                className="w-full bg-slate-100 dark:bg-slate-900 rounded-lg px-2 py-1.5 text-sm text-slate-900 dark:text-white"
              >
                <option value="">Belum diatur</option>
                <option value="skip">Lewati</option>
                {folders.map((f) => (
                  <option key={f.id} value={f.id}>{f.emoji} {f.name}</option>
                ))}
              </select>
            </label>
          ))}
          {folders.length === 0 && (
            <p className="col-span-2 text-xs text-amber-500">Belum ada folder. Buat folder dulu di tab Folder.</p>
          )}
        </div>
      )}

      {/* Kartu */}
      <div className="relative h-[56dvh] md:h-[60vh] rounded-2xl bg-slate-100 dark:bg-slate-900 overflow-hidden">
        {DIRS.map((d) => (
          <div
            key={d.dir}
            className={`absolute ${d.pos} z-10 px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1 transition-all pointer-events-none ${
              activeDir === d.dir ? 'bg-indigo-500 text-white scale-110' : 'bg-black/40 text-white/90'
            }`}
          >
            {d.icon}
            <span className="max-w-[110px] truncate">{label(d.dir)}</span>
          </div>
        ))}

        <div
          {...handlers}
          className="absolute inset-10 flex items-center justify-center touch-none cursor-grab active:cursor-grabbing select-none"
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px) rotate(${offset.x / 20}deg)`,
            transition: dragging ? 'none' : 'transform 0.2s ease-out',
          }}
        >
          {src && current.type === 'photo' && (
            <img src={src} alt={current.name} draggable={false} className="max-w-full max-h-full object-contain rounded-xl shadow-lg pointer-events-none" />
          )}
          {src && current.type === 'video' && (
            <video key={src} src={src} muted loop autoPlay playsInline className="max-w-full max-h-full rounded-xl shadow-lg pointer-events-none" />
          )}
        </div>
      </div>

      <p className="text-center text-xs text-slate-500 dark:text-slate-400 truncate">{current.name}</p>

      <div className="grid grid-cols-4 gap-2">
        {DIRS.filter((d) => d.dir !== 'down').map((d) => (
          <button
            key={d.dir}
            onClick={() => void handleSwipe(d.dir)}
            className="flex flex-col items-center gap-1 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 hover:border-indigo-400"
          >
            {d.icon}
            <span className="max-w-full truncate px-1">{label(d.dir)}</span>
          </button>
        ))}
        <button
          onClick={() => setSkipped((prev) => new Set(prev).add(current.id))}
          className="flex flex-col items-center gap-1 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
        >
          <SkipForward size={16} />
          Lewati
        </button>
      </div>
    </div>
  );
}
