import { Film, LayoutGrid, List, Search, SlidersHorizontal, Image } from 'lucide-react';
import { usePreferenceStore } from '../../stores/preferenceStore';
import { LABEL_CONFIG } from '../../services/labelDetector';
import type { FilterType, MediaLabel, SortType } from '../../types';

const FILTERS: { value: FilterType; label: string; icon: React.ReactNode }[] = [
  { value: 'all', label: 'Semua', icon: <LayoutGrid size={14} /> },
  { value: 'photo', label: 'Foto', icon: <Image size={14} /> },
  { value: 'video', label: 'Video', icon: <Film size={14} /> },
];

const SORTS: { value: SortType; label: string }[] = [
  { value: 'date-desc', label: 'Terbaru' },
  { value: 'date-asc', label: 'Terlama' },
  { value: 'size-desc', label: 'Terbesar' },
  { value: 'size-asc', label: 'Terkecil' },
  { value: 'name-asc', label: 'Nama A-Z' },
  { value: 'name-desc', label: 'Nama Z-A' },
];

const LABEL_FILTERS: (MediaLabel | 'all')[] = ['all', 'camera', 'screenshot', 'whatsapp', 'telegram', 'download', 'edited'];

export function FilterBar() {
  const { filter, sort, viewMode, searchQuery, labelFilter, setFilter, setSort, setViewMode, setSearchQuery, setLabelFilter } = usePreferenceStore();

  return (
    <div className="space-y-3 px-4 py-3">
      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Cari file..."
          aria-label="Cari file"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all"
        />
      </div>

      <div className="flex items-center justify-between gap-2 flex-wrap">
        {/* Filter tabs */}
        <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filter === f.value
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              {f.icon}
              {f.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {/* Sort */}
          <div className="relative">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortType)}
              className="appearance-none bg-slate-100 dark:bg-slate-800 text-xs text-slate-600 dark:text-slate-300 rounded-lg pl-7 pr-6 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 cursor-pointer"
            >
              {SORTS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
            <SlidersHorizontal size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          {/* View toggle */}
          <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5">
            <button
              onClick={() => setViewMode('grid')}
              aria-label="Tampilan grid"
              className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-slate-700 shadow-sm' : ''}`}
            >
              <LayoutGrid size={14} className={viewMode === 'grid' ? 'text-indigo-500' : 'text-slate-400'} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              aria-label="Tampilan daftar"
              className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white dark:bg-slate-700 shadow-sm' : ''}`}
            >
              <List size={14} className={viewMode === 'list' ? 'text-indigo-500' : 'text-slate-400'} />
            </button>
          </div>
        </div>
      </div>

      {/* Label filter */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
        {LABEL_FILTERS.map((l) => (
          <button
            key={l}
            onClick={() => setLabelFilter(l)}
            className={`flex-shrink-0 px-2.5 py-1 rounded-full text-xs transition-colors border ${
              labelFilter === l
                ? 'bg-indigo-500 border-indigo-500 text-white'
                : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {l === 'all' ? 'Semua label' : `${LABEL_CONFIG[l].emoji} ${LABEL_CONFIG[l].text}`}
          </button>
        ))}
      </div>
    </div>
  );
}
