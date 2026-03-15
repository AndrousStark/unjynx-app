import { describe, it, expect, beforeEach } from "vitest";
import { Hono } from "hono";
import { idempotencyMiddleware, clearIdempotencyCache, getIdempotencyCacheSize } from "../idempotency.js";

function createTestApp(): Hono {
  const app = new Hono();
  app.use("*", idempotencyMiddleware);

  let callCount = 0;

  // POST endpoint that increments a counter
  app.post("/items", async (c) => {
    callCount++;
    return c.json({
      success: true,
      data: { id: `item-${callCount}`, count: callCount },
      error: null,
    }, 201);
  });

  // PATCH endpoint
  app.patch("/items/:id", async (c) => {
    callCount++;
    return c.json({
      success: true,
      data: { id: c.req.param("id"), updated: true, count: callCount },
      error: null,
    });
  });

  // GET endpoint (should not be affected by idempotency)
  app.get("/items", async (c) => {
    callCount++;
    return c.json({
      success: true,
      data: { count: callCount },
      error: null,
    });
  });

  // POST endpoint that returns 422 (client error)
  app.post("/bad", async (c) => {
    callCount++;
    return c.json({
      success: false,
      data: null,
      error: "Validation failed",
    }, 422);
  });

  return app;
}

describe("Idempotency Middleware", () => {
  beforeEach(() => {
    clearIdempotencyCache();
  });

  it("processes POST request normally without Idempotency-Key", async () => {
    const app = createTestApp();

    const res1 = await app.request("/items", { method: "POST" });
    const res2 = await app.request("/items", { method: "POST" });

    expect(res1.status).toBe(201);
    expect(res2.status).toBe(201);

    const body1 = await res1.json();
    const body2 = await res2.json();

    // Without idempotency key, both requests are processed
    expect(body1.data.count).toBe(1);
    expect(body2.data.count).toBe(2);
  });

  it("returns cached response for duplicate Idempotency-Key", async () => {
    const app = createTestApp();
    const key = "unique-key-001";

    const res1 = await app.request("/items", {
      method: "POST",
      headers: { "Idempotency-Key": key },
    });
    const res2 = await app.request("/items", {
      method: "POST",
      headers: { "Idempotency-Key": key },
    });

    expect(res1.status).toBe(201);
    expect(res2.status).toBe(201);

    const body1 = await res1.json();
    const body2 = await res2.json();

    // Both should return the SAME response (same count)
    expect(body1.data.count).toBe(body2.data.count);
    expect(body1.data.id).toBe(body2.data.id);
  });

  it("sets Idempotency-Replayed header on cached response", async () => {
    const app = createTestApp();
    const key = "replay-test-key";

    await app.request("/items", {
      method: "POST",
      headers: { "Idempotency-Key": key },
    });

    const res2 = await app.request("/items", {
      method: "POST",
      headers: { "Idempotency-Key": key },
    });

    expect(res2.headers.get("Idempotency-Replayed")).toBe("true");
  });

  it("does NOT set Idempotency-Replayed on first request", async () => {
    const app = createTestApp();

    const res = await app.request("/items", {
      method: "POST",
      headers: { "Idempotency-Key": "first-time-key" },
    });

    expect(res.headers.get("Idempotency-Replayed")).toBeNull();
  });

  it("different keys produce different responses", async () => {
    const app = createTestApp();

    const res1 = await app.request("/items", {
      method: "POST",
      headers: { "Idempotency-Key": "key-A" },
    });
    const res2 = await app.request("/items", {
      method: "POST",
      headers: { "Idempotency-Key": "key-B" },
    });

    const body1 = await res1.json();
    const body2 = await res2.json();

    expect(body1.data.count).not.toBe(body2.data.count);
  });

  it("does not apply idempotency to GET requests", async () => {
    const app = createTestApp();
    const key = "get-key";

    const res1 = await app.request("/items", {
      method: "GET",
      headers: { "Idempotency-Key": key },
    });
    const res2 = await app.request("/items", {
      method: "GET",
      headers: { "Idempotency-Key": key },
    });

    const body1 = await res1.json();
    const body2 = await res2.json();

    // GET requests should always be processed (not cached)
    expect(body1.data.count).not.toBe(body2.data.count);
  });

  it("applies idempotency to PATCH requests", async () => {
    const app = createTestApp();
    const key = "patch-key";

    const res1 = await app.request("/items/123", {
      method: "PATCH",
      headers: { "Idempotency-Key": key },
    });
    const res2 = await app.request("/items/123", {
      method: "PATCH",
      headers: { "Idempotency-Key": key },
    });

    const body1 = await res1.json();
    const body2 = await res2.json();

    expect(body1.data.count).toBe(body2.data.count);
  });

  it("namespaces keys by method and path", async () => {
    const app = createTestApp();
    const key = "shared-key";

    // Same key on different paths should not collide
    const res1 = await app.request("/items", {
      method: "POST",
      headers: { "Idempotency-Key": key },
    });
    const res2 = await app.request("/items/456", {
      method: "PATCH",
      headers: { "Idempotency-Key": key },
    });

    const body1 = await res1.json();
    const body2 = await res2.json();

    // Different paths = different cache entries
    expect(body1.data.count).not.toBe(body2.data.count);
  });

  it("rejects Idempotency-Key longer than 256 characters", async () => {
    const app = createTestApp();
    const longKey = "k".repeat(257);

    const res = await app.request("/items", {
      method: "POST",
      headers: { "Idempotency-Key": longKey },
    });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("too long");
  });

  it("caches 4xx error responses too", async () => {
    const app = createTestApp();
    const key = "error-key";

    const res1 = await app.request("/bad", {
      method: "POST",
      headers: { "Idempotency-Key": key },
    });
    const res2 = await app.request("/bad", {
      method: "POST",
      headers: { "Idempotency-Key": key },
    });

    expect(res1.status).toBe(422);
    expect(res2.status).toBe(422);

    const body1 = await res1.json();
    const body2 = await res2.json();

    expect(body1).toEqual(body2);
  });

  it("tracks cache size correctly", async () => {
    const app = createTestApp();

    expect(getIdempotencyCacheSize()).toBe(0);

    await app.request("/items", {
      method: "POST",
      headers: { "Idempotency-Key": "size-test-1" },
    });
    expect(getIdempotencyCacheSize()).toBe(1);

    await app.request("/items", {
      method: "POST",
      headers: { "Idempotency-Key": "size-test-2" },
    });
    expect(getIdempotencyCacheSize()).toBe(2);

    // Replayed request should not increase size
    await app.request("/items", {
      method: "POST",
      headers: { "Idempotency-Key": "size-test-1" },
    });
    expect(getIdempotencyCacheSize()).toBe(2);
  });

  it("clearIdempotencyCache resets the store", async () => {
    const app = createTestApp();

    await app.request("/items", {
      method: "POST",
      headers: { "Idempotency-Key": "clear-test" },
    });
    expect(getIdempotencyCacheSize()).toBe(1);

    clearIdempotencyCache();
    expect(getIdempotencyCacheSize()).toBe(0);
  });
});
