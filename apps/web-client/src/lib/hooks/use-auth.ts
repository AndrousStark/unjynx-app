// ---------------------------------------------------------------------------
// Auth Hook
// ---------------------------------------------------------------------------

'use client';

import { useCallback, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getCurrentUser,
  initiateLogin,
  logout as apiLogout,
  storeTokens,
  clearTokens,
  isTokenExpired,
  getStoredRefreshToken,
  refreshToken as apiRefreshToken,
  type User,
} from '@/lib/api/auth';

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------

export const authKeys = {
  user: ['auth', 'user'] as const,
};

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useAuth() {
  const queryClient = useQueryClient();

  // Fetch current user — only when we have a token
  const {
    data: user,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: authKeys.user,
    queryFn: getCurrentUser,
    staleTime: 5 * 60_000, // 5 minutes
    retry: false,
    enabled: typeof window !== 'undefined' && !isTokenExpired(),
  });

  // Token refresh on mount and when token is close to expiry
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!isTokenExpired()) return;

    const stored = getStoredRefreshToken();
    if (!stored) return;

    apiRefreshToken(stored)
      .then((tokens) => {
        storeTokens(tokens);
        refetch();
      })
      .catch(() => {
        clearTokens();
        queryClient.setQueryData(authKeys.user, null);
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Login — redirects to Logto auth page
  const login = useCallback(async () => {
    const redirectUri =
      typeof window !== 'undefined'
        ? `${window.location.origin}/callback`
        : 'http://localhost:3003/callback';

    const { authorizationUrl } = await initiateLogin({ redirectUri });
    window.location.href = authorizationUrl;
  }, []);

  // Logout — clears tokens and resets cache
  const logout = useCallback(async () => {
    try {
      await apiLogout();
    } catch {
      // Ignore server errors during logout
    } finally {
      clearTokens();
      queryClient.clear();

      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
  }, [queryClient]);

  // Derived state
  const isAuthenticated = !!user && !isTokenExpired();
  const token =
    typeof window !== 'undefined'
      ? localStorage.getItem('unjynx_token')
      : null;

  return {
    user: user as User | undefined,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    token,
    refetch,
  } as const;
}
