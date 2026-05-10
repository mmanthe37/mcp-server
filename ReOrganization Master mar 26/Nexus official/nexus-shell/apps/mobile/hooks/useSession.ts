import { useCallback, useEffect } from 'react';
import { useSessionStore } from '../stores/sessionStore';
import { apiClient } from '../services/api';

export interface CreateSessionParams {
  machineId: string;
  shellType?: string;
  cols?: number;
  rows?: number;
}

export function useSession() {
  const { sessions, activeSessionId, setActiveSession, setSessions, addSession, removeSession, updateSession } =
    useSessionStore();

  const fetchSessions = useCallback(async () => {
    try {
      const response = await apiClient.get<{ sessions: any[] }>('/sessions');
      setSessions(response.sessions);
    } catch (err) {
      console.error('Failed to fetch sessions:', err);
    }
  }, [setSessions]);

  const createSession = useCallback(
    async (params: CreateSessionParams) => {
      try {
        const response = await apiClient.post<{ session: any }>('/sessions', params);
        addSession(response.session);
        setActiveSession(response.session.id);
        return response.session;
      } catch (err: any) {
        throw new Error(err?.message || 'Failed to create session');
      }
    },
    [addSession, setActiveSession]
  );

  const terminateSession = useCallback(
    async (sessionId: string) => {
      try {
        await apiClient.delete(`/sessions/${sessionId}`);
        removeSession(sessionId);
        if (activeSessionId === sessionId) {
          setActiveSession(null);
        }
      } catch (err: any) {
        throw new Error(err?.message || 'Failed to terminate session');
      }
    },
    [removeSession, activeSessionId, setActiveSession]
  );

  const attachSession = useCallback(
    async (sessionId: string) => {
      try {
        const response = await apiClient.post<{ session: any }>(`/sessions/${sessionId}/attach`, {});
        updateSession(sessionId, response.session);
        setActiveSession(sessionId);
        return response.session;
      } catch (err: any) {
        throw new Error(err?.message || 'Failed to attach to session');
      }
    },
    [updateSession, setActiveSession]
  );

  const activeSession = sessions.find((s) => s.id === activeSessionId) || null;

  return {
    sessions,
    activeSession,
    activeSessionId,
    fetchSessions,
    createSession,
    terminateSession,
    attachSession,
    setActiveSession,
  };
}
