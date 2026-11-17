import { useState } from 'react';
import { FolderInput, Plus, X } from 'lucide-react';
import { useFolderStore } from '../../stores/folderStore';
import type { Folder } from '../../types';

interface MoveDialogProps {
  open: boolean;
  fileCount: number;
  onMove: (folder: Folder) => void;
  onClose: () => void;
}

export function MoveDialog({ open, fileCount, onMove, onClose }: MoveDialogProps) {
  const { folders, addFolder } = useFolderStore();
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');

  if (!open) return null;

  const handleQuickCreate = async () => {
    if (!newName.trim()) return;
    const folder = await addFolder(newName.trim());
    setNewName('');
    setCreating(false);
    onMove(folder);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-800 w-full md:max-w-sm md:rounded-2xl rounded-t-2xl shadow-2xl max-h-[70vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <FolderInput size={18} className="text-indigo-500" />
            <h3 className="font-semibold text-slate-900 dark:text-white">
              Pindahkan {fileCount} file
            </h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">
            <X size={18} className="text-slate-500" />
          </button>
        </div>

        {/* Folder list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {folders.map((folder) => (
            <button
              key={folder.id}
              onClick={() => onMove(folder)}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-left"
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                style={{ backgroundColor: folder.color + '20' }}
              >
                {folder.emoji}
              </div>
              <span className="flex-1 text-sm font-medium text-slate-700 dark:text-slate-200">
                {folder.name}
              </span>
            </button>
          ))}

          {/* Quick create */}
          {creating ? (
            <div className="flex gap-2">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleQuickCreate()}
                placeholder="Nama folder baru..."
                className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-900 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                autoFocus
              />
              <button onClick={handleQuickCreate} className="px-3 py-2 bg-indigo-500 text-white text-sm rounded-lg">
                Buat
              </button>
            </div>
          ) : (
            <button
              onClick={() => setCreating(true)}
              className="w-full flex items-center gap-3 p-3 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-600 hover:border-indigo-300 dark:hover:border-indigo-500 transition-colors"
            >
              <Plus size={18} className="text-slate-400" />
              <span className="text-sm text-slate-400">Buat folder baru</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
