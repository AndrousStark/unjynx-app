/**
 * k6 Task CRUD Load Test
 *
 * Tests the full task lifecycle:
 *   1. POST   /api/v1/tasks       (create)
 *   2. GET    /api/v1/tasks       (list)
 *   3. GET    /api/v1/tasks/:id   (get single)
 *   4. PATCH  /api/v1/tasks/:id   (update)
 *   5. POST   /api/v1/tasks/:id/complete  (complete)
 *   6. DELETE /api/v1/tasks/:id   (delete)
 *
 * Ramp: 0 -> 100 users over 2min, hold 3min, ramp down 1min
 */

import http from 'k6/http';
import { check, sleep, fail } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';
import { API_PREFIX, THINK_TIME, thresholds, authHeaders, randomString, randomInt } from '../config.js';

const taskCreateDuration = new Trend('task_create_duration', true);
const taskListDuration = new Trend('task_list_duration', true);
const taskGetDuration = new Trend('task_get_duration', true);
const taskUpdateDuration = new Trend('task_update_duration', true);
const taskCompleteDuration = new Trend('task_complete_duration', true);
const taskDeleteDuration = new Trend('task_delete_duration', true);
const crudErrors = new Rate('crud_errors');
const tasksCreated = new Counter('tasks_created');

const PRIORITIES = ['low', 'medium', 'high', 'urgent'];
const TASK_TITLES = [
  'Review quarterly report',
  'Schedule team standup',
  'Fix production bug',
  'Write unit tests',
  'Update documentation',
  'Deploy to staging',
  'Code review PR #42',
  'Design system update',
  'Client meeting prep',
  'Performance optimization',
  'Database migration',
  'API endpoint refactor',
  'Security audit items',
  'Sprint retrospective',
  'Feature flag cleanup',
];

export const options = {
  stages: [
    { duration: '2m', target: 100 },  // ramp up to 100 users
    { duration: '3m', target: 100 },  // hold at 100 users
    { duration: '1m', target: 0 },    // ramp down
  ],
  thresholds: {
    ...thresholds,
    crud_errors: ['rate<0.05'],
    task_create_duration: ['p(95)<250'],
    task_list_duration: ['p(95)<200'],
    task_get_duration: ['p(95)<150'],
    task_update_duration: ['p(95)<200'],
    task_complete_duration: ['p(95)<200'],
    task_delete_duration: ['p(95)<200'],
  },
};

/**
 * Simulate login and return a token.
 * In a real setup, this would call the auth endpoint.
 */
function getAuthToken() {
  const loginPayload = JSON.stringify({
    code: `test_code_${randomString(16)}`,
    redirectUri: 'unjynx://callback',
  });

  const res = http.post(`${API_PREFIX}/auth/callback`, loginPayload, {
    headers: { 'Content-Type': 'application/json' },
    tags: { name: 'task_crud_auth' },
  });

  try {
    const body = JSON.parse(res.body);
    return body.accessToken || `test_token_${randomString(32)}`;
  } catch {
    return `test_token_${randomString(32)}`;
  }
}

export function setup() {
  // Pre-authenticate for the test run
  return { token: getAuthToken() };
}

export default function (data) {
  const token = data.token;
  const headers = authHeaders(token);

  // Step 1: Create a task with randomized data
  const title = TASK_TITLES[randomInt(0, TASK_TITLES.length - 1)];
  const priority = PRIORITIES[randomInt(0, PRIORITIES.length - 1)];

  const createPayload = JSON.stringify({
    title: `${title} - ${randomString(6)}`,
    description: `Load test task created at ${new Date().toISOString()}`,
    priority,
    dueDate: new Date(Date.now() + randomInt(1, 30) * 86400000).toISOString(),
  });

  const createRes = http.post(`${API_PREFIX}/tasks`, createPayload, {
    ...headers,
    tags: { name: 'task_create' },
  });

  taskCreateDuration.add(createRes.timings.duration);

  const createOk = check(createRes, {
    'create status is 201': (r) => r.status === 201,
    'create response time < 250ms': (r) => r.timings.duration < 250,
    'create returns task id': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.id !== undefined;
      } catch {
        return false;
      }
    },
  });

  if (!createOk) {
    crudErrors.add(1);
    sleep(THINK_TIME);
    return;
  }

  crudErrors.add(0);
  tasksCreated.add(1);

  let taskId;
  try {
    const body = JSON.parse(createRes.body);
    taskId = body.id;
  } catch {
    sleep(THINK_TIME);
    return;
  }

  sleep(THINK_TIME);

  // Step 2: List tasks
  const listRes = http.get(`${API_PREFIX}/tasks?limit=20`, {
    ...headers,
    tags: { name: 'task_list' },
  });

  taskListDuration.add(listRes.timings.duration);

  check(listRes, {
    'list status is 200': (r) => r.status === 200,
    'list response time < 200ms': (r) => r.timings.duration < 200,
    'list returns array': (r) => {
      try {
        const body = JSON.parse(r.body);
        return Array.isArray(body.data) || Array.isArray(body);
      } catch {
        return false;
      }
    },
  });

  sleep(THINK_TIME);

  // Step 3: Get single task
  const getRes = http.get(`${API_PREFIX}/tasks/${taskId}`, {
    ...headers,
    tags: { name: 'task_get' },
  });

  taskGetDuration.add(getRes.timings.duration);

  check(getRes, {
    'get status is 200': (r) => r.status === 200,
    'get response time < 150ms': (r) => r.timings.duration < 150,
    'get returns correct task': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.id === taskId;
      } catch {
        return false;
      }
    },
  });

  sleep(THINK_TIME);

  // Step 4: Update the task
  const updatePayload = JSON.stringify({
    title: `Updated: ${title} - ${randomString(4)}`,
    priority: PRIORITIES[randomInt(0, PRIORITIES.length - 1)],
  });

  const updateRes = http.patch(`${API_PREFIX}/tasks/${taskId}`, updatePayload, {
    ...headers,
    tags: { name: 'task_update' },
  });

  taskUpdateDuration.add(updateRes.timings.duration);

  check(updateRes, {
    'update status is 200': (r) => r.status === 200,
    'update response time < 200ms': (r) => r.timings.duration < 200,
  });

  sleep(THINK_TIME);

  // Step 5: Complete the task
  const completeRes = http.post(`${API_PREFIX}/tasks/${taskId}/complete`, null, {
    ...headers,
    tags: { name: 'task_complete' },
  });

  taskCompleteDuration.add(completeRes.timings.duration);

  check(completeRes, {
    'complete status is 200': (r) => r.status === 200,
    'complete response time < 200ms': (r) => r.timings.duration < 200,
  });

  sleep(THINK_TIME);

  // Step 6: Delete the task (cleanup)
  const deleteRes = http.del(`${API_PREFIX}/tasks/${taskId}`, null, {
    ...headers,
    tags: { name: 'task_delete' },
  });

  taskDeleteDuration.add(deleteRes.timings.duration);

  check(deleteRes, {
    'delete status is 200 or 204': (r) => r.status === 200 || r.status === 204,
    'delete response time < 200ms': (r) => r.timings.duration < 200,
  });

  sleep(THINK_TIME);
}
