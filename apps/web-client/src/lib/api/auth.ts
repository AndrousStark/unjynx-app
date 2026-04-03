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
  readonly name: string;
  /** Alias for `name` — used by UI components. */
  readonly displayName: string;
  readonly avatarUrl: string | null;
  readonly plan: 'free' | 'pro' | 'team' | 'enterprise';
  readonly timezone: string;
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
  readonly name?: string;
  readonly displayName?: string;
  readonly avatarUrl?: string | null;
  readonly timezone?: string;
}

export interface CallbackPayload {
  readonly code: string;
  readonly state: string;
  readonly redirectUri: string;
}

export interface RegisterPayload {
  readonly email: string;
  readonly password: string;
  readonly name: string;
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

export function handleCallback(payload: CallbackPayload): Promise<AuthTokens> {
  return apiClient.post<AuthTokens>('/api/v1/auth/callback', payload);
}

export function refreshToken(rt: string): Promise<AuthTokens> {
  return apiClient.post<AuthTokens>('/api/v1/auth/refresh', { refreshToken: rt });
}

export function apiLogout(): Promise<void> {
  return apiClient.post('/api/v1/auth/logout');
}

export function deleteAccount(): Promise<void> {
  return apiClient.delete('/api/v1/auth/me');
}

export function register(payload: RegisterPayload): Promise<{ profileId: string }> {
  return apiClient.post<{ profileId: string }>('/api/v1/auth/register', payload);
}

// ---------------------------------------------------------------------------
// Direct Auth (zero-redirect)
// ---------------------------------------------------------------------------

export interface DirectLoginPayload {
  readonly email: string;
  readonly password: string;
}

export interface DirectAuthResult {
  readonly accessToken: string;
  readonly refreshToken: string;
  readonly expiresIn: number;
  readonly tokenType: 'Bearer';
  readonly user: {
    readonly id: string;
    readonly email: string;
    readonly name: string | null;
    readonly avatarUrl: string | null;
    readonly emailVerified: boolean;
  };
}

export async function directLogin(payload: DirectLoginPayload): Promise<DirectAuthResult> {
  return apiClient.post<DirectAuthResult>('/api/v1/auth/login', payload);
}

export async function socialLogin(provider: 'google' | 'apple', idToken: string): Promise<DirectAuthResult> {
  return apiClient.post<DirectAuthResult>('/api/v1/auth/social', { provider, idToken });
}

export function forgotPassword(email: string): Promise<{ sent: boolean }> {
  return apiClient.post<{ sent: boolean }>('/api/v1/auth/forgot-password', { email });
}

export function resetPassword(token: string, password: string): Promise<{ reset: boolean }> {
  return apiClient.post<{ reset: boolean }>('/api/v1/auth/reset-password', { token, password });
}

// ---------------------------------------------------------------------------
// Logto OIDC helpers
// ---------------------------------------------------------------------------

const LOGTO_ENDPOINT = process.env.NEXT_PUBLIC_LOGTO_ENDPOINT ?? 'https://auth.unjynx.me';
const LOGTO_APP_ID = process.env.NEXT_PUBLIC_LOGTO_APP_ID ?? '4rpcwskqhipqoxmiluj6o';

/**
 * Build the Logto OIDC authorization URL for browser redirect.
 *
 * Uses PKCE (S256) for security. Stores code_verifier in sessionStorage
 * so the callback page can exchange the code for tokens.
 */
export async function buildAuthorizationUrl(redirectUri: string): Promise<string> {
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);
  const state = generateRandomString(32);

  // Store for callback
  sessionStorage.setItem('unjynx_code_verifier', codeVerifier);
  sessionStorage.setItem('unjynx_auth_state', state);

  const params = new URLSearchParams({
    client_id: LOGTO_APP_ID,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid profile email offline_access',
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    state,
  });

  return `${LOGTO_ENDPOINT}/oidc/auth?${params.toString()}`;
}

function generateRandomString(length: number): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(36).padStart(2, '0'))
    .join('')
    .slice(0, length);
}

function generateCodeVerifier(): string {
  return generateRandomString(64);
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

// ---------------------------------------------------------------------------
// Token helpers (client-side)
// ---------------------------------------------------------------------------

export function storeTokens(tokens: AuthTokens): void {
  if (typeof window === 'undefined') return;

  localStorage.setItem('unjynx_token', tokens.accessToken);
  localStorage.setItem('unjynx_refresh_token', tokens.refreshToken);
  localStorage.setItem('unjynx_token_expires', String(Date.now() + tokens.expiresIn * 1000));

  // Cookie for middleware — SameSite=Lax allows OIDC redirects
  const maxAge = tokens.expiresIn;
  const secure = window.location.protocol === 'https:' ? ';Secure' : '';
  document.cookie = `unjynx_token=${encodeURIComponent(tokens.accessToken)};path=/;max-age=${maxAge};SameSite=Lax${secure}`;
}

export function clearTokens(): void {
  if (typeof window === 'undefined') return;

  localStorage.removeItem('unjynx_token');
  localStorage.removeItem('unjynx_refresh_token');
  localStorage.removeItem('unjynx_token_expires');
  sessionStorage.removeItem('unjynx_code_verifier');
  sessionStorage.removeItem('unjynx_auth_state');

  // Clear cookie — must match path
  document.cookie = 'unjynx_token=;path=/;max-age=0;SameSite=Lax';
}

export function isTokenExpired(): boolean {
  if (typeof window === 'undefined') return true;

  const expires = localStorage.getItem('unjynx_token_expires');
  if (!expires) return true;

  // Consider expired 60s before actual expiry
  return Date.now() >= Number(expires) - 60_000;
}

export function getStoredRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('unjynx_refresh_token');
}
