/**
 * k6 Auth Flow Load Test
 *
 * Tests the authentication flow:
 *   1. POST /api/v1/auth/callback (login with auth code)
 *   2. GET  /api/v1/auth/me (get profile)
 *   3. POST /api/v1/auth/refresh (refresh token)
 *
 * Ramp: 0 -> 50 users over 1min, hold 2min, ramp down 1min
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';
import { API_PREFIX, THINK_TIME, thresholds, randomString } from '../config.js';

const authFailRate = new Rate('auth_failures');
const loginDuration = new Trend('login_duration', true);
const profileDuration = new Trend('profile_duration', true);
const refreshDuration = new Trend('refresh_duration', true);

export const options = {
  stages: [
    { duration: '1m', target: 50 },  // ramp up to 50 users
    { duration: '2m', target: 50 },  // hold at 50 users
    { duration: '1m', target: 0 },   // ramp down
  ],
  thresholds: {
    ...thresholds,
    auth_failures: ['rate<0.05'],
    login_duration: ['p(95)<300'],
    profile_duration: ['p(95)<150'],
    refresh_duration: ['p(95)<200'],
  },
};

export default function () {
  // Step 1: Login via auth callback
  const loginPayload = JSON.stringify({
    code: `test_code_${randomString(16)}`,
    redirectUri: 'unjynx://callback',
  });

  const loginRes = http.post(`${API_PREFIX}/auth/callback`, loginPayload, {
    headers: { 'Content-Type': 'application/json' },
    tags: { name: 'auth_login' },
  });

  loginDuration.add(loginRes.timings.duration);

  const loginOk = check(loginRes, {
    'login status is 200': (r) => r.status === 200,
    'login response time < 200ms': (r) => r.timings.duration < 200,
    'login returns access token': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.accessToken !== undefined;
      } catch {
        return false;
      }
    },
  });

  if (!loginOk) {
    authFailRate.add(1);
    sleep(THINK_TIME);
    return;
  }

  authFailRate.add(0);

  let accessToken;
  let refreshToken;
  try {
    const body = JSON.parse(loginRes.body);
    accessToken = body.accessToken;
    refreshToken = body.refreshToken;
  } catch {
    sleep(THINK_TIME);
    return;
  }

  sleep(THINK_TIME);

  // Step 2: Get profile
  const profileRes = http.get(`${API_PREFIX}/auth/me`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    tags: { name: 'auth_profile' },
  });

  profileDuration.add(profileRes.timings.duration);

  check(profileRes, {
    'profile status is 200': (r) => r.status === 200,
    'profile response time < 200ms': (r) => r.timings.duration < 200,
    'profile returns user data': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.id !== undefined || body.profileId !== undefined;
      } catch {
        return false;
      }
    },
  });

  sleep(THINK_TIME);

  // Step 3: Refresh token
  const refreshPayload = JSON.stringify({
    refreshToken: refreshToken || `test_refresh_${randomString(16)}`,
  });

  const refreshRes = http.post(`${API_PREFIX}/auth/refresh`, refreshPayload, {
    headers: { 'Content-Type': 'application/json' },
    tags: { name: 'auth_refresh' },
  });

  refreshDuration.add(refreshRes.timings.duration);

  check(refreshRes, {
    'refresh status is 200': (r) => r.status === 200,
    'refresh response time < 200ms': (r) => r.timings.duration < 200,
    'refresh returns new token': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.accessToken !== undefined;
      } catch {
        return false;
      }
    },
  });

  sleep(THINK_TIME);
}
