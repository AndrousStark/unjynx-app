// ---------------------------------------------------------------------------
// Auth Hook
// ---------------------------------------------------------------------------

'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getCurrentUser,
  buildAuthorizationUrl,
  directLogin as apiDirectLogin,
  apiLogout,
  storeTokens,
  clearTokens,
  isTokenExpired,
  getStoredRefreshToken,
  refreshToken as apiRefreshToken,
  type User,
  type DirectLoginPayload,
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
  const refreshingRef = useRef(false);

  // Fetch current user — only when we have a non-expired token
  const {
    data: user,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: authKeys.user,
    queryFn: getCurrentUser,
    staleTime: 5 * 60_000,
    retry: false,
    enabled: typeof window !== 'undefined' && !isTokenExpired(),
  });

  // Attempt to refresh tokens silently
  const attemptRefresh = useCallback(async () => {
    if (refreshingRef.current) return false;
    refreshingRef.current = true;

    try {
      const stored = getStoredRefreshToken();
      if (!stored) return false;

      const tokens = await apiRefreshToken(stored);
      storeTokens(tokens);
      await refetch();
      return true;
    } catch {
      clearTokens();
      queryClient.setQueryData(authKeys.user, null);
      return false;
    } finally {
      refreshingRef.current = false;
    }
  }, [refetch, queryClient]);

  // Token refresh on mount (if expired)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!isTokenExpired()) return;

    attemptRefresh();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Proactive token refresh — check every 60s
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const interval = setInterval(() => {
      if (isTokenExpired()) {
        attemptRefresh();
      }
    }, 60_000);

    return () => clearInterval(interval);
  }, [attemptRefresh]);

  // Direct login — POST /auth/login (zero redirect)
  const directLogin = useCallback(async (payload: DirectLoginPayload) => {
    const result = await apiDirectLogin(payload);
    storeTokens({
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      expiresIn: result.expiresIn,
      tokenType: result.tokenType,
    });
    await refetch();
  }, [refetch]);

  // Login — build Logto OIDC URL and redirect (fallback)
  const login = useCallback(async () => {
    const redirectUri =
      typeof window !== 'undefined'
        ? `${window.location.origin}/callback`
        : 'http://localhost:3003/callback';

    const url = await buildAuthorizationUrl(redirectUri);
    window.location.href = url;
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
    directLogin,
    logout,
    token,
    refetch,
  } as const;
}
