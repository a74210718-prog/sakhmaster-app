import { create } from 'zustand';
import { api } from '../api/client';

interface NotificationsState {
  unreadCount: number;
  setUnreadCount: (count: number) => void;
  fetchUnreadCount: () => Promise<void>;
  decrement: () => void;
  reset: () => void;
}

export const useNotificationsStore = create<NotificationsState>((set) => ({
  unreadCount: 0,

  setUnreadCount: (count) => set({ unreadCount: count }),

  fetchUnreadCount: async () => {
    try {
      const { data } = await api.get('/notifications', { params: { page: 1 } });
      set({ unreadCount: data.unread_count ?? 0 });
    } catch {}
  },

  decrement: () => set((s) => ({ unreadCount: Math.max(0, s.unreadCount - 1) })),

  reset: () => set({ unreadCount: 0 }),
}));
