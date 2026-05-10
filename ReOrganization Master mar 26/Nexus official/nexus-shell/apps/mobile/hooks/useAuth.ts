import { useCallback } from 'react';
import { useAuthStore } from '../stores/authStore';
import { apiClient } from '../services/api';

export function useAuth() {
  const { user, token, isAuthenticated, setAuth, clearAuth, setLoading, isLoading, error, setError } =
    useAuthStore();

  const login = useCallback(
    async (email: string, password: string) => {
      setLoading(true);
      setError(null);
      try {
        const response = await apiClient.post<{ user: any; token: string; refreshToken: string }>(
          '/auth/login',
          { email, password }
        );
        setAuth(response.user, response.token, response.refreshToken);
      } catch (err: any) {
        const message = err?.message || 'Login failed';
        setError(message);
        throw new Error(message);
      } finally {
        setLoading(false);
      }
    },
    [setAuth, setLoading, setError]
  );

  const register = useCallback(
    async (email: string, password: string, displayName: string) => {
      setLoading(true);
      setError(null);
      try {
        const response = await apiClient.post<{ user: any; token: string; refreshToken: string }>(
          '/auth/register',
          { email, password, displayName }
        );
        setAuth(response.user, response.token, response.refreshToken);
      } catch (err: any) {
        const message = err?.message || 'Registration failed';
        setError(message);
        throw new Error(message);
      } finally {
        setLoading(false);
      }
    },
    [setAuth, setLoading, setError]
  );

  const logout = useCallback(async () => {
    try {
      if (token) {
        await apiClient.post('/auth/logout', {});
      }
    } catch {
      // Logout even if server request fails
    } finally {
      clearAuth();
    }
  }, [token, clearAuth]);

  const refreshToken = useCallback(async () => {
    const { refreshToken: storedRefresh } = useAuthStore.getState();
    if (!storedRefresh) {
      clearAuth();
      return;
    }
    try {
      const response = await apiClient.post<{ token: string; refreshToken: string }>(
        '/auth/refresh',
        { refreshToken: storedRefresh }
      );
      const currentUser = useAuthStore.getState().user;
      if (currentUser) {
        setAuth(currentUser, response.token, response.refreshToken);
      }
    } catch {
      clearAuth();
    }
  }, [clearAuth, setAuth]);

  return {
    user,
    token,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
    refreshToken,
  };
}
