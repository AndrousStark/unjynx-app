// ---------------------------------------------------------------------------
// UNJYNX API Client
// ---------------------------------------------------------------------------
// Typed HTTP client that wraps fetch, adds Bearer auth, and parses the
// backend's standard envelope: { success, data, error }.
// ---------------------------------------------------------------------------

const BASE_URL =
  typeof window !== 'undefined'
    ? (process.env.NEXT_PUBLIC_API_URL ?? 'https://api.unjynx.me')
    : (process.env.NEXT_PUBLIC_API_URL ?? 'https://api.unjynx.me');

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ApiEnvelope<T> {
  readonly success: boolean;
  readonly data: T | null;
  readonly error: string | null;
  readonly meta?: {
    readonly total?: number;
    readonly page?: number;
    readonly limit?: number;
  };
}

export class ApiError extends Error {
  readonly status: number;
  readonly code: string | undefined;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

// ---------------------------------------------------------------------------
// Token helpers
// ---------------------------------------------------------------------------

function getToken(): string | null {
  if (typeof window === 'undefined') return null;

  // Prefer cookie (set by auth callback), fall back to localStorage
  const cookieMatch = document.cookie.match(/(?:^|;\s*)unjynx_token=([^;]*)/);
  if (cookieMatch?.[1]) return decodeURIComponent(cookieMatch[1]);

  return localStorage.getItem('unjynx_token');
}

function getOrgId(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem('unjynx-org');
    if (!stored) return null;
    const parsed = JSON.parse(stored);
    return parsed?.state?.currentOrgId ?? null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Request helpers
// ---------------------------------------------------------------------------

type Method = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

interface RequestOptions {
  readonly headers?: Record<string, string>;
  readonly signal?: AbortSignal;
  readonly params?: Record<string, string | number | boolean | undefined>;
}

function buildUrl(path: string, params?: Record<string, string | number | boolean | undefined>): string {
  const url = new URL(`${BASE_URL}${path}`);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    }
  }
  return url.toString();
}

async function request<T>(
  method: Method,
  path: string,
  body?: unknown,
  options?: RequestOptions,
): Promise<T> {
  const token = getToken();
  const orgId = getOrgId();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...options?.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (orgId) {
    headers['X-Org-Id'] = orgId;
  }

  const res = await fetch(buildUrl(path, options?.params), {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    signal: options?.signal,
    credentials: 'include',
  });

  // Handle 204 No Content
  if (res.status === 204) {
    return undefined as T;
  }

  let json: ApiEnvelope<T>;
  try {
    json = await res.json();
  } catch {
    throw new ApiError(
      `Server returned ${res.status} with non-JSON body`,
      res.status,
    );
  }

  if (!res.ok || !json.success) {
    throw new ApiError(
      json.error ?? `Request failed with status ${res.status}`,
      res.status,
    );
  }

  return json.data as T;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export const apiClient = {
  get<T>(path: string, options?: RequestOptions): Promise<T> {
    return request<T>('GET', path, undefined, options);
  },

  post<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return request<T>('POST', path, body, options);
  },

  patch<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return request<T>('PATCH', path, body, options);
  },

  put<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return request<T>('PUT', path, body, options);
  },

  delete<T = void>(path: string, options?: RequestOptions): Promise<T> {
    return request<T>('DELETE', path, undefined, options);
  },
} as const;
