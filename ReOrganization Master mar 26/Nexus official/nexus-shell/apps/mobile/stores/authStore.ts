import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { UserRecord, DeviceRecord } from '@nexus-shell/shared-types';

export interface AuthState {
  user: UserRecord | null;
  device: DeviceRecord | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  /** Alias for accessToken (consumed by useAuth hook) */
  readonly token: string | null;

  setUser: (user: UserRecord | null) => void;
  setDevice: (device: DeviceRecord | null) => void;
  setTokens: (access: string, refresh: string) => void;
  setAuth: (user: UserRecord, token: string, refreshToken: string) => void;
  clearAuth: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName?: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      device: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      get token() {
        return get().accessToken;
      },

      setUser: (user) =>
        set({ user, isAuthenticated: user !== null, error: null }),

      setDevice: (device) => set({ device }),

      setTokens: (accessToken, refreshToken) =>
        set({ accessToken, refreshToken }),

      setAuth: (user, token, refreshToken) =>
        set({
          user,
          accessToken: token,
          refreshToken,
          isAuthenticated: true,
          error: null,
          isLoading: false,
        }),

      clearAuth: () =>
        set({
          user: null,
          device: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          error: null,
        }),

      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error, isLoading: false }),

      initialize: async () => {
        // Zustand persist auto-rehydrates from AsyncStorage.
        // This method exists so splash screen can await it.
        const state = get();
        if (state.accessToken && state.user) {
          set({ isAuthenticated: true, isLoading: false });
        } else {
          set({ isLoading: false });
        }
      },

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const { api } = await import('../services/api');
          const res = await api.post<{
            user: UserRecord;
            accessToken: string;
            refreshToken: string;
          }>('/auth/login', { email, password });
          set({
            user: res.user,
            accessToken: res.accessToken,
            refreshToken: res.refreshToken,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (err: unknown) {
          const message =
            err instanceof Error ? err.message : 'Login failed';
          set({ error: message, isLoading: false });
          throw err;
        }
      },

      register: async (
        email: string,
        password: string,
        displayName?: string,
      ) => {
        set({ isLoading: true, error: null });
        try {
          const { api } = await import('../services/api');
          const res = await api.post<{
            user: UserRecord;
            accessToken: string;
            refreshToken: string;
          }>('/auth/register', { email, password, displayName });
          set({
            user: res.user,
            accessToken: res.accessToken,
            refreshToken: res.refreshToken,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (err: unknown) {
          const message =
            err instanceof Error ? err.message : 'Registration failed';
          set({ error: message, isLoading: false });
          throw err;
        }
      },
    }),
    {
      name: 'nexus-auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        device: state.device,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
