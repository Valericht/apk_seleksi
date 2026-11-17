// ============================================================
// File type constants and detection utilities
// ============================================================

export const PHOTO_EXTENSIONS = new Set([
  '.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif',
  '.gif', '.bmp', '.svg', '.tiff', '.tif', '.avif',
]);

export const VIDEO_EXTENSIONS = new Set([
  '.mp4', '.mov', '.avi', '.mkv', '.webm',
  '.3gp', '.flv', '.wmv', '.m4v',
]);

export const PHOTO_MIME_TYPES = new Set([
  'image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif',
  'image/gif', 'image/bmp', 'image/svg+xml', 'image/tiff', 'image/avif',
]);

export const VIDEO_MIME_TYPES = new Set([
  'video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska',
  'video/webm', 'video/3gpp', 'video/x-flv', 'video/x-ms-wmv', 'video/x-m4v',
]);

export function getFileExtension(filename: string): string {
  const idx = filename.lastIndexOf('.');
  return idx >= 0 ? filename.slice(idx).toLowerCase() : '';
}

export function isPhoto(filename: string, mimeType?: string): boolean {
  if (mimeType && PHOTO_MIME_TYPES.has(mimeType)) return true;
  return PHOTO_EXTENSIONS.has(getFileExtension(filename));
}

export function isVideo(filename: string, mimeType?: string): boolean {
  if (mimeType && VIDEO_MIME_TYPES.has(mimeType)) return true;
  return VIDEO_EXTENSIONS.has(getFileExtension(filename));
}

export function isMediaFile(filename: string, mimeType?: string): boolean {
  return isPhoto(filename, mimeType) || isVideo(filename, mimeType);
}

export function getMediaType(filename: string, mimeType?: string): 'photo' | 'video' | null {
  if (isPhoto(filename, mimeType)) return 'photo';
  if (isVideo(filename, mimeType)) return 'video';
  return null;
}
