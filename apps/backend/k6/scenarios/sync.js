/**
 * k6 Sync Flow Load Test
 *
 * Tests the offline sync push/pull mechanism:
 *   1. POST /api/v1/sync/push   (push 10 local changes)
 *   2. POST /api/v1/sync/pull   (pull remote changes)
 *   3. GET  /api/v1/sync/status (verify sync state)
 *
 * 50 concurrent users simulating mobile clients syncing after offline periods.
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';
import { API_PREFIX, THINK_TIME, thresholds, authHeaders, randomString } from '../config.js';

const syncPushDuration = new Trend('sync_push_duration', true);
const syncPullDuration = new Trend('sync_pull_duration', true);
const syncStatusDuration = new Trend('sync_status_duration', true);
const syncErrors = new Rate('sync_errors');
const changesPushed = new Counter('changes_pushed');
const changesPulled = new Counter('changes_pulled');

export const options = {
  stages: [
    { duration: '30s', target: 50 },  // ramp up
    { duration: '3m', target: 50 },   // hold at 50 users
    { duration: '30s', target: 0 },   // ramp down
  ],
  thresholds: {
    ...thresholds,
    sync_errors: ['rate<0.05'],
    sync_push_duration: ['p(95)<500'],   // push can be slower (batch)
    sync_pull_duration: ['p(95)<300'],
    sync_status_duration: ['p(95)<100'],
  },
};

/**
 * Generate a batch of sync changes simulating offline task edits.
 */
function generateSyncChanges(count) {
  const entityTypes = ['task', 'project', 'tag', 'subtask'];
  const operations = ['create', 'update', 'delete'];
  const changes = [];

  for (let i = 0; i < count; i++) {
    const entityType = entityTypes[Math.floor(Math.random() * entityTypes.length)];
    const operation = operations[Math.floor(Math.random() * operations.length)];

    changes.push({
      id: `change_${randomString(12)}`,
      entityType,
      entityId: `entity_${randomString(8)}`,
      operation,
      data: operation !== 'delete' ? {
        title: `Synced ${entityType} ${randomString(6)}`,
        updatedAt: new Date().toISOString(),
      } : null,
      clientTimestamp: new Date(Date.now() - Math.floor(Math.random() * 3600000)).toISOString(),
      version: Math.floor(Math.random() * 100) + 1,
    });
  }

  return changes;
}

function getAuthToken() {
  const loginPayload = JSON.stringify({
    code: `test_code_${randomString(16)}`,
    redirectUri: 'unjynx://callback',
  });

  const res = http.post(`${API_PREFIX}/auth/callback`, loginPayload, {
    headers: { 'Content-Type': 'application/json' },
    tags: { name: 'sync_auth' },
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

  // Step 1: Push 10 local changes
  const changes = generateSyncChanges(10);
  const pushPayload = JSON.stringify({
    changes,
    lastSyncTimestamp: new Date(Date.now() - 3600000).toISOString(),
  });

  const pushRes = http.post(`${API_PREFIX}/sync/push`, pushPayload, {
    ...headers,
    tags: { name: 'sync_push' },
  });

  syncPushDuration.add(pushRes.timings.duration);

  const pushOk = check(pushRes, {
    'push status is 200': (r) => r.status === 200,
    'push response time < 500ms': (r) => r.timings.duration < 500,
    'push returns sync result': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.accepted !== undefined || body.conflicts !== undefined || body.processed !== undefined;
      } catch {
        return false;
      }
    },
  });

  if (pushOk) {
    changesPushed.add(10);
    syncErrors.add(0);
  } else {
    syncErrors.add(1);
  }

  sleep(THINK_TIME);

  // Step 2: Pull remote changes
  const pullPayload = JSON.stringify({
    lastSyncTimestamp: new Date(Date.now() - 7200000).toISOString(),
    entityTypes: ['task', 'project', 'tag'],
  });

  const pullRes = http.post(`${API_PREFIX}/sync/pull`, pullPayload, {
    ...headers,
    tags: { name: 'sync_pull' },
  });

  syncPullDuration.add(pullRes.timings.duration);

  const pullOk = check(pullRes, {
    'pull status is 200': (r) => r.status === 200,
    'pull response time < 300ms': (r) => r.timings.duration < 300,
    'pull returns changes array': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.changes !== undefined || Array.isArray(body);
      } catch {
        return false;
      }
    },
  });

  if (pullOk) {
    try {
      const body = JSON.parse(pullRes.body);
      const count = body.changes ? body.changes.length : (Array.isArray(body) ? body.length : 0);
      changesPulled.add(count);
    } catch {
      // Ignore parse errors for counter
    }
  }

  sleep(THINK_TIME);

  // Step 3: Verify sync status
  const statusRes = http.get(`${API_PREFIX}/sync/status`, {
    ...headers,
    tags: { name: 'sync_status' },
  });

  syncStatusDuration.add(statusRes.timings.duration);

  check(statusRes, {
    'status returns 200': (r) => r.status === 200,
    'status response time < 100ms': (r) => r.timings.duration < 100,
    'status returns sync state': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.lastSync !== undefined || body.status !== undefined;
      } catch {
        return false;
      }
    },
  });

  sleep(THINK_TIME);
}
