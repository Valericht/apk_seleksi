// ============================================================
// Media Seleksi — Type Definitions
// ============================================================

export interface MediaFile {
  id: string;
  name: string;
  size: number;
  type: 'photo' | 'video';
  mimeType: string;
  lastModified: number;
  handle?: FileSystemFileHandle;
  file?: File;
  label?: MediaLabel;
  parentPath?: string;
  parentHandle?: FileSystemDirectoryHandle;
}

export type MediaLabel =
  | 'camera'
  | 'screenshot'
  | 'whatsapp'
  | 'telegram'
  | 'download'
  | 'edited'
  | 'unknown';

export interface Folder {
  id: string;
  name: string;
  color: string;
  emoji: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface FileRecord {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: 'photo' | 'video';
  mimeType: string;
  folderId: string;
  originalPath: string;
  currentPath: string;
  movedAt: Date;
  label?: MediaLabel;
  operationId?: string;
}

export interface MoveOperation {
  id: string;
  fileCount: number;
  totalSize: number;
  targetFolderId: string;
  targetFolderName: string;
  files: MoveFileEntry[];
  timestamp: Date;
  reversed: boolean;
  sourceName?: string;
  /** true jika dipindah lewat mode download (tidak bisa di-undo otomatis) */
  fallback?: boolean;
}

export interface MoveFileEntry {
  fileName: string;
  newName: string;
  fromPath: string;
  toPath: string;
  fromDir?: FileSystemDirectoryHandle;
  toDir?: FileSystemDirectoryHandle;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  viewMode: 'grid' | 'list';
  gridColumns: number;
  sortBy: 'date' | 'size' | 'name';
  sortOrder: 'asc' | 'desc';
  defaultFilter: 'all' | 'photo' | 'video';
}

export type FilterType = 'all' | 'photo' | 'video';
export type SortType = 'date-desc' | 'date-asc' | 'size-desc' | 'size-asc' | 'name-asc' | 'name-desc';
export type ViewMode = 'grid' | 'list';

export type SwipeDirection = 'left' | 'right' | 'up' | 'down';
/** folderId, 'skip', atau null (belum diatur) */
export type SwipeAssignment = string | 'skip' | null;
export type SwipeMap = Record<SwipeDirection, SwipeAssignment>;

export type PageType = 'home' | 'folders' | 'history' | 'settings' | 'swipe' | 'duplicates';
