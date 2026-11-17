import { useState, useEffect, useCallback, useRef } from 'react';
import type { PointerEvent } from 'react';
import { X, ChevronLeft, ChevronRight, FolderInput, Image, Film, CheckCircle2, Circle } from 'lucide-react';
import { formatFileSize, formatDate, formatDuration } from '../../utils/formatters';
import { LABEL_CONFIG } from '../../services/labelDetector';
import type { MediaFile } from '../../types';

interface PreviewModalProps {
  open: boolean;
  files: MediaFile[];
  initialIndex: number;
  isSelected: (id: string) => boolean;
  onToggleSelect: (file: MediaFile) => void;
  onClose: () => void;
  onMove: (file: MediaFile) => void;
}

const SWIPE_NAV_PX = 70;

export function PreviewModal({ open, files, initialIndex, isSelected, onToggleSelect, onClose, onMove }: PreviewModalProps) {
  const [index, setIndex] = useState(initialIndex);
  const [src, setSrc] = useState('');
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dims, setDims] = useState<{ w: number; h: number; duration?: number } | null>(null);
  const [gesturing, setGesturing] = useState(false);

  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinchStart = useRef<{ dist: number; scale: number } | null>(null);
  const dragStart = useRef<{ x: number; y: number; pan: { x: number; y: number } } | null>(null);

  useEffect(() => {
    setIndex(initialIndex);
  }, [initialIndex]);

  // jaga index tetap valid jika daftar berubah (mis. file dipindah)
  useEffect(() => {
    if (files.length > 0 && index >= files.length) setIndex(files.length - 1);
  }, [files.length, index]);

  const file = files[index];

  useEffect(() => {
    setScale(1);
    setPan({ x: 0, y: 0 });
    setDims(null);
    if (!open || !file?.file) {
      setSrc('');
      return;
    }
    const url = URL.createObjectURL(file.file);
    setSrc(url);
    return () => URL.revokeObjectURL(url);
  }, [open, file]);

  const goNext = useCallback(() => {
    if (files.length) setIndex((i) => (i + 1) % files.length);
  }, [files.length]);

  const goPrev = useCallback(() => {
    if (files.length) setIndex((i) => (i - 1 + files.length) % files.length);
  }, [files.length]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, goNext, goPrev, onClose]);

  const dist = () => {
    const [a, b] = Array.from(pointers.current.values());
    return Math.hypot(a.x - b.x, a.y - b.y);
  };

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (file?.type === 'video') return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    e.currentTarget.setPointerCapture(e.pointerId);
    setGesturing(true);
    if (pointers.current.size === 2) {
      pinchStart.current = { dist: dist(), scale };
      dragStart.current = null;
    } else {
      dragStart.current = { x: e.clientX, y: e.clientY, pan };
    }
  };

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2 && pinchStart.current) {
      const next = (dist() / pinchStart.current.dist) * pinchStart.current.scale;
      setScale(Math.min(5, Math.max(1, next)));
    } else if (dragStart.current && scale > 1) {
      setPan({
        x: dragStart.current.pan.x + (e.clientX - dragStart.current.x),
        y: dragStart.current.pan.y + (e.clientY - dragStart.current.y),
      });
    }
  };

  const onPointerUp = (e: PointerEvent<HTMLDivElement>) => {
    const start = dragStart.current;
    pointers.current.delete(e.pointerId);
    if (pointers.current.size === 0) setGesturing(false);
    pinchStart.current = null;
    dragStart.current = null;
    if (scale <= 1.01) {
      setScale(1);
      setPan({ x: 0, y: 0 });
      // swipe kiri/kanan untuk pindah file
      if (start && pointers.current.size === 0) {
        const dx = e.clientX - start.x;
        const dy = e.clientY - start.y;
        if (Math.abs(dx) > SWIPE_NAV_PX && Math.abs(dx) > Math.abs(dy) * 1.5) {
          if (dx < 0) goNext();
          else goPrev();
        }
      }
    }
  };

  const toggleZoom = () => {
    if (scale > 1) {
      setScale(1);
      setPan({ x: 0, y: 0 });
    } else {
      setScale(2.5);
    }
  };

  if (!open || !file) return null;

  const labelInfo = file.label ? LABEL_CONFIG[file.label] : null;
  const selected = isSelected(file.id);

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col" role="dialog" aria-modal="true" aria-label={`Preview ${file.name}`}>
      {/* Top bar */}
      <div className="flex items-center justify-between gap-2 px-4 py-3 bg-black/80">
        <button onClick={onClose} aria-label="Tutup preview" className="p-2 hover:bg-white/10 rounded-lg">
          <X size={20} className="text-white" />
        </button>
        <div className="text-center min-w-0">
          <p className="text-white text-sm font-medium truncate max-w-[180px] sm:max-w-sm">{file.name}</p>
          <p className="text-white/60 text-xs">{index + 1} / {files.length}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onToggleSelect(file)}
            aria-pressed={selected}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg ${
              selected ? 'bg-white text-indigo-600' : 'bg-white/10 hover:bg-white/20 text-white'
            }`}
          >
            {selected ? <CheckCircle2 size={14} /> : <Circle size={14} />}
            <span className="hidden sm:inline">{selected ? 'Dipilih' : 'Pilih'}</span>
          </button>
          <button
            onClick={() => onMove(file)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white text-sm rounded-lg"
          >
            <FolderInput size={14} />
            <span className="hidden sm:inline">Pindahkan</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div
        className="flex-1 flex items-center justify-center relative overflow-hidden touch-none"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <button onClick={goPrev} aria-label="Sebelumnya" className="absolute left-2 z-10 p-2 bg-black/40 hover:bg-black/60 rounded-full">
          <ChevronLeft size={24} className="text-white" />
        </button>
        <button onClick={goNext} aria-label="Berikutnya" className="absolute right-2 z-10 p-2 bg-black/40 hover:bg-black/60 rounded-full">
          <ChevronRight size={24} className="text-white" />
        </button>

        {src && file.type === 'photo' && (
          <img
            src={src}
            alt={file.name}
            draggable={false}
            onDoubleClick={toggleZoom}
            onLoad={(e) => setDims({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })}
            className="max-w-full max-h-full object-contain select-none"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
              transition: gesturing ? 'none' : 'transform 0.15s ease-out',
            }}
          />
        )}
        {src && file.type === 'video' && (
          <video
            key={src}
            src={src}
            controls
            playsInline
            onLoadedMetadata={(e) =>
              setDims({ w: e.currentTarget.videoWidth, h: e.currentTarget.videoHeight, duration: e.currentTarget.duration })
            }
            className="max-w-full max-h-full"
          />
        )}
        {!src && <p className="text-white/60 text-sm">File tidak dapat ditampilkan</p>}
      </div>

      {/* Bottom info */}
      <div className="px-4 py-3 bg-black/80 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-white/60 text-xs">
        {file.type === 'photo' ? <Image size={12} /> : <Film size={12} />}
        <span>{formatFileSize(file.size)}</span>
        <span>{formatDate(file.lastModified)}</span>
        {dims && dims.w > 0 && <span>{dims.w}×{dims.h}</span>}
        {dims?.duration !== undefined && Number.isFinite(dims.duration) && <span>{formatDuration(dims.duration)}</span>}
        {labelInfo && file.label !== 'unknown' && <span style={{ color: labelInfo.color }}>{labelInfo.emoji} {labelInfo.text}</span>}
      </div>
    </div>
  );
}
