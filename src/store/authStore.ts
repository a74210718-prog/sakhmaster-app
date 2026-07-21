import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { authApi, User } from '../api/auth';

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  login:   (email: string, password: string) => Promise<void>;
  logout:  () => Promise<void>;
  restore: () => Promise<void>;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  loading: true,

  login: async (email, password) => {
    const { data } = await authApi.login({ email, password });
    await SecureStore.setItemAsync('auth_token', data.token);
    set({ user: data.user, token: data.token });
  },

  logout: async () => {
    try { await authApi.logout(); } catch {}
    await SecureStore.deleteItemAsync('auth_token');
    set({ user: null, token: null });
  },

  setUser: (user) => set({ user }),

  restore: async () => {
    try {
      const token = await SecureStore.getItemAsync('auth_token');
      if (token) {
        const { data } = await authApi.me();
        set({ user: data.user, token, loading: false });
      } else {
        set({ loading: false });
      }
    } catch {
      await SecureStore.deleteItemAsync('auth_token');
      set({ loading: false });
    }
  },
}));
