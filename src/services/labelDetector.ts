// ============================================================
// Label detector — detects source of media files
// ============================================================

import type { MediaLabel } from '../types';

export function detectLabel(fileName: string, path?: string): MediaLabel {
  const lowerName = fileName.toLowerCase();
  const lowerPath = (path || '').toLowerCase();

  // Screenshot detection
  if (
    lowerName.includes('screenshot') ||
    lowerName.includes('screen_shot') ||
    lowerName.includes('screen shot') ||
    lowerPath.includes('screenshot')
  ) {
    return 'screenshot';
  }

  // WhatsApp
  if (
    lowerName.includes('whatsapp') ||
    lowerName.startsWith('img-') ||
    lowerName.startsWith('vid-') ||
    lowerPath.includes('whatsapp')
  ) {
    return 'whatsapp';
  }

  // Telegram
  if (
    lowerName.includes('telegram') ||
    lowerPath.includes('telegram')
  ) {
    return 'telegram';
  }

  // Download
  if (lowerPath.includes('download')) {
    return 'download';
  }

  // Edited
  if (
    lowerName.includes('edited') ||
    lowerName.includes('_edit') ||
    lowerName.includes('-edit')
  ) {
    return 'edited';
  }

  // Camera patterns
  if (
    lowerName.startsWith('img_') ||
    lowerName.startsWith('dsc') ||
    lowerName.startsWith('photo_') ||
    lowerName.startsWith('vid_') ||
    lowerName.startsWith('video_') ||
    lowerPath.includes('dcim') ||
    lowerPath.includes('camera')
  ) {
    return 'camera';
  }

  return 'unknown';
}

export const LABEL_CONFIG: Record<MediaLabel, { emoji: string; text: string; color: string }> = {
  camera: { emoji: '📸', text: 'Kamera', color: '#3B82F6' },
  screenshot: { emoji: '📱', text: 'Screenshot', color: '#8B5CF6' },
  whatsapp: { emoji: '💬', text: 'WhatsApp', color: '#22C55E' },
  telegram: { emoji: '📲', text: 'Telegram', color: '#0EA5E9' },
  download: { emoji: '⬇️', text: 'Download', color: '#F59E0B' },
  edited: { emoji: '🖼️', text: 'Edited', color: '#EC4899' },
  unknown: { emoji: '📄', text: 'Lainnya', color: '#64748B' },
};
