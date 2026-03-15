/**
 * UNJYNX Backend API - k6 Load Test Suite
 *
 * Comprehensive load testing for all major API endpoints.
 * Supports three test profiles: smoke, load, and stress.
 *
 * Usage:
 *   k6 run api-load-test.js                              # default load test
 *   k6 run --env TEST_TYPE=smoke api-load-test.js        # smoke test
 *   k6 run --env TEST_TYPE=stress api-load-test.js       # stress test
 *   k6 run --env BASE_URL=http://staging:3000 api-load-test.js
 *
 * Environment variables:
 *   BASE_URL    - Backend base URL (default: http://localhost:3000)
 *   AUTH_TOKEN  - Bearer token for authenticated endpoints
 *   TEST_TYPE   - smoke | load | stress (default: load)
 */

import http from "k6/http";
import { check, group, sleep } from "k6";
import { Rate, Trend, Counter } from "k6/metrics";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";
const AUTH_TOKEN = __ENV.AUTH_TOKEN || "test-bearer-token";
const TEST_TYPE = __ENV.TEST_TYPE || "load";

// ---------------------------------------------------------------------------
// Custom metrics - one Trend per endpoint group, plus global counters
// ---------------------------------------------------------------------------

const healthDuration = new Trend("health_duration", true);
const authDuration = new Trend("auth_duration", true);
const taskListDuration = new Trend("task_list_duration", true);
const taskCreateDuration = new Trend("task_create_duration", true);
const taskUpdateDuration = new Trend("task_update_duration", true);
const projectListDuration = new Trend("project_list_duration", true);
const contentDuration = new Trend("content_duration", true);
const progressDuration = new Trend("progress_duration", true);
const syncDuration = new Trend("sync_duration", true);
const notificationDuration = new Trend("notification_duration", true);
const gamificationDuration = new Trend("gamification_duration", true);

const errorCount = new Counter("custom_errors");
const successRate = new Rate("custom_success_rate");

// ---------------------------------------------------------------------------
// Test profiles
// ---------------------------------------------------------------------------

const TEST_PROFILES = {
  smoke: {
    stages: [
      { duration: "10s", target: 1 },
      { duration: "30s", target: 1 },
      { duration: "10s", target: 0 },
    ],
    thresholds: {
      http_req_duration: ["p(95)<500"],
      http_req_failed: ["rate<0.05"],
    },
  },

  load: {
    stages: [
      { duration: "2m", target: 50 },   // ramp up to 50 VUs
      { duration: "5m", target: 50 },   // hold at 50 VUs
      { duration: "2m", target: 100 },  // ramp up to 100 VUs
      { duration: "5m", target: 100 },  // hold at 100 VUs
      { duration: "2m", target: 0 },    // ramp down
    ],
    thresholds: {
      http_req_duration: ["p(95)<200", "p(99)<500"],
      http_req_failed: ["rate<0.01"],
      custom_success_rate: ["rate>0.99"],
      health_duration: ["p(95)<100"],
      task_list_duration: ["p(95)<200"],
      task_create_duration: ["p(95)<300"],
      task_update_duration: ["p(95)<300"],
      project_list_duration: ["p(95)<200"],
      content_duration: ["p(95)<200"],
      progress_duration: ["p(95)<200"],
      sync_duration: ["p(95)<300"],
      notification_duration: ["p(95)<200"],
      gamification_duration: ["p(95)<200"],
    },
  },

  stress: {
    stages: [
      { duration: "1m", target: 50 },
      { duration: "2m", target: 100 },
      { duration: "2m", target: 200 },
      { duration: "3m", target: 200 },  // hold at peak
      { duration: "2m", target: 0 },
    ],
    thresholds: {
      http_req_duration: ["p(95)<500", "p(99)<1000"],
      http_req_failed: ["rate<0.05"],
      custom_success_rate: ["rate>0.95"],
    },
  },
};

const activeProfile = TEST_PROFILES[TEST_TYPE] || TEST_PROFILES.load;

export const options = {
  stages: activeProfile.stages,
  thresholds: activeProfile.thresholds,
  tags: { testType: TEST_TYPE },
  // Graceful stop: allow in-flight requests to finish
  gracefulStop: "30s",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function authHeaders() {
  return {
    Authorization: `Bearer ${AUTH_TOKEN}`,
    "Content-Type": "application/json",
  };
}

function publicHeaders() {
  return {
    "Content-Type": "application/json",
  };
}

/**
 * Generate a unique task title incorporating the VU id and iteration
 * to avoid collisions during concurrent writes.
 */
function taskTitle() {
  return `k6-task-${__VU}-${__ITER}-${Date.now()}`;
}

/**
 * Parse JSON body safely, returning null on failure.
 */
function safeJson(response) {
  try {
    return response.json();
  } catch (_) {
    return null;
  }
}

/**
 * Record success/failure on custom metrics.
 */
function recordOutcome(passed) {
  if (passed) {
    successRate.add(1);
  } else {
    successRate.add(0);
    errorCount.add(1);
  }
}

// ---------------------------------------------------------------------------
// Scenario: Health Check
// ---------------------------------------------------------------------------

function healthCheck() {
  group("Health Check", () => {
    const res = http.get(`${BASE_URL}/health`, {
      headers: publicHeaders(),
      tags: { endpoint: "health" },
    });

    healthDuration.add(res.timings.duration);

    const passed = check(res, {
      "health: status is 200 or 503": (r) =>
        r.status === 200 || r.status === 503,
      "health: response has success field": (r) => {
        const body = safeJson(r);
        return body !== null && typeof body.success === "boolean";
      },
      "health: contains status field": (r) => {
        const body = safeJson(r);
        return body !== null && body.data && body.data.status === "ok";
      },
    });

    recordOutcome(passed);
  });
}

// ---------------------------------------------------------------------------
// Scenario: Auth Flow
// ---------------------------------------------------------------------------

function authFlow() {
  group("Auth Flow", () => {
    // POST /auth/callback with a mock PKCE code exchange payload
    const callbackPayload = JSON.stringify({
      code: `mock-auth-code-${__VU}-${__ITER}`,
      redirectUri: "unjynx://auth/callback",
      codeVerifier: "mock-code-verifier-for-load-testing",
    });

    const callbackRes = http.post(
      `${BASE_URL}/api/v1/auth/callback`,
      callbackPayload,
      {
        headers: publicHeaders(),
        tags: { endpoint: "auth_callback" },
      },
    );

    authDuration.add(callbackRes.timings.duration);

    const passed = check(callbackRes, {
      "auth/callback: status is 200 or 400": (r) =>
        r.status === 200 || r.status === 400,
      "auth/callback: returns JSON envelope": (r) => {
        const body = safeJson(r);
        return body !== null && typeof body.success === "boolean";
      },
    });

    recordOutcome(passed);

    sleep(0.5);

    // GET /auth/me (requires valid token - expect 401 with mock token)
    const meRes = http.get(`${BASE_URL}/api/v1/auth/me`, {
      headers: authHeaders(),
      tags: { endpoint: "auth_me" },
    });

    authDuration.add(meRes.timings.duration);

    const mePassed = check(meRes, {
      "auth/me: status is 200 or 401": (r) =>
        r.status === 200 || r.status === 401,
      "auth/me: returns JSON": (r) => safeJson(r) !== null,
    });

    recordOutcome(mePassed);
  });
}

// ---------------------------------------------------------------------------
// Scenario: Task CRUD
// ---------------------------------------------------------------------------

function taskCrud() {
  group("Task CRUD", () => {
    // 1. List tasks
    const listRes = http.get(`${BASE_URL}/api/v1/tasks?page=1&limit=20`, {
      headers: authHeaders(),
      tags: { endpoint: "task_list" },
    });

    taskListDuration.add(listRes.timings.duration);

    const listPassed = check(listRes, {
      "tasks/list: status is 200 or 401": (r) =>
        r.status === 200 || r.status === 401,
      "tasks/list: returns JSON envelope": (r) => {
        const body = safeJson(r);
        return body !== null && typeof body.success === "boolean";
      },
      "tasks/list: has pagination meta if 200": (r) => {
        if (r.status !== 200) return true; // skip when auth fails
        const body = safeJson(r);
        return body !== null && body.meta && typeof body.meta.total === "number";
      },
    });

    recordOutcome(listPassed);

    sleep(1);

    // 2. Create a task
    const createPayload = JSON.stringify({
      title: taskTitle(),
      description: "Created by k6 load test",
      priority: "medium",
      status: "todo",
    });

    const createRes = http.post(
      `${BASE_URL}/api/v1/tasks`,
      createPayload,
      {
        headers: authHeaders(),
        tags: { endpoint: "task_create" },
      },
    );

    taskCreateDuration.add(createRes.timings.duration);

    const createPassed = check(createRes, {
      "tasks/create: status is 201 or 401": (r) =>
        r.status === 201 || r.status === 401,
      "tasks/create: returns created task or auth error": (r) => {
        const body = safeJson(r);
        return body !== null && typeof body.success === "boolean";
      },
    });

    recordOutcome(createPassed);

    // 3. Update the task if creation succeeded
    if (createRes.status === 201) {
      const body = safeJson(createRes);
      const taskId = body && body.data && body.data.id;

      if (taskId) {
        sleep(0.5);

        const updatePayload = JSON.stringify({
          title: `${taskTitle()}-updated`,
          priority: "high",
        });

        const updateRes = http.patch(
          `${BASE_URL}/api/v1/tasks/${taskId}`,
          updatePayload,
          {
            headers: authHeaders(),
            tags: { endpoint: "task_update" },
          },
        );

        taskUpdateDuration.add(updateRes.timings.duration);

        const updatePassed = check(updateRes, {
          "tasks/update: status is 200 or 401 or 404": (r) =>
            r.status === 200 || r.status === 401 || r.status === 404,
          "tasks/update: returns JSON envelope": (r) => {
            const b = safeJson(r);
            return b !== null && typeof b.success === "boolean";
          },
        });

        recordOutcome(updatePassed);
      }
    }
  });
}

// ---------------------------------------------------------------------------
// Scenario: Project List
// ---------------------------------------------------------------------------

function projectList() {
  group("Project List", () => {
    const res = http.get(`${BASE_URL}/api/v1/projects?page=1&limit=20`, {
      headers: authHeaders(),
      tags: { endpoint: "project_list" },
    });

    projectListDuration.add(res.timings.duration);

    const passed = check(res, {
      "projects/list: status is 200 or 401": (r) =>
        r.status === 200 || r.status === 401,
      "projects/list: returns JSON envelope": (r) => {
        const body = safeJson(r);
        return body !== null && typeof body.success === "boolean";
      },
      "projects/list: has pagination meta if 200": (r) => {
        if (r.status !== 200) return true;
        const body = safeJson(r);
        return body !== null && body.meta && typeof body.meta.total === "number";
      },
    });

    recordOutcome(passed);
  });
}

// ---------------------------------------------------------------------------
// Scenario: Content Feed
// ---------------------------------------------------------------------------

function contentFeed() {
  group("Content Feed", () => {
    // GET /content/today - daily content delivery
    const res = http.get(`${BASE_URL}/api/v1/content/today`, {
      headers: authHeaders(),
      tags: { endpoint: "content_today" },
    });

    contentDuration.add(res.timings.duration);

    const passed = check(res, {
      "content/today: status is 200, 401, or 404": (r) =>
        r.status === 200 || r.status === 401 || r.status === 404,
      "content/today: returns JSON envelope": (r) => {
        const body = safeJson(r);
        return body !== null && typeof body.success === "boolean";
      },
    });

    recordOutcome(passed);

    sleep(0.5);

    // GET /content/categories
    const catRes = http.get(`${BASE_URL}/api/v1/content/categories`, {
      headers: authHeaders(),
      tags: { endpoint: "content_categories" },
    });

    contentDuration.add(catRes.timings.duration);

    const catPassed = check(catRes, {
      "content/categories: status is 200 or 401": (r) =>
        r.status === 200 || r.status === 401,
      "content/categories: returns JSON": (r) => safeJson(r) !== null,
    });

    recordOutcome(catPassed);
  });
}

// ---------------------------------------------------------------------------
// Scenario: Progress Hub
// ---------------------------------------------------------------------------

function progressHub() {
  group("Progress Hub", () => {
    // GET /progress/rings
    const ringsRes = http.get(`${BASE_URL}/api/v1/progress/rings`, {
      headers: authHeaders(),
      tags: { endpoint: "progress_rings" },
    });

    progressDuration.add(ringsRes.timings.duration);

    const ringsPassed = check(ringsRes, {
      "progress/rings: status is 200 or 401": (r) =>
        r.status === 200 || r.status === 401,
      "progress/rings: returns JSON envelope": (r) => {
        const body = safeJson(r);
        return body !== null && typeof body.success === "boolean";
      },
    });

    recordOutcome(ringsPassed);

    sleep(0.5);

    // GET /progress/streak
    const streakRes = http.get(`${BASE_URL}/api/v1/progress/streak`, {
      headers: authHeaders(),
      tags: { endpoint: "progress_streak" },
    });

    progressDuration.add(streakRes.timings.duration);

    const streakPassed = check(streakRes, {
      "progress/streak: status is 200 or 401": (r) =>
        r.status === 200 || r.status === 401,
      "progress/streak: returns JSON": (r) => safeJson(r) !== null,
    });

    recordOutcome(streakPassed);

    sleep(0.5);

    // GET /progress/insights
    const insightsRes = http.get(`${BASE_URL}/api/v1/progress/insights`, {
      headers: authHeaders(),
      tags: { endpoint: "progress_insights" },
    });

    progressDuration.add(insightsRes.timings.duration);

    const insightsPassed = check(insightsRes, {
      "progress/insights: status is 200 or 401": (r) =>
        r.status === 200 || r.status === 401,
      "progress/insights: returns JSON": (r) => safeJson(r) !== null,
    });

    recordOutcome(insightsPassed);
  });
}

// ---------------------------------------------------------------------------
// Scenario: Sync Push
// ---------------------------------------------------------------------------

function syncPush() {
  group("Sync Push", () => {
    const pushPayload = JSON.stringify({
      records: [
        {
          entityType: "task",
          entityId: `k6-sync-${__VU}-${__ITER}`,
          operation: "upsert",
          data: {
            title: `Synced task ${__VU}-${__ITER}`,
            status: "todo",
            priority: "low",
          },
          clientTimestamp: new Date().toISOString(),
        },
      ],
    });

    const res = http.post(
      `${BASE_URL}/api/v1/sync/push`,
      pushPayload,
      {
        headers: authHeaders(),
        tags: { endpoint: "sync_push" },
      },
    );

    syncDuration.add(res.timings.duration);

    const passed = check(res, {
      "sync/push: status is 200 or 401": (r) =>
        r.status === 200 || r.status === 401,
      "sync/push: returns JSON envelope": (r) => {
        const body = safeJson(r);
        return body !== null && typeof body.success === "boolean";
      },
    });

    recordOutcome(passed);

    sleep(0.5);

    // GET /sync/status
    const statusRes = http.get(`${BASE_URL}/api/v1/sync/status`, {
      headers: authHeaders(),
      tags: { endpoint: "sync_status" },
    });

    syncDuration.add(statusRes.timings.duration);

    const statusPassed = check(statusRes, {
      "sync/status: status is 200 or 401": (r) =>
        r.status === 200 || r.status === 401,
      "sync/status: returns JSON": (r) => safeJson(r) !== null,
    });

    recordOutcome(statusPassed);
  });
}

// ---------------------------------------------------------------------------
// Scenario: Notifications
// ---------------------------------------------------------------------------

function notifications() {
  group("Notifications", () => {
    // GET /notifications/preferences
    const prefsRes = http.get(
      `${BASE_URL}/api/v1/notifications/preferences`,
      {
        headers: authHeaders(),
        tags: { endpoint: "notification_preferences" },
      },
    );

    notificationDuration.add(prefsRes.timings.duration);

    const prefsPassed = check(prefsRes, {
      "notifications/preferences: status is 200 or 401": (r) =>
        r.status === 200 || r.status === 401,
      "notifications/preferences: returns JSON envelope": (r) => {
        const body = safeJson(r);
        return body !== null && typeof body.success === "boolean";
      },
    });

    recordOutcome(prefsPassed);

    sleep(0.5);

    // GET /notifications/quota
    const quotaRes = http.get(`${BASE_URL}/api/v1/notifications/quota`, {
      headers: authHeaders(),
      tags: { endpoint: "notification_quota" },
    });

    notificationDuration.add(quotaRes.timings.duration);

    const quotaPassed = check(quotaRes, {
      "notifications/quota: status is 200 or 401": (r) =>
        r.status === 200 || r.status === 401,
      "notifications/quota: returns JSON": (r) => safeJson(r) !== null,
    });

    recordOutcome(quotaPassed);

    sleep(0.5);

    // GET /notifications/status?limit=10
    const statusRes = http.get(
      `${BASE_URL}/api/v1/notifications/status?limit=10`,
      {
        headers: authHeaders(),
        tags: { endpoint: "notification_status" },
      },
    );

    notificationDuration.add(statusRes.timings.duration);

    const statusPassed = check(statusRes, {
      "notifications/status: status is 200 or 401": (r) =>
        r.status === 200 || r.status === 401,
      "notifications/status: returns JSON": (r) => safeJson(r) !== null,
    });

    recordOutcome(statusPassed);
  });
}

// ---------------------------------------------------------------------------
// Scenario: Gamification
// ---------------------------------------------------------------------------

function gamification() {
  group("Gamification", () => {
    // GET /gamification/xp
    const xpRes = http.get(`${BASE_URL}/api/v1/gamification/xp`, {
      headers: authHeaders(),
      tags: { endpoint: "gamification_xp" },
    });

    gamificationDuration.add(xpRes.timings.duration);

    const xpPassed = check(xpRes, {
      "gamification/xp: status is 200 or 401": (r) =>
        r.status === 200 || r.status === 401,
      "gamification/xp: returns JSON envelope": (r) => {
        const body = safeJson(r);
        return body !== null && typeof body.success === "boolean";
      },
    });

    recordOutcome(xpPassed);

    sleep(0.5);

    // GET /gamification/achievements
    const achievRes = http.get(
      `${BASE_URL}/api/v1/gamification/achievements`,
      {
        headers: authHeaders(),
        tags: { endpoint: "gamification_achievements" },
      },
    );

    gamificationDuration.add(achievRes.timings.duration);

    const achievPassed = check(achievRes, {
      "gamification/achievements: status is 200 or 401": (r) =>
        r.status === 200 || r.status === 401,
      "gamification/achievements: returns JSON": (r) => safeJson(r) !== null,
    });

    recordOutcome(achievPassed);

    sleep(0.5);

    // GET /gamification/leaderboard?scope=global&limit=10
    const lbRes = http.get(
      `${BASE_URL}/api/v1/gamification/leaderboard?scope=global&limit=10`,
      {
        headers: authHeaders(),
        tags: { endpoint: "gamification_leaderboard" },
      },
    );

    gamificationDuration.add(lbRes.timings.duration);

    const lbPassed = check(lbRes, {
      "gamification/leaderboard: status is 200 or 401": (r) =>
        r.status === 200 || r.status === 401,
      "gamification/leaderboard: returns JSON": (r) => safeJson(r) !== null,
    });

    recordOutcome(lbPassed);
  });
}

// ---------------------------------------------------------------------------
// Main VU function
// ---------------------------------------------------------------------------

export default function () {
  // Every VU runs all scenario groups per iteration.
  // Sleeps between groups simulate realistic user think-time.

  healthCheck();
  sleep(1);

  authFlow();
  sleep(1);

  taskCrud();
  sleep(1);

  projectList();
  sleep(1);

  contentFeed();
  sleep(1);

  progressHub();
  sleep(1);

  syncPush();
  sleep(1);

  notifications();
  sleep(1);

  gamification();
  sleep(1);
}

// ---------------------------------------------------------------------------
// Setup / Teardown
// ---------------------------------------------------------------------------

export function setup() {
  // Verify the server is reachable before starting the load test.
  const res = http.get(`${BASE_URL}/health`, {
    headers: publicHeaders(),
    timeout: "10s",
  });

  const healthy = res.status === 200;

  if (!healthy) {
    console.warn(
      `WARNING: Health check returned ${res.status}. ` +
      `The backend at ${BASE_URL} may not be fully ready. ` +
      `Some tests may fail with connection errors.`,
    );
  }

  console.log(`=== UNJYNX k6 Load Test ===`);
  console.log(`  Profile : ${TEST_TYPE}`);
  console.log(`  Base URL: ${BASE_URL}`);
  console.log(`  Health  : ${healthy ? "OK" : "DEGRADED"}`);
  console.log(`===========================`);

  return { baseUrl: BASE_URL, healthy };
}

export function teardown(data) {
  console.log(`=== Test Complete ===`);
  console.log(`  Profile : ${TEST_TYPE}`);
  console.log(`  Base URL: ${data.baseUrl}`);
  console.log(`=====================`);
}
