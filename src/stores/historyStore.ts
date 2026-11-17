import { create } from 'zustand';
import type { MoveOperation } from '../types';
import { db } from '../services/db';
import { generateId } from '../utils/formatters';
import { MAX_HISTORY } from '../utils/constants';

interface HistoryState {
  history: MoveOperation[];
  loading: boolean;
  loadHistory: () => Promise<void>;
  addOperation: (op: Omit<MoveOperation, 'id' | 'timestamp' | 'reversed'>) => Promise<MoveOperation>;
  reverseOperation: (id: string) => Promise<void>;
}

export const useHistoryStore = create<HistoryState>((set, get) => ({
  history: [],
  loading: false,

  loadHistory: async () => {
    set({ loading: true });
    const history = await db.moveHistory.orderBy('timestamp').reverse().limit(MAX_HISTORY).toArray();
    set({ history, loading: false });
  },

  addOperation: async (op) => {
    const operation: MoveOperation = {
      ...op,
      id: generateId(),
      timestamp: new Date(),
      reversed: false,
    };
    await db.moveHistory.add(operation);
    // batasi riwayat: simpan MAX_HISTORY operasi terakhir
    const overflow = await db.moveHistory.orderBy('timestamp').reverse().offset(MAX_HISTORY).primaryKeys();
    if (overflow.length) await db.moveHistory.bulkDelete(overflow);
    set({ history: [operation, ...get().history].slice(0, MAX_HISTORY) });
    return operation;
  },

  reverseOperation: async (id: string) => {
    await db.moveHistory.update(id, { reversed: true });
    set({
      history: get().history.map((h) => (h.id === id ? { ...h, reversed: true } : h)),
    });
  },
}));
