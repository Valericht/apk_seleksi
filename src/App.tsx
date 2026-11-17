import { useEffect, useState } from 'react';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { BottomNav } from './components/layout/BottomNav';
import { ToastContainer } from './components/common/ToastContainer';
import { ProgressOverlay } from './components/common/ProgressOverlay';
import { HomePage } from './pages/HomePage';
import { FolderPage } from './pages/FolderPage';
import { HistoryPage } from './pages/HistoryPage';
import { SettingsPage } from './pages/SettingsPage';
import { SwipeSortPage } from './pages/SwipeSortPage';
import { DuplicatePage } from './pages/DuplicatePage';
import { useFileSystem } from './hooks/useFileSystem';
import { useFolderStore } from './stores/folderStore';
import { useHistoryStore } from './stores/historyStore';
import { useMediaStore } from './stores/mediaStore';
import { useMoveStore } from './stores/moveStore';
import type { PageType } from './types';

export default function App() {
  const [page, setPage] = useState<PageType>('home');
  const { supportsFS, inputRef, openSource, pickFiles, onInputChange, onDropFiles } = useFileSystem();
  const fileCount = useMediaStore((s) => s.files.length);
  const progress = useMoveStore();

  useEffect(() => {
    void useFolderStore.getState().loadFolders();
    void useHistoryStore.getState().loadHistory();
    void useMediaStore.getState().restoreSource();
  }, []);

  return (
    <div className="min-h-dvh">
      <Header onOpenFolder={openSource} supportsFS={supportsFS} fileCount={fileCount} />

      <div className="flex">
        <Sidebar activeTab={page} onTabChange={setPage} />
        <main className="flex-1 min-w-0">
          {page === 'home' && (
            <HomePage
              supportsFS={supportsFS}
              onOpenSource={openSource}
              onPickFiles={pickFiles}
              onDropFiles={onDropFiles}
              onNavigate={setPage}
            />
          )}
          {page === 'folders' && <FolderPage />}
          {page === 'history' && <HistoryPage />}
          {page === 'settings' && <SettingsPage />}
          {page === 'swipe' && <SwipeSortPage onNavigate={setPage} />}
          {page === 'duplicates' && <DuplicatePage />}
        </main>
      </div>

      <BottomNav activeTab={page} onTabChange={setPage} />
      <ToastContainer />
      <ProgressOverlay
        open={progress.active}
        current={progress.current}
        total={progress.total}
        currentFileName={progress.currentFileName}
        title={progress.title}
        onCancel={progress.requestCancel}
      />

      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/*,video/*,.heic,.heif,.avif,.3gp,.mkv,.avi,.wmv,.flv,.mov"
        onChange={onInputChange}
        className="hidden"
        aria-hidden="true"
        tabIndex={-1}
      />
    </div>
  );
}
