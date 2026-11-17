import { FolderList } from '../components/folder/FolderList';

export function FolderPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-4 pb-28 md:pb-8 space-y-3">
      <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Folder</h2>
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Buat folder tujuan sesuai kebutuhanmu. Saat memindahkan, file disimpan di subfolder{' '}
        <code className="text-xs bg-slate-100 dark:bg-slate-800 px-1 rounded">Media Seleksi/&lt;nama folder&gt;</code> di dalam folder sumber.
      </p>
      <FolderList />
    </div>
  );
}
