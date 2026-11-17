import { useState } from 'react';
import { Plus, Trash2, Edit2, GripVertical, ChevronUp, ChevronDown, Check } from 'lucide-react';
import { useFolderStore } from '../../stores/folderStore';
import { useFolderStats } from '../../hooks/useFolderStats';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { formatFileSize } from '../../utils/formatters';
import { COLOR_OPTIONS, EMOJI_OPTIONS } from '../../utils/constants';

interface FolderFormState {
  name: string;
  emoji: string;
  color: string;
}

interface FolderFormProps {
  value: FolderFormState;
  onChange: (v: FolderFormState) => void;
  onSubmit: () => void;
  onCancel: () => void;
  submitText: string;
}

function FolderForm({ value, onChange, onSubmit, onCancel, submitText }: FolderFormProps) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 space-y-3">
      <input
        type="text"
        placeholder="Nama folder..."
        aria-label="Nama folder"
        value={value.name}
        onChange={(e) => onChange({ ...value, name: e.target.value })}
        onKeyDown={(e) => {
          if (e.key === 'Enter') onSubmit();
          if (e.key === 'Escape') onCancel();
        }}
        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
        autoFocus
      />
      <div className="flex flex-wrap gap-1.5">
        {EMOJI_OPTIONS.map((e) => (
          <button
            key={e}
            type="button"
            onClick={() => onChange({ ...value, emoji: e })}
            className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm transition-all ${
              value.emoji === e ? 'bg-indigo-100 dark:bg-indigo-900/30 ring-2 ring-indigo-500' : 'hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            {e}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {COLOR_OPTIONS.map((c) => (
          <button
            key={c}
            type="button"
            aria-label={`Warna ${c}`}
            onClick={() => onChange({ ...value, color: c })}
            className={`w-6 h-6 rounded-full transition-all ${
              value.color === c ? 'ring-2 ring-offset-2 ring-indigo-500 dark:ring-offset-slate-800' : ''
            }`}
            style={{ backgroundColor: c }}
          />
        ))}
      </div>
      <div className="flex justify-end gap-2">
        <button onClick={onCancel} className="px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">
          Batal
        </button>
        <button onClick={onSubmit} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-indigo-500 hover:bg-indigo-600 rounded-lg">
          <Check size={12} />
          {submitText}
        </button>
      </div>
    </div>
  );
}

const DEFAULT_FORM: FolderFormState = { name: '', emoji: '📁', color: '#6366F1' };

export function FolderList() {
  const { folders, addFolder, updateFolder, deleteFolder, reorderFolders } = useFolderStore();
  const stats = useFolderStats();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<FolderFormState>(DEFAULT_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<FolderFormState>(DEFAULT_FORM);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!form.name.trim()) return;
    await addFolder(form.name.trim(), form.emoji, form.color);
    setForm(DEFAULT_FORM);
    setShowCreate(false);
  };

  const handleUpdate = async () => {
    if (!editingId || !editForm.name.trim()) return;
    await updateFolder(editingId, { name: editForm.name.trim(), emoji: editForm.emoji, color: editForm.color });
    setEditingId(null);
  };

  const handleDelete = async () => {
    if (deleteTarget) {
      await deleteFolder(deleteTarget);
      setDeleteTarget(null);
    }
  };

  const moveItem = (from: number, to: number) => {
    if (to < 0 || to >= folders.length || from === to) return;
    const next = [...folders];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    void reorderFolders(next);
  };

  const handleDrop = (targetId: string) => {
    if (!dragId || dragId === targetId) return;
    moveItem(
      folders.findIndex((f) => f.id === dragId),
      folders.findIndex((f) => f.id === targetId),
    );
    setDragId(null);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Folder Tujuan</h3>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-1 text-xs font-medium text-indigo-500 hover:text-indigo-600 transition-colors"
        >
          <Plus size={14} />
          Buat Folder
        </button>
      </div>

      {showCreate && (
        <FolderForm value={form} onChange={setForm} onSubmit={handleCreate} onCancel={() => setShowCreate(false)} submitText="Buat" />
      )}

      <div className="space-y-1.5">
        {folders.map((folder, i) =>
          editingId === folder.id ? (
            <FolderForm
              key={folder.id}
              value={editForm}
              onChange={setEditForm}
              onSubmit={handleUpdate}
              onCancel={() => setEditingId(null)}
              submitText="Simpan"
            />
          ) : (
            <div
              key={folder.id}
              draggable
              onDragStart={() => setDragId(folder.id)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(folder.id)}
              onDragEnd={() => setDragId(null)}
              className={`flex items-center gap-2 p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 group ${
                dragId === folder.id ? 'opacity-50' : ''
              }`}
            >
              <GripVertical size={14} className="text-slate-300 dark:text-slate-600 cursor-grab flex-shrink-0" />
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0"
                style={{ backgroundColor: folder.color + '20' }}
              >
                {folder.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{folder.name}</p>
                {stats[folder.id] ? (
                  <p className="text-[11px] text-slate-400 dark:text-slate-500">
                    {stats[folder.id].photos} foto, {stats[folder.id].videos} video · {formatFileSize(stats[folder.id].size)}
                  </p>
                ) : (
                  <p className="text-[11px] text-slate-400 dark:text-slate-500">Kosong</p>
                )}
              </div>
              <span
                className="text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: folder.color + '20', color: folder.color }}
              >
                {stats[folder.id]?.count ?? 0}
              </span>
              <div className="flex gap-0.5 md:opacity-0 md:group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                <button onClick={() => moveItem(i, i - 1)} aria-label="Naikkan" className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">
                  <ChevronUp size={12} className="text-slate-400" />
                </button>
                <button onClick={() => moveItem(i, i + 1)} aria-label="Turunkan" className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">
                  <ChevronDown size={12} className="text-slate-400" />
                </button>
                <button
                  onClick={() => {
                    setEditingId(folder.id);
                    setEditForm({ name: folder.name, emoji: folder.emoji, color: folder.color });
                  }}
                  aria-label="Ubah folder"
                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
                >
                  <Edit2 size={12} className="text-slate-400" />
                </button>
                <button
                  onClick={() => setDeleteTarget(folder.id)}
                  aria-label="Hapus folder"
                  className="p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                >
                  <Trash2 size={12} className="text-red-400" />
                </button>
              </div>
            </div>
          ),
        )}
      </div>

      {folders.length === 0 && !showCreate && (
        <p className="text-center text-xs text-slate-400 dark:text-slate-500 py-4">
          Buat folder pertamamu untuk mulai mengorganisir!
        </p>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Hapus Folder"
        message="Yakin ingin menghapus folder ini? File di dalamnya tidak akan dihapus dari penyimpanan, hanya menjadi 'Unfiled'."
        confirmText="Hapus"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
