/**
 * k6 Load Test Configuration for UNJYNX Backend API
 *
 * Shared configuration used by all scenario scripts.
 * Override BASE_URL via environment variable:
 *   k6 run -e BASE_URL=https://staging.unjynx.com scenarios/auth.js
 */

export const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
export const API_PREFIX = `${BASE_URL}/api/v1`;
export const THINK_TIME = 1; // seconds between requests

export const thresholds = {
  http_req_duration: ['p(95)<200', 'p(99)<500'],
  http_req_failed: ['rate<0.01'],
  http_reqs: ['rate>50'],
};

/**
 * Default headers for authenticated requests.
 * The token is injected by each scenario after login.
 */
export function authHeaders(token) {
  return {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };
}

/**
 * Generate a random string of given length for test data.
 */
export function randomString(length) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Generate a random integer between min and max (inclusive).
 */
export function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
