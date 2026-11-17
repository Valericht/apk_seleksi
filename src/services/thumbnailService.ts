// ============================================================
// Thumbnail generation (lazy, cached, concurrency-limited)
// ============================================================

const cache = new Map<string, string>();
const inflight = new Map<string, Promise<string | null>>();
const MAX_CONCURRENT = 4;
const THUMB_SIZE = 320;

let active = 0;
const queue: Array<() => void> = [];

function schedule<T>(task: () => Promise<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const exec = () => {
      active++;
      task()
        .then(resolve, reject)
        .finally(() => {
          active--;
          queue.shift()?.();
        });
    };
    if (active < MAX_CONCURRENT) exec();
    else queue.push(exec);
  });
}

function canvasToUrl(canvas: HTMLCanvasElement): Promise<string | null> {
  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => resolve(blob ? URL.createObjectURL(blob) : null),
      'image/jpeg',
      0.75,
    );
  });
}

async function imageThumb(file: File): Promise<string | null> {
  try {
    const bmp = await createImageBitmap(file, { resizeWidth: THUMB_SIZE, resizeQuality: 'low' });
    const canvas = document.createElement('canvas');
    canvas.width = bmp.width;
    canvas.height = bmp.height;
    canvas.getContext('2d')?.drawImage(bmp, 0, 0);
    bmp.close();
    return await canvasToUrl(canvas);
  } catch {
    // SVG/GIF/format yang tidak didukung decoder: pakai file asli
    if (file.type === 'image/svg+xml' || file.type === 'image/gif') {
      return URL.createObjectURL(file);
    }
    return null;
  }
}

function videoThumb(file: File): Promise<string | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.muted = true;
    video.preload = 'metadata';
    video.playsInline = true;
    let done = false;

    const finish = (result: string | null) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      video.removeAttribute('src');
      video.load();
      URL.revokeObjectURL(url);
      resolve(result);
    };

    const timer = setTimeout(() => finish(null), 8000);
    video.onerror = () => finish(null);
    video.onloadeddata = () => {
      const t = Number.isFinite(video.duration) ? Math.min(1, video.duration / 10) : 0;
      video.currentTime = t;
    };
    video.onseeked = () => {
      const scale = Math.min(1, THUMB_SIZE / (video.videoWidth || THUMB_SIZE));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round((video.videoWidth || THUMB_SIZE) * scale));
      canvas.height = Math.max(1, Math.round((video.videoHeight || THUMB_SIZE) * scale));
      canvas.getContext('2d')?.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvasToUrl(canvas).then(finish);
    };
    video.src = url;
  });
}

export function getCachedThumbnail(id: string): string | undefined {
  return cache.get(id);
}

export function getThumbnail(id: string, file: File, type: 'photo' | 'video'): Promise<string | null> {
  const hit = cache.get(id);
  if (hit) return Promise.resolve(hit);
  const running = inflight.get(id);
  if (running) return running;

  const p = schedule(() => (type === 'photo' ? imageThumb(file) : videoThumb(file)))
    .then((url) => {
      if (url) cache.set(id, url);
      return url;
    })
    .finally(() => inflight.delete(id));
  inflight.set(id, p);
  return p;
}

export function releaseThumbnails(ids?: string[]): void {
  const keys = ids ?? Array.from(cache.keys());
  for (const id of keys) {
    const url = cache.get(id);
    if (url) {
      URL.revokeObjectURL(url);
      cache.delete(id);
    }
  }
}
