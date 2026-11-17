import Dexie, { type EntityTable } from 'dexie';
import type { FileRecord, Folder, MoveOperation } from '../types';

export interface MetaRecord {
  key: string;
  value: unknown;
}

const db = new Dexie('MediaSeleksiDB') as Dexie & {
  folders: EntityTable<Folder, 'id'>;
  moveHistory: EntityTable<MoveOperation, 'id'>;
  fileRecords: EntityTable<FileRecord, 'id'>;
  meta: EntityTable<MetaRecord, 'key'>;
};

db.version(1).stores({
  folders: 'id, name, order',
  moveHistory: 'id, timestamp, targetFolderId',
});

db.version(2).stores({
  folders: 'id, name, order',
  moveHistory: 'id, timestamp, targetFolderId',
  fileRecords: 'id, folderId, operationId',
  meta: 'key',
});

export { db };
