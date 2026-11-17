import { memo, useRef } from 'react';
import type { KeyboardEvent, MouseEvent, PointerEvent } from 'react';
import { Check, Copy, Film, Image } from 'lucide-react';
import { formatFileSize, formatDate } from '../../utils/formatters';
import { LABEL_CONFIG } from '../../services/labelDetector';
import { useThumbnail } from '../../hooks/useThumbnail';
import type { MediaFile } from '../../types';

interface ThumbnailCardProps {
  file: MediaFile;
  selected: boolean;
  selecting: boolean;
  viewMode: 'grid' | 'list';
  isDuplicate?: boolean;
  onToggle: (file: MediaFile) => void;
  onOpen: (file: MediaFile) => void;
}

const LONG_PRESS_MS = 450;

export const ThumbnailCard = memo(function ThumbnailCard({
  file,
  selected,
  selecting,
  viewMode,
  isDuplicate,
  onToggle,
  onOpen,
}: ThumbnailCardProps) {
  const { ref, url } = useThumbnail(file);
  const labelInfo = file.label ? LABEL_CONFIG[file.label] : null;
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressed = useRef(false);

  const clearPress = () => {
    if (pressTimer.current) clearTimeout(pressTimer.current);
    pressTimer.current = null;
  };

  // Long-press (mobile) untuk memilih
  const onPointerDown = (e: PointerEvent) => {
    if (e.pointerType === 'mouse') return;
    longPressed.current = false;
    clearPress();
    pressTimer.current = setTimeout(() => {
      longPressed.current = true;
      navigator.vibrate?.(20);
      onToggle(file);
    }, LONG_PRESS_MS);
  };

  const handleClick = () => {
    if (longPressed.current) {
      longPressed.current = false;
      return;
    }
    if (selecting) onToggle(file);
    else onOpen(file);
  };

  // Klik kanan (desktop) untuk memilih
  const handleContextMenu = (e: MouseEvent) => {
    e.preventDefault();
    onToggle(file);
  };

  const handleKey = (e: KeyboardEvent) => {
    if (e.key === 'Enter') onOpen(file);
    if (e.key === ' ') {
      e.preventDefault();
      onToggle(file);
    }
  };

  const handleCheck = (e: MouseEvent) => {
    e.stopPropagation();
    onToggle(file);
  };

  const interaction = {
    role: 'button' as const,
    tabIndex: 0,
    'aria-pressed': selected,
    'aria-label': `${file.name}${selected ? ', dipilih' : ''}`,
    onClick: handleClick,
    onContextMenu: handleContextMenu,
    onKeyDown: handleKey,
    onPointerDown,
    onPointerUp: clearPress,
    onPointerLeave: clearPress,
    onPointerCancel: clearPress,
  };

  if (viewMode === 'list') {
    return (
      <div
        {...interaction}
        className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer select-none ${
          selected
            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30'
            : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
        }`}
      >
        <div
          ref={ref}
          className="relative w-12 h-12 rounded-lg overflow-hidden bg-slate-200 dark:bg-slate-700 flex-shrink-0"
        >
          {url ? (
            <img src={url} alt="" className="w-full h-full object-cover" draggable={false} />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              {file.type === 'video' ? <Film size={20} className="text-slate-400" /> : <Image size={20} className="text-slate-400" />}
            </div>
          )}
          {selected && (
            <div className="absolute inset-0 bg-indigo-500/30 flex items-center justify-center">
              <div className="bg-indigo-500 rounded-full p-0.5 check-enter">
                <Check size={12} className="text-white" />
              </div>
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{file.name}</p>
          <div className="flex flex-wrap items-center gap-x-2 text-xs text-slate-500 dark:text-slate-400">
            <span>{formatFileSize(file.size)}</span>
            <span>•</span>
            <span>{formatDate(file.lastModified)}</span>
            {labelInfo && file.label !== 'unknown' && (
              <>
                <span>•</span>
                <span style={{ color: labelInfo.color }}>{labelInfo.emoji} {labelInfo.text}</span>
              </>
            )}
            {isDuplicate && (
              <>
                <span>•</span>
                <span className="text-amber-500">Duplikat</span>
              </>
            )}
          </div>
        </div>
        <div className="flex-shrink-0">
          {file.type === 'photo' ? (
            <Image size={16} className="text-blue-500" />
          ) : (
            <Film size={16} className="text-purple-500" />
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      {...interaction}
      className={`thumbnail-card relative rounded-xl overflow-hidden border cursor-pointer group select-none ${
        selected
          ? 'border-indigo-500 ring-2 ring-indigo-500/30'
          : 'border-slate-200 dark:border-slate-700'
      }`}
    >
      <div ref={ref} className="aspect-square bg-slate-200 dark:bg-slate-700 relative">
        {url ? (
          <img
            src={url}
            alt=""
            className={`w-full h-full object-cover transition-transform ${selected ? 'scale-90 rounded-lg' : ''}`}
            draggable={false}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            {file.type === 'video' ? <Film size={32} className="text-slate-400" /> : <Image size={32} className="text-slate-400" />}
          </div>
        )}

        {/* Selection checkbox */}
        <button
          type="button"
          onClick={handleCheck}
          aria-label={selected ? 'Batalkan pilihan' : 'Pilih file'}
          className={`absolute top-2 left-2 transition-opacity ${
            selected || selecting ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 focus:opacity-100'
          }`}
        >
          <div
            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
              selected ? 'bg-indigo-500 border-indigo-500 check-enter' : 'border-white/80 bg-black/20'
            }`}
          >
            {selected && <Check size={14} className="text-white" />}
          </div>
        </button>

        {file.type === 'video' && (
          <div className="absolute top-2 right-2 bg-black/60 rounded-md px-1.5 py-0.5 flex items-center gap-1">
            <Film size={10} className="text-white" />
            <span className="text-[10px] text-white font-medium">Video</span>
          </div>
        )}

        {isDuplicate && (
          <div className="absolute top-9 right-2 bg-amber-500 rounded-md px-1.5 py-0.5 flex items-center gap-1">
            <Copy size={10} className="text-white" />
            <span className="text-[10px] text-white font-medium">Duplikat</span>
          </div>
        )}

        {labelInfo && file.label !== 'unknown' && (
          <div className="absolute bottom-2 left-2 bg-black/60 rounded-md px-1.5 py-0.5">
            <span className="text-[10px] text-white">{labelInfo.emoji} {labelInfo.text}</span>
          </div>
        )}

        <div className="absolute bottom-2 right-2 bg-black/60 rounded-md px-1.5 py-0.5">
          <span className="text-[10px] text-white">{formatFileSize(file.size)}</span>
        </div>
      </div>
    </div>
  );
});
