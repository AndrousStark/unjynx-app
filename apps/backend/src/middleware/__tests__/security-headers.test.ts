import { describe, it, expect } from "vitest";
import { Hono } from "hono";

import { securityHeadersMiddleware } from "../security-headers.js";

describe("Security Headers Middleware", () => {
  function createApp() {
    const app = new Hono();
    app.use("*", securityHeadersMiddleware);
    app.get("/test", (c) => c.json({ ok: true }));
    return app;
  }

  it("sets Content-Security-Policy header", async () => {
    const app = createApp();
    const res = await app.request("/test");

    expect(res.headers.get("Content-Security-Policy")).toBe(
      "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'",
    );
  });

  it("sets Strict-Transport-Security with preload", async () => {
    const app = createApp();
    const res = await app.request("/test");

    expect(res.headers.get("Strict-Transport-Security")).toBe(
      "max-age=63072000; includeSubDomains; preload",
    );
  });

  it("sets X-Content-Type-Options to nosniff", async () => {
    const app = createApp();
    const res = await app.request("/test");

    expect(res.headers.get("X-Content-Type-Options")).toBe("nosniff");
  });

  it("sets X-Frame-Options to DENY", async () => {
    const app = createApp();
    const res = await app.request("/test");

    expect(res.headers.get("X-Frame-Options")).toBe("DENY");
  });

  it("disables legacy XSS filter (CSP supersedes it)", async () => {
    const app = createApp();
    const res = await app.request("/test");

    expect(res.headers.get("X-XSS-Protection")).toBe("0");
  });

  it("sets Referrer-Policy", async () => {
    const app = createApp();
    const res = await app.request("/test");

    expect(res.headers.get("Referrer-Policy")).toBe(
      "strict-origin-when-cross-origin",
    );
  });

  it("sets Permissions-Policy", async () => {
    const app = createApp();
    const res = await app.request("/test");

    expect(res.headers.get("Permissions-Policy")).toBe(
      "camera=(), microphone=(), geolocation=(self), payment=()",
    );
  });

  it("sets Cache-Control to no-store", async () => {
    const app = createApp();
    const res = await app.request("/test");

    expect(res.headers.get("Cache-Control")).toBe("no-store");
  });

  it("sets Pragma to no-cache", async () => {
    const app = createApp();
    const res = await app.request("/test");

    expect(res.headers.get("Pragma")).toBe("no-cache");
  });

  it("generates X-Request-ID when not provided", async () => {
    const app = createApp();
    const res = await app.request("/test");

    const requestId = res.headers.get("X-Request-ID");
    expect(requestId).toBeTruthy();
    // UUID v4 format: 8-4-4-4-12 hex chars
    expect(requestId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
  });

  it("echoes client-provided X-Request-ID", async () => {
    const app = createApp();
    const clientId = "client-trace-abc-123";
    const res = await app.request("/test", {
      headers: { "X-Request-ID": clientId },
    });

    expect(res.headers.get("X-Request-ID")).toBe(clientId);
  });

  it("still returns 200 with JSON body", async () => {
    const app = createApp();
    const res = await app.request("/test");

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ ok: true });
  });

  it("applies headers to non-200 responses", async () => {
    const app = new Hono();
    app.use("*", securityHeadersMiddleware);
    app.get("/error", (c) => c.json({ error: "not found" }, 404));

    const res = await app.request("/error");

    expect(res.status).toBe(404);
    expect(res.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(res.headers.get("X-Frame-Options")).toBe("DENY");
    expect(res.headers.get("X-Request-ID")).toBeTruthy();
  });
});
