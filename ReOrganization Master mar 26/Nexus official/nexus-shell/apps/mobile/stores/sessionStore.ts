import { create } from 'zustand';
import type { SessionRecord } from '@nexus-shell/shared-types';

export type ConnectionStatus =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'reconnecting';

export interface SessionState {
  sessions: SessionRecord[];
  activeSessionId: string | null;
  connectionStatus: ConnectionStatus;
  latency: number;
  isLoading: boolean;
  error: string | null;

  // Basic setters
  setSessions: (sessions: SessionRecord[]) => void;
  addSession: (session: SessionRecord) => void;
  removeSession: (id: string) => void;
  updateSession: (id: string, patch: Partial<SessionRecord>) => void;
  setActiveSession: (id: string | null) => void;
  setConnectionStatus: (status: ConnectionStatus) => void;
  setLatency: (ms: number) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Session lifecycle (async, talk to backend)
  fetchSessions: () => Promise<void>;
  createSession: (name: string, machineId: string) => Promise<SessionRecord | null>;
  terminateSession: (id: string) => Promise<void>;
  attachSession: (id: string) => Promise<void>;
}

export const useSessionStore = create<SessionState>()((set, get) => ({
  sessions: [],
  activeSessionId: null,
  connectionStatus: 'disconnected',
  latency: 0,
  isLoading: false,
  error: null,

  setSessions: (sessions) => set({ sessions, error: null }),

  addSession: (session) =>
    set((state) => ({ sessions: [...state.sessions, session] })),

  removeSession: (id) =>
    set((state) => ({
      sessions: state.sessions.filter((s) => s.id !== id),
      activeSessionId: state.activeSessionId === id ? null : state.activeSessionId,
    })),

  updateSession: (id, patch) =>
    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.id === id ? { ...s, ...patch } : s,
      ),
    })),

  setActiveSession: (id) => set({ activeSessionId: id }),
  setConnectionStatus: (connectionStatus) => set({ connectionStatus }),
  setLatency: (latency) => set({ latency }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error, isLoading: false }),

  fetchSessions: async () => {
    set({ isLoading: true, error: null });
    try {
      const { api } = await import('../services/api');
      const res = await api.get('/api/sessions');
      const data = (res as { data: { sessions: SessionRecord[] } }).data;
      set({ sessions: data.sessions, isLoading: false });
    } catch (err) {
      set({ error: 'Failed to fetch sessions', isLoading: false });
    }
  },

  createSession: async (name, machineId) => {
    set({ isLoading: true, error: null });
    try {
      const { api } = await import('../services/api');
      const res = await api.post('/api/sessions', { name, machineId });
      const data = (res as { data: { session: SessionRecord } }).data;
      const session = data.session;
      set((state) => ({
        sessions: [...state.sessions, session],
        activeSessionId: session.id,
        isLoading: false,
      }));
      return session;
    } catch (err) {
      set({ error: 'Failed to create session', isLoading: false });
      return null;
    }
  },

  terminateSession: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const { api } = await import('../services/api');
      await api.delete(`/api/sessions/${id}`);
      set((state) => ({
        sessions: state.sessions.filter((s) => s.id !== id),
        activeSessionId: state.activeSessionId === id ? null : state.activeSessionId,
        isLoading: false,
      }));
    } catch (err) {
      set({ error: 'Failed to terminate session', isLoading: false });
    }
  },

  attachSession: async (id) => {
    const { sessions } = get();
    const session = sessions.find((s) => s.id === id);
    if (!session) {
      set({ error: 'Session not found' });
      return;
    }
    set({ activeSessionId: id, connectionStatus: 'connecting' });
  },
}));
