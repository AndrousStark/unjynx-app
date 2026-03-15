/**
 * k6 Full Load Test - Combined Scenarios
 *
 * Runs all scenarios together with weighted distribution:
 *   - 40% Task CRUD operations
 *   - 30% Content reads (read-heavy)
 *   - 20% Sync push/pull
 *   - 10% Auth flow
 *
 * Target: 200 concurrent users
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';
import { API_PREFIX, THINK_TIME, thresholds, authHeaders, randomString, randomInt } from '../config.js';

// Global metrics
const overallErrors = new Rate('overall_errors');
const scenarioCounter = new Counter('scenario_executions');

// Per-scenario metrics
const authDuration = new Trend('full_auth_duration', true);
const taskDuration = new Trend('full_task_duration', true);
const contentDuration = new Trend('full_content_duration', true);
const syncDuration = new Trend('full_sync_duration', true);

const PRIORITIES = ['low', 'medium', 'high', 'urgent'];
const CATEGORIES = [
  'mahabharata', 'stan_lee', 'odysseus', 'productivity',
  'growth_mindset', 'stoicism', 'motivation', 'mindfulness',
];
const TASK_TITLES = [
  'Review report', 'Schedule meeting', 'Fix bug', 'Write tests',
  'Update docs', 'Deploy staging', 'Code review', 'Design update',
  'Client prep', 'Performance audit', 'DB migration', 'API refactor',
];

export const options = {
  stages: [
    { duration: '2m', target: 50 },    // warm up
    { duration: '2m', target: 100 },   // ramp up
    { duration: '2m', target: 200 },   // full load
    { duration: '5m', target: 200 },   // sustained load
    { duration: '2m', target: 100 },   // cool down
    { duration: '1m', target: 0 },     // ramp down
  ],
  thresholds: {
    ...thresholds,
    overall_errors: ['rate<0.05'],
    full_auth_duration: ['p(95)<300'],
    full_task_duration: ['p(95)<250'],
    full_content_duration: ['p(95)<150'],
    full_sync_duration: ['p(95)<500'],
    http_req_duration: ['p(95)<300', 'p(99)<800'],
  },
};

function getAuthToken() {
  const loginPayload = JSON.stringify({
    code: `test_code_${randomString(16)}`,
    redirectUri: 'unjynx://callback',
  });

  const res = http.post(`${API_PREFIX}/auth/callback`, loginPayload, {
    headers: { 'Content-Type': 'application/json' },
    tags: { name: 'full_load_auth_setup' },
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

// ── Auth scenario (10% weight) ──────────────────────────────────────────

function authScenario(headers) {
  group('auth_flow', function () {
    const loginRes = http.post(`${API_PREFIX}/auth/callback`, JSON.stringify({
      code: `test_code_${randomString(16)}`,
      redirectUri: 'unjynx://callback',
    }), {
      headers: { 'Content-Type': 'application/json' },
      tags: { name: 'full_auth_login' },
    });

    authDuration.add(loginRes.timings.duration);

    const ok = check(loginRes, {
      'auth: login 200': (r) => r.status === 200,
    });

    overallErrors.add(ok ? 0 : 1);

    sleep(THINK_TIME * 0.5);

    const profileRes = http.get(`${API_PREFIX}/auth/me`, {
      ...headers,
      tags: { name: 'full_auth_profile' },
    });

    authDuration.add(profileRes.timings.duration);

    check(profileRes, {
      'auth: profile 200': (r) => r.status === 200,
    });
  });

  scenarioCounter.add(1, { scenario: 'auth' });
}

// ── Task CRUD scenario (40% weight) ─────────────────────────────────────

function taskCrudScenario(headers) {
  group('task_crud', function () {
    // Create
    const title = TASK_TITLES[randomInt(0, TASK_TITLES.length - 1)];
    const createRes = http.post(`${API_PREFIX}/tasks`, JSON.stringify({
      title: `${title} - ${randomString(4)}`,
      priority: PRIORITIES[randomInt(0, PRIORITIES.length - 1)],
      dueDate: new Date(Date.now() + randomInt(1, 14) * 86400000).toISOString(),
    }), {
      ...headers,
      tags: { name: 'full_task_create' },
    });

    taskDuration.add(createRes.timings.duration);

    const createOk = check(createRes, {
      'task: create 201': (r) => r.status === 201,
    });

    overallErrors.add(createOk ? 0 : 1);

    if (!createOk) return;

    let taskId;
    try {
      taskId = JSON.parse(createRes.body).id;
    } catch {
      return;
    }

    sleep(THINK_TIME * 0.3);

    // List
    const listRes = http.get(`${API_PREFIX}/tasks?limit=20`, {
      ...headers,
      tags: { name: 'full_task_list' },
    });
    taskDuration.add(listRes.timings.duration);
    check(listRes, { 'task: list 200': (r) => r.status === 200 });

    sleep(THINK_TIME * 0.3);

    // Update
    const updateRes = http.patch(`${API_PREFIX}/tasks/${taskId}`, JSON.stringify({
      title: `Updated ${randomString(4)}`,
    }), {
      ...headers,
      tags: { name: 'full_task_update' },
    });
    taskDuration.add(updateRes.timings.duration);
    check(updateRes, { 'task: update 200': (r) => r.status === 200 });

    sleep(THINK_TIME * 0.3);

    // Complete and delete
    http.post(`${API_PREFIX}/tasks/${taskId}/complete`, null, {
      ...headers,
      tags: { name: 'full_task_complete' },
    });

    http.del(`${API_PREFIX}/tasks/${taskId}`, null, {
      ...headers,
      tags: { name: 'full_task_delete' },
    });
  });

  scenarioCounter.add(1, { scenario: 'task_crud' });
}

// ── Content scenario (30% weight) ───────────────────────────────────────

function contentScenario(headers) {
  group('content_reads', function () {
    // Categories
    const catRes = http.get(`${API_PREFIX}/content/categories`, {
      ...headers,
      tags: { name: 'full_content_categories' },
    });
    contentDuration.add(catRes.timings.duration);
    check(catRes, { 'content: categories 200': (r) => r.status === 200 });

    sleep(THINK_TIME * 0.3);

    // By category
    const category = CATEGORIES[randomInt(0, CATEGORIES.length - 1)];
    const listRes = http.get(`${API_PREFIX}/content?category=${category}&limit=10`, {
      ...headers,
      tags: { name: 'full_content_list' },
    });
    contentDuration.add(listRes.timings.duration);

    const listOk = check(listRes, {
      'content: list 200': (r) => r.status === 200,
    });

    overallErrors.add(listOk ? 0 : 1);

    sleep(THINK_TIME * 0.3);

    // Preferences
    const prefsRes = http.get(`${API_PREFIX}/content/preferences`, {
      ...headers,
      tags: { name: 'full_content_prefs' },
    });
    contentDuration.add(prefsRes.timings.duration);
    check(prefsRes, { 'content: prefs 200': (r) => r.status === 200 });
  });

  scenarioCounter.add(1, { scenario: 'content' });
}

// ── Sync scenario (20% weight) ──────────────────────────────────────────

function syncScenario(headers) {
  group('sync_flow', function () {
    // Push changes
    const changes = [];
    for (let i = 0; i < 5; i++) {
      changes.push({
        id: `change_${randomString(8)}`,
        entityType: 'task',
        entityId: `entity_${randomString(8)}`,
        operation: 'update',
        data: { title: `Synced ${randomString(4)}`, updatedAt: new Date().toISOString() },
        clientTimestamp: new Date().toISOString(),
        version: randomInt(1, 50),
      });
    }

    const pushRes = http.post(`${API_PREFIX}/sync/push`, JSON.stringify({
      changes,
      lastSyncTimestamp: new Date(Date.now() - 1800000).toISOString(),
    }), {
      ...headers,
      tags: { name: 'full_sync_push' },
    });

    syncDuration.add(pushRes.timings.duration);

    const pushOk = check(pushRes, {
      'sync: push 200': (r) => r.status === 200,
    });

    overallErrors.add(pushOk ? 0 : 1);

    sleep(THINK_TIME * 0.3);

    // Pull changes
    const pullRes = http.post(`${API_PREFIX}/sync/pull`, JSON.stringify({
      lastSyncTimestamp: new Date(Date.now() - 3600000).toISOString(),
      entityTypes: ['task', 'project'],
    }), {
      ...headers,
      tags: { name: 'full_sync_pull' },
    });

    syncDuration.add(pullRes.timings.duration);
    check(pullRes, { 'sync: pull 200': (r) => r.status === 200 });

    sleep(THINK_TIME * 0.3);

    // Status
    const statusRes = http.get(`${API_PREFIX}/sync/status`, {
      ...headers,
      tags: { name: 'full_sync_status' },
    });
    syncDuration.add(statusRes.timings.duration);
    check(statusRes, { 'sync: status 200': (r) => r.status === 200 });
  });

  scenarioCounter.add(1, { scenario: 'sync' });
}

// ── Main execution ──────────────────────────────────────────────────────

export default function (data) {
  const token = data.token;
  const headers = authHeaders(token);

  // Weighted random selection: 40% task, 30% content, 20% sync, 10% auth
  const roll = Math.random() * 100;

  if (roll < 40) {
    taskCrudScenario(headers);
  } else if (roll < 70) {
    contentScenario(headers);
  } else if (roll < 90) {
    syncScenario(headers);
  } else {
    authScenario(headers);
  }

  sleep(THINK_TIME);
}
