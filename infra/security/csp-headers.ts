/**
 * Content Security Policy and Security Headers for UNJYNX
 *
 * Applied to:
 *   - Backend API responses (subset: no script-src needed)
 *   - Landing page (full CSP)
 *   - Admin panel (full CSP + inline styles for Refine)
 *
 * These headers provide defense-in-depth against:
 *   - Cross-Site Scripting (XSS)
 *   - Clickjacking
 *   - MIME sniffing attacks
 *   - Protocol downgrade attacks
 *   - Information leakage via referrer
 */

/**
 * CSP directives for the API backend.
 * Since the API serves JSON (not HTML), CSP is restrictive.
 */
export const API_CSP_HEADERS = {
  'Content-Security-Policy': [
    "default-src 'none'",
    "frame-ancestors 'none'",
    "base-uri 'none'",
    "form-action 'none'",
  ].join('; '),
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '0', // Disabled: modern CSP is preferred over legacy XSS filter
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload', // 2 years
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(self), payment=()',
  'Cache-Control': 'no-store',
  'Pragma': 'no-cache',
} as const;

/**
 * CSP directives for the landing page (Astro on Vercel).
 * More permissive to allow fonts, images, and analytics.
 */
export const LANDING_CSP_HEADERS = {
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' https://cdn.vercel-insights.com https://app.posthog.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://api.unjynx.com https://app.posthog.com https://vitals.vercel-insights.com",
    "media-src 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "upgrade-insecure-requests",
  ].join('; '),
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '0',
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
} as const;

/**
 * CSP directives for the admin panel (React + Refine on Vercel).
 * Slightly more permissive for the admin dashboard UI.
 */
export const ADMIN_CSP_HEADERS = {
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com", // Refine uses inline styles
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://api.unjynx.com wss://api.unjynx.com https://auth.unjynx.com",
    "media-src 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "upgrade-insecure-requests",
  ].join('; '),
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'SAMEORIGIN', // Allow framing within admin panel itself
  'X-XSS-Protection': '0',
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
} as const;

/**
 * CORS configuration for the API backend.
 * Restricts cross-origin access to known frontends.
 */
export const CORS_CONFIG = {
  /** Allowed origins for production. */
  production: [
    'https://unjynx.com',
    'https://www.unjynx.com',
    'https://admin.unjynx.com',
    'https://api.unjynx.com',
  ],

  /** Additional origins for staging/development. */
  development: [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:4321', // Astro dev server
    'http://localhost:5173', // Vite dev server (admin)
  ],

  /** Allowed HTTP methods. */
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'] as const,

  /** Allowed request headers. */
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Request-ID',
    'X-Idempotency-Key',
    'Accept',
    'Accept-Language',
  ] as const,

  /** Headers exposed to the client. */
  exposedHeaders: [
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining',
    'X-RateLimit-Reset',
    'X-Request-ID',
    'Retry-After',
  ] as const,

  /** Preflight cache duration (24 hours). */
  maxAge: 86400,

  /** Allow credentials (cookies, authorization headers). */
  credentials: true,
} as const;

/**
 * Returns the appropriate CSP headers for a given target.
 */
export function getCspHeaders(
  target: 'api' | 'landing' | 'admin'
): Record<string, string> {
  switch (target) {
    case 'api':
      return { ...API_CSP_HEADERS };
    case 'landing':
      return { ...LANDING_CSP_HEADERS };
    case 'admin':
      return { ...ADMIN_CSP_HEADERS };
  }
}

/**
 * Returns CORS allowed origins based on environment.
 */
export function getCorsOrigins(env: 'production' | 'development'): readonly string[] {
  if (env === 'production') {
    return CORS_CONFIG.production;
  }
  return [...CORS_CONFIG.production, ...CORS_CONFIG.development];
}

export type CspTarget = 'api' | 'landing' | 'admin';
export type CorsConfig = typeof CORS_CONFIG;
