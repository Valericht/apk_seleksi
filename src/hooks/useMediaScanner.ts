import { useDeferredValue, useMemo } from 'react';
import { useMediaStore } from '../stores/mediaStore';
import { usePreferenceStore } from '../stores/preferenceStore';

/** Daftar media setelah filter, label, pencarian, dan pengurutan diterapkan. */
export function useFilteredMedia() {
  const files = useMediaStore((s) => s.files);
  const filter = usePreferenceStore((s) => s.filter);
  const sort = usePreferenceStore((s) => s.sort);
  const labelFilter = usePreferenceStore((s) => s.labelFilter);
  const searchQuery = usePreferenceStore((s) => s.searchQuery);
  const query = useDeferredValue(searchQuery.trim().toLowerCase());

  return useMemo(() => {
    let list = files;
    if (filter !== 'all') list = list.filter((f) => f.type === filter);
    if (labelFilter !== 'all') list = list.filter((f) => f.label === labelFilter);
    if (query) list = list.filter((f) => f.name.toLowerCase().includes(query));

    const sorted = [...list];
    switch (sort) {
      case 'date-asc': sorted.sort((a, b) => a.lastModified - b.lastModified); break;
      case 'size-desc': sorted.sort((a, b) => b.size - a.size); break;
      case 'size-asc': sorted.sort((a, b) => a.size - b.size); break;
      case 'name-asc': sorted.sort((a, b) => a.name.localeCompare(b.name)); break;
      case 'name-desc': sorted.sort((a, b) => b.name.localeCompare(a.name)); break;
      default: sorted.sort((a, b) => b.lastModified - a.lastModified);
    }
    return sorted;
  }, [files, filter, labelFilter, query, sort]);
}
