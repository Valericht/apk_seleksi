import { useEffect, useMemo, useState } from 'react';
import { HardDrive, Image, Film } from 'lucide-react';
import { useMediaStore } from '../../stores/mediaStore';
import { formatFileSize } from '../../utils/formatters';
import { getStorageEstimate } from '../../services/fileService';

export function StorageDashboard() {
  const files = useMediaStore((s) => s.files);
  const [free, setFree] = useState<number | null>(null);

  useEffect(() => {
    getStorageEstimate().then((est) => {
      if (est) setFree(Math.max(0, est.quota - est.usage));
    });
  }, []);

  const totals = useMemo(() => {
    let photos = 0;
    let videos = 0;
    let size = 0;
    for (const f of files) {
      if (f.type === 'photo') photos++;
      else videos++;
      size += f.size;
    }
    return { photos, videos, size };
  }, [files]);

  if (files.length === 0) return null;

  return (
    <div className="mx-4 mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
      <Stat icon={<Image size={14} className="text-blue-500" />} label="Foto" value={String(totals.photos)} />
      <Stat icon={<Film size={14} className="text-purple-500" />} label="Video" value={String(totals.videos)} />
      <Stat icon={<HardDrive size={14} className="text-indigo-500" />} label="Total ukuran" value={formatFileSize(totals.size)} />
      <Stat
        icon={<HardDrive size={14} className="text-emerald-500" />}
        label="Sisa kuota browser"
        value={free !== null ? formatFileSize(free) : '—'}
      />
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2">
      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
        {icon}
        {label}
      </div>
      <p className="text-sm font-semibold text-slate-900 dark:text-white mt-0.5">{value}</p>
    </div>
  );
}
