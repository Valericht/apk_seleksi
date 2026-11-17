// ============================================================
// File operations abstraction (File System Access API + fallback)
// ============================================================

import type { MediaFile, MoveFileEntry } from '../types';
import { ROOT_DIR_NAME } from '../utils/constants';

export function supportsFileSystemAccess(): boolean {
  return typeof window !== 'undefined' && 'showDirectoryPicker' in window;
}

export async function ensurePermission(handle: FileSystemHandle, write = true): Promise<boolean> {
  const opts = { mode: write ? 'readwrite' : 'read' } as const;
  if (!handle.queryPermission || !handle.requestPermission) return true;
  if ((await handle.queryPermission(opts)) === 'granted') return true;
  return (await handle.requestPermission(opts)) === 'granted';
}

function sanitizeName(name: string): string {
  const clean = name.replace(/[\\/:*?"<>|]/g, '_').trim();
  return clean || 'Folder';
}

async function exists(dir: FileSystemDirectoryHandle, name: string): Promise<boolean> {
  try {
    await dir.getFileHandle(name);
    return true;
  } catch (e) {
    if (e instanceof DOMException && (e.name === 'NotFoundError' || e.name === 'TypeMismatchError')) {
      return e.name === 'TypeMismatchError';
    }
    throw e;
  }
}

/** Cari nama file yang belum dipakai di folder tujuan: foto.jpg -> foto (1).jpg */
async function uniqueName(dir: FileSystemDirectoryHandle, name: string): Promise<string> {
  if (!(await exists(dir, name))) return name;
  const dot = name.lastIndexOf('.');
  const base = dot > 0 ? name.slice(0, dot) : name;
  const ext = dot > 0 ? name.slice(dot) : '';
  for (let i = 1; i < 10000; i++) {
    const candidate = `${base} (${i})${ext}`;
    if (!(await exists(dir, candidate))) return candidate;
  }
  throw new Error('Tidak bisa membuat nama file unik');
}

/** Salin file lalu verifikasi ukuran. File sumber TIDAK dihapus di sini. */
async function copyVerified(src: File, destDir: FileSystemDirectoryHandle, name: string): Promise<void> {
  const dest = await destDir.getFileHandle(name, { create: true });
  const writable = await dest.createWritable();
  try {
    await src.stream().pipeTo(writable);
    const written = await dest.getFile();
    if (written.size !== src.size) throw new Error('Verifikasi ukuran file gagal');
  } catch (e) {
    try { await writable.abort(); } catch { /* sudah tertutup */ }
    try { await destDir.removeEntry(name); } catch { /* abaikan */ }
    throw e;
  }
}

export async function getDestinationDir(
  root: FileSystemDirectoryHandle,
  folderName: string,
): Promise<FileSystemDirectoryHandle> {
  const base = await root.getDirectoryHandle(ROOT_DIR_NAME, { create: true });
  return base.getDirectoryHandle(sanitizeName(folderName), { create: true });
}

/** Pindahkan satu file: salin -> verifikasi -> hapus sumber (atomic move). */
export async function moveMediaFile(media: MediaFile, destDir: FileSystemDirectoryHandle, folderName: string): Promise<MoveFileEntry> {
  if (!media.handle || !media.parentHandle) throw new Error('Akses file asli tidak tersedia');
  const src = await media.handle.getFile();
  const newName = await uniqueName(destDir, media.name);
  await copyVerified(src, destDir, newName);
  await media.parentHandle.removeEntry(media.name);
  return {
    fileName: media.name,
    newName,
    fromPath: `${media.parentPath ?? ''}/${media.name}`,
    toPath: `${ROOT_DIR_NAME}/${sanitizeName(folderName)}/${newName}`,
    fromDir: media.parentHandle,
    toDir: destDir,
  };
}

/** Kembalikan satu file ke lokasi asalnya. */
export async function reverseEntry(entry: MoveFileEntry): Promise<void> {
  if (!entry.fromDir || !entry.toDir) throw new Error('Handle folder tidak tersedia');
  const handle = await entry.toDir.getFileHandle(entry.newName);
  const file = await handle.getFile();
  const backName = await uniqueName(entry.fromDir, entry.fileName);
  await copyVerified(file, entry.fromDir, backName);
  await entry.toDir.removeEntry(entry.newName);
}

export async function deleteMediaFile(media: MediaFile): Promise<void> {
  if (!media.parentHandle) throw new Error('Akses file asli tidak tersedia');
  await media.parentHandle.removeEntry(media.name);
}

/** Mode fallback: "memindahkan" = download file. */
export function downloadFile(file: File, name: string = file.name): void {
  const url = URL.createObjectURL(file);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 15000);
}

export function describeError(e: unknown): string {
  if (e instanceof DOMException) {
    if (e.name === 'NotAllowedError') return 'Izin akses ditolak';
    if (e.name === 'QuotaExceededError') return 'Penyimpanan penuh';
    if (e.name === 'NoModificationAllowedError') return 'File sedang dipakai/terkunci';
    if (e.name === 'NotFoundError') return 'File tidak ditemukan';
  }
  return e instanceof Error ? e.message : String(e);
}

export async function getStorageEstimate(): Promise<{ usage: number; quota: number } | null> {
  try {
    if (navigator.storage?.estimate) {
      const est = await navigator.storage.estimate();
      if (est.quota) return { usage: est.usage ?? 0, quota: est.quota };
    }
  } catch { /* tidak tersedia */ }
  return null;
}
