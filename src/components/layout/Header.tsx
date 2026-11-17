import { FolderOpen, Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';

interface HeaderProps {
  onOpenFolder: () => void;
  supportsFS: boolean;
  fileCount?: number;
}

export function Header({ onOpenFolder, supportsFS, fileCount }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();

  const themeIcon = theme === 'dark' ? <Moon size={18} /> : theme === 'light' ? <Sun size={18} /> : <Monitor size={18} />;

  return (
    <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-b border-slate-200 dark:border-slate-800">
      <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-violet-500 rounded-lg flex items-center justify-center">
            <span className="text-white text-sm font-bold">MS</span>
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 dark:text-white">Media Seleksi</h1>
            {fileCount !== undefined && fileCount > 0 && (
              <p className="text-xs text-slate-500 dark:text-slate-400">{fileCount} file</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenFolder}
            aria-label={supportsFS ? 'Buka folder sumber' : 'Pilih file'}
            className="flex items-center gap-1.5 px-3 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium rounded-xl transition-colors"
          >
            <FolderOpen size={16} />
            <span className="hidden sm:inline">{supportsFS ? 'Buka Folder' : 'Pilih File'}</span>
          </button>
          <button
            onClick={toggleTheme}
            aria-label="Ganti tema"
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-500 dark:text-slate-400 transition-colors"
          >
            {themeIcon}
          </button>
        </div>
      </div>
    </header>
  );
}
