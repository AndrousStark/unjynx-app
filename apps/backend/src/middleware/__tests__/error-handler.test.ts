import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { ZodError, ZodIssue } from "zod";
import { errorHandler } from "../error-handler.js";

// Mock logger to suppress output in tests
vi.mock("../logger.js", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
  loggerMiddleware: vi.fn((c: unknown, next: () => Promise<void>) => next()),
}));

describe("Error Handler", () => {
  function createApp(throwError: () => never) {
    const app = new Hono();
    app.onError(errorHandler);
    app.get("/test", () => {
      throwError();
    });
    return app;
  }

  it("handles HTTPException with correct status", async () => {
    const app = createApp(() => {
      throw new HTTPException(403, { message: "Forbidden" });
    });

    const res = await app.request("/test");
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.success).toBe(false);
    expect(body.error).toBe("Forbidden");
    expect(body.data).toBeNull();
  });

  it("handles ZodError with formatted messages", async () => {
    const issues: ZodIssue[] = [
      {
        code: "too_small",
        minimum: 1,
        type: "string",
        inclusive: true,
        exact: false,
        message: "Required",
        path: ["title"],
      },
    ];
    const app = createApp(() => {
      throw new ZodError(issues);
    });

    const res = await app.request("/test");
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error).toContain("Validation failed");
    expect(body.error).toContain("title");
  });

  it("handles generic errors in development mode", async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";

    const app = createApp(() => {
      throw new Error("Something broke");
    });

    const res = await app.request("/test");
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.success).toBe(false);
    expect(body.error).toContain("Something broke");

    process.env.NODE_ENV = originalEnv;
  });

  it("hides error details in production mode", async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";

    const app = createApp(() => {
      throw new Error("Secret internal info");
    });

    const res = await app.request("/test");
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe("Internal server error");
    expect(body.error).not.toContain("Secret");

    process.env.NODE_ENV = originalEnv;
  });
});
