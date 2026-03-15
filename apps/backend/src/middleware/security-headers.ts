import type { Context, Next } from "hono";

/**
 * Security headers middleware for the UNJYNX API.
 *
 * Applies OWASP-recommended headers to all API responses:
 *   - Content-Security-Policy: restrictive (API serves JSON, not HTML)
 *   - Strict-Transport-Security: HSTS preload (2 years)
 *   - X-Content-Type-Options: prevent MIME sniffing
 *   - X-Frame-Options: prevent clickjacking
 *   - Referrer-Policy: limit referrer leakage
 *   - Permissions-Policy: disable unused browser features
 *   - Cache-Control: prevent caching of sensitive API responses
 *   - X-Request-Id: trace request through the system
 */
export async function securityHeadersMiddleware(
  c: Context,
  next: Next,
): Promise<void> {
  await next();

  // ── OWASP Security Headers ──
  c.header("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'");
  c.header("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  c.header("X-Content-Type-Options", "nosniff");
  c.header("X-Frame-Options", "DENY");
  c.header("X-XSS-Protection", "0"); // CSP supersedes legacy XSS filter
  c.header("Referrer-Policy", "strict-origin-when-cross-origin");
  c.header("Permissions-Policy", "camera=(), microphone=(), geolocation=(self), payment=()");
  c.header("Cache-Control", "no-store");
  c.header("Pragma", "no-cache");

  // ── Remove server fingerprint headers ──
  c.header("X-Powered-By", ""); // Strip framework identifier
  c.header("Server", "");       // Strip server identifier

  // ── Request tracing ──
  const requestId = c.req.header("X-Request-ID") ?? crypto.randomUUID();
  c.header("X-Request-ID", requestId);
}
