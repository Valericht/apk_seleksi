import { useEffect, useRef, useState } from 'react';
import type { MediaFile } from '../types';
import { getCachedThumbnail, getThumbnail } from '../services/thumbnailService';

/** Generate thumbnail hanya saat elemen terlihat di layar. */
export function useThumbnail(file: MediaFile) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [url, setUrl] = useState<string | null>(() => getCachedThumbnail(file.id) ?? null);

  useEffect(() => {
    if (url || !file.file) return;
    const el = ref.current;
    if (!el) return;
    let cancelled = false;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          observer.disconnect();
          getThumbnail(file.id, file.file!, file.type).then((u) => {
            if (!cancelled && u) setUrl(u);
          });
        }
      },
      { rootMargin: '300px' },
    );
    observer.observe(el);
    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, [file, url]);

  return { ref, url };
}
