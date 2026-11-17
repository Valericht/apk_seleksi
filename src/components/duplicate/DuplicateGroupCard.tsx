import { Check, Film, Image } from 'lucide-react';
import { useThumbnail } from '../../hooks/useThumbnail';
import { formatDate, formatFileSize } from '../../utils/formatters';
import type { DuplicateGroup } from '../../stores/duplicateStore';
import type { MediaFile } from '../../types';

function MiniThumb({ file, keep, onKeep }: { file: MediaFile; keep: boolean; onKeep: () => void }) {
  const { ref, url } = useThumbnail(file);
  return (
    <button
      onClick={onKeep}
      aria-pressed={keep}
      className={`flex-shrink-0 w-32 rounded-xl overflow-hidden border text-left transition-all ${
        keep ? 'border-green-500 ring-2 ring-green-500/30' : 'border-slate-200 dark:border-slate-700 opacity-80'
      }`}
    >
      <div ref={ref} className="relative aspect-square bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
        {url ? (
          <img src={url} alt="" className="w-full h-full object-cover" draggable={false} />
        ) : file.type === 'video' ? (
          <Film size={24} className="text-slate-400" />
        ) : (
          <Image size={24} className="text-slate-400" />
        )}
        {keep && (
          <div className="absolute top-1.5 left-1.5 bg-green-500 rounded-full p-0.5">
            <Check size={12} className="text-white" />
          </div>
        )}
      </div>
      <div className="p-2 bg-white dark:bg-slate-800">
        <p className="text-[11px] font-medium text-slate-800 dark:text-slate-200 truncate">{file.name}</p>
        <p className="text-[10px] text-slate-500">{formatFileSize(file.size)} · {formatDate(file.lastModified)}</p>
        <p className="text-[10px] text-slate-400 truncate">{file.parentPath ?? ''}</p>
      </div>
    </button>
  );
}

interface DuplicateGroupCardProps {
  group: DuplicateGroup;
  keepId: string;
  canDelete: boolean;
  onKeep: (id: string) => void;
  onResolve: () => void;
}

export function DuplicateGroupCard({ group, keepId, canDelete, onKeep, onResolve }: DuplicateGroupCardProps) {
  const extra = group.files.length - 1;
  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 space-y-3">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {group.files.map((f) => (
          <MiniThumb key={f.id} file={f} keep={f.id === keepId} onKeep={() => onKeep(f.id)} />
        ))}
      </div>
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {group.files.length} file mirip · hemat {formatFileSize(group.files[0].size * extra)}
        </p>
        <button
          onClick={onResolve}
          disabled={!canDelete}
          className="px-3 py-1.5 text-xs font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Simpan 1, hapus sisanya
        </button>
      </div>
    </div>
  );
}
