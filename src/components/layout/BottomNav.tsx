import { Home, FolderOpen, History, Settings } from 'lucide-react';
import type { PageType } from '../../types';

export type TabType = PageType;

interface BottomNavProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

const TABS: { id: TabType; label: string; icon: React.ReactNode }[] = [
  { id: 'home', label: 'Beranda', icon: <Home size={20} /> },
  { id: 'folders', label: 'Folder', icon: <FolderOpen size={20} /> },
  { id: 'history', label: 'Riwayat', icon: <History size={20} /> },
  { id: 'settings', label: 'Pengaturan', icon: <Settings size={20} /> },
];

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 md:hidden">
      <div className="flex items-center justify-around py-2">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors ${
              activeTab === tab.id
                ? 'text-indigo-500'
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
            }`}
          >
            {tab.icon}
            <span className="text-[10px] font-medium">{tab.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
