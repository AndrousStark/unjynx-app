// ---------------------------------------------------------------------------
// Auth API
// ---------------------------------------------------------------------------

import { apiClient } from './client';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface User {
  readonly id: string;
  readonly logtoId: string;
  readonly email: string;
  readonly displayName: string;
  readonly avatarUrl: string | null;
  readonly plan: 'free' | 'pro' | 'team' | 'enterprise';
  readonly timezone: string;
  readonly locale: string;
  readonly onboardingComplete: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface AuthTokens {
  readonly accessToken: string;
  readonly refreshToken: string;
  readonly expiresIn: number;
  readonly tokenType: 'Bearer';
}

export interface UpdateProfilePayload {
  readonly displayName?: string;
  readonly avatarUrl?: string | null;
  readonly timezone?: string;
  readonly locale?: string;
}

export interface LoginPayload {
  readonly redirectUri: string;
}

export interface LoginResponse {
  readonly authorizationUrl: string;
}

export interface CallbackPayload {
  readonly code: string;
  readonly state: string;
  readonly redirectUri: string;
}

// ---------------------------------------------------------------------------
// API functions
// ---------------------------------------------------------------------------

export function getCurrentUser(): Promise<User> {
  return apiClient.get<User>('/api/v1/auth/me');
}

export function updateProfile(payload: UpdateProfilePayload): Promise<User> {
  return apiClient.patch<User>('/api/v1/auth/me', payload);
}

export function initiateLogin(payload: LoginPayload): Promise<LoginResponse> {
  return apiClient.post<LoginResponse>('/api/v1/auth/login', payload);
}

export function handleCallback(payload: CallbackPayload): Promise<AuthTokens> {
  return apiClient.post<AuthTokens>('/api/v1/auth/callback', payload);
}

export function refreshToken(refreshToken: string): Promise<AuthTokens> {
  return apiClient.post<AuthTokens>('/api/v1/auth/refresh', { refreshToken });
}

export function logout(): Promise<void> {
  return apiClient.post('/api/v1/auth/logout');
}

export function deleteAccount(): Promise<void> {
  return apiClient.delete('/api/v1/auth/me');
}

// ---------------------------------------------------------------------------
// Token helpers (client-side)
// ---------------------------------------------------------------------------

export function storeTokens(tokens: AuthTokens): void {
  if (typeof window === 'undefined') return;

  localStorage.setItem('unjynx_token', tokens.accessToken);
  localStorage.setItem('unjynx_refresh_token', tokens.refreshToken);
  localStorage.setItem('unjynx_token_expires', String(Date.now() + tokens.expiresIn * 1000));

  // Also set as cookie for SSR access
  const maxAge = tokens.expiresIn;
  document.cookie = `unjynx_token=${encodeURIComponent(tokens.accessToken)};path=/;max-age=${maxAge};SameSite=Lax;Secure`;
}

export function clearTokens(): void {
  if (typeof window === 'undefined') return;

  localStorage.removeItem('unjynx_token');
  localStorage.removeItem('unjynx_refresh_token');
  localStorage.removeItem('unjynx_token_expires');

  document.cookie = 'unjynx_token=;path=/;max-age=0';
}

export function isTokenExpired(): boolean {
  if (typeof window === 'undefined') return true;

  const expires = localStorage.getItem('unjynx_token_expires');
  if (!expires) return true;

  // Consider expired 60s before actual expiry to allow refresh
  return Date.now() >= Number(expires) - 60_000;
}

export function getStoredRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('unjynx_refresh_token');
}
