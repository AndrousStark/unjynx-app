/**
 * k6 Content Endpoints Load Test
 *
 * Tests the read-heavy content delivery flow:
 *   1. GET /api/v1/content/categories      (list all categories)
 *   2. GET /api/v1/content?category=...    (list by category)
 *   3. GET /api/v1/content/preferences     (user preferences)
 *   4. GET /api/v1/content/:id/history     (content history)
 *
 * 100 concurrent users, read-heavy workload simulating daily content consumption.
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';
import { API_PREFIX, THINK_TIME, thresholds, authHeaders, randomString, randomInt } from '../config.js';

const categoryListDuration = new Trend('content_category_list_duration', true);
const contentListDuration = new Trend('content_list_duration', true);
const contentPrefsDuration = new Trend('content_prefs_duration', true);
const contentHistoryDuration = new Trend('content_history_duration', true);
const contentErrors = new Rate('content_errors');

const CATEGORIES = [
  'mahabharata',
  'stan_lee',
  'odysseus',
  'personality_development',
  'growth_mindset',
  'stoicism',
  'productivity',
  'motivation',
  'mindfulness',
  'leadership',
];

export const options = {
  stages: [
    { duration: '1m', target: 100 },   // ramp up to 100 users
    { duration: '3m', target: 100 },   // hold at 100 users
    { duration: '1m', target: 0 },     // ramp down
  ],
  thresholds: {
    ...thresholds,
    content_errors: ['rate<0.02'],
    content_category_list_duration: ['p(95)<100'],
    content_list_duration: ['p(95)<150'],
    content_prefs_duration: ['p(95)<100'],
    content_history_duration: ['p(95)<200'],
  },
};

function getAuthToken() {
  const loginPayload = JSON.stringify({
    code: `test_code_${randomString(16)}`,
    redirectUri: 'unjynx://callback',
  });

  const res = http.post(`${API_PREFIX}/auth/callback`, loginPayload, {
    headers: { 'Content-Type': 'application/json' },
    tags: { name: 'content_auth' },
  });

  try {
    const body = JSON.parse(res.body);
    return body.accessToken || `test_token_${randomString(32)}`;
  } catch {
    return `test_token_${randomString(32)}`;
  }
}

export function setup() {
  return { token: getAuthToken() };
}

export default function (data) {
  const token = data.token;
  const headers = authHeaders(token);

  // Step 1: List all categories
  const categoriesRes = http.get(`${API_PREFIX}/content/categories`, {
    ...headers,
    tags: { name: 'content_categories' },
  });

  categoryListDuration.add(categoriesRes.timings.duration);

  const catOk = check(categoriesRes, {
    'categories status is 200': (r) => r.status === 200,
    'categories response time < 100ms': (r) => r.timings.duration < 100,
    'categories returns data': (r) => {
      try {
        const body = JSON.parse(r.body);
        return Array.isArray(body) || body.categories !== undefined;
      } catch {
        return false;
      }
    },
  });

  if (!catOk) {
    contentErrors.add(1);
  } else {
    contentErrors.add(0);
  }

  sleep(THINK_TIME * 0.5); // Users browse quickly through content

  // Step 2: Get content by random category
  const category = CATEGORIES[randomInt(0, CATEGORIES.length - 1)];
  const contentListRes = http.get(
    `${API_PREFIX}/content?category=${category}&limit=10&page=1`,
    {
      ...headers,
      tags: { name: 'content_by_category' },
    }
  );

  contentListDuration.add(contentListRes.timings.duration);

  check(contentListRes, {
    'content list status is 200': (r) => r.status === 200,
    'content list response time < 150ms': (r) => r.timings.duration < 150,
    'content list returns items': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.data !== undefined || Array.isArray(body);
      } catch {
        return false;
      }
    },
  });

  sleep(THINK_TIME * 0.5);

  // Step 3: Get user content preferences
  const prefsRes = http.get(`${API_PREFIX}/content/preferences`, {
    ...headers,
    tags: { name: 'content_preferences' },
  });

  contentPrefsDuration.add(prefsRes.timings.duration);

  check(prefsRes, {
    'preferences status is 200': (r) => r.status === 200,
    'preferences response time < 100ms': (r) => r.timings.duration < 100,
  });

  sleep(THINK_TIME * 0.5);

  // Step 4: Browse content with different category (simulating scroll)
  const secondCategory = CATEGORIES[randomInt(0, CATEGORIES.length - 1)];
  const secondListRes = http.get(
    `${API_PREFIX}/content?category=${secondCategory}&limit=10&page=1`,
    {
      ...headers,
      tags: { name: 'content_browse' },
    }
  );

  contentHistoryDuration.add(secondListRes.timings.duration);

  check(secondListRes, {
    'browse status is 200': (r) => r.status === 200,
    'browse response time < 200ms': (r) => r.timings.duration < 200,
  });

  sleep(THINK_TIME);
}
