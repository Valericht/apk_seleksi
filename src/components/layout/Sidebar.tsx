import { Home, FolderOpen, History, Settings, Shuffle, Copy } from 'lucide-react';
import { FolderList } from '../folder/FolderList';
import type { TabType } from './BottomNav';

interface SidebarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

const NAV_ITEMS: { id: TabType; label: string; icon: React.ReactNode }[] = [
  { id: 'home', label: 'Beranda', icon: <Home size={18} /> },
  { id: 'folders', label: 'Folder', icon: <FolderOpen size={18} /> },
  { id: 'swipe', label: 'Sort Cepat', icon: <Shuffle size={18} /> },
  { id: 'duplicates', label: 'Duplikat', icon: <Copy size={18} /> },
  { id: 'history', label: 'Riwayat', icon: <History size={18} /> },
  { id: 'settings', label: 'Pengaturan', icon: <Settings size={18} /> },
];

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  return (
    <aside className="hidden md:flex flex-col w-64 flex-shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 h-[calc(100dvh-57px)] sticky top-[57px]">
      {/* Navigation */}
      <nav className="p-3 space-y-1">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
              activeTab === item.id
                ? 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </nav>

      {/* Divider */}
      <div className="mx-4 border-t border-slate-200 dark:border-slate-800" />

      {/* Folder list */}
      <div className="flex-1 overflow-y-auto p-3">
        <FolderList />
      </div>
    </aside>
  );
}
