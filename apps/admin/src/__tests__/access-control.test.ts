import { describe, it, expect, beforeEach } from "vitest";
import { accessControlProvider } from "../providers/access-control";

describe("accessControlProvider", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("should allow SUPER_ADMIN access to everything", async () => {
    localStorage.setItem(
      "unjynx_admin_user",
      JSON.stringify({ role: "SUPER_ADMIN" }),
    );

    const result = await accessControlProvider.can({
      resource: "billing",
      action: "delete",
    });
    expect(result.can).toBe(true);
  });

  it("should allow CONTENT_MANAGER to list content", async () => {
    localStorage.setItem(
      "unjynx_admin_user",
      JSON.stringify({ role: "CONTENT_MANAGER" }),
    );

    const result = await accessControlProvider.can({
      resource: "content",
      action: "list",
    });
    expect(result.can).toBe(true);
  });

  it("should allow CONTENT_MANAGER to create content", async () => {
    localStorage.setItem(
      "unjynx_admin_user",
      JSON.stringify({ role: "CONTENT_MANAGER" }),
    );

    const result = await accessControlProvider.can({
      resource: "content",
      action: "create",
    });
    expect(result.can).toBe(true);
  });

  it("should deny CONTENT_MANAGER access to billing", async () => {
    localStorage.setItem(
      "unjynx_admin_user",
      JSON.stringify({ role: "CONTENT_MANAGER" }),
    );

    const result = await accessControlProvider.can({
      resource: "billing",
      action: "list",
    });
    expect(result.can).toBe(false);
    expect(result.reason).toBe("Insufficient permissions");
  });

  it("should deny CONTENT_MANAGER access to users", async () => {
    localStorage.setItem(
      "unjynx_admin_user",
      JSON.stringify({ role: "CONTENT_MANAGER" }),
    );

    const result = await accessControlProvider.can({
      resource: "users",
      action: "list",
    });
    expect(result.can).toBe(false);
  });

  it("should allow SUPPORT_AGENT to list users", async () => {
    localStorage.setItem(
      "unjynx_admin_user",
      JSON.stringify({ role: "SUPPORT_AGENT" }),
    );

    const result = await accessControlProvider.can({
      resource: "users",
      action: "list",
    });
    expect(result.can).toBe(true);
  });

  it("should deny SUPPORT_AGENT to edit users", async () => {
    localStorage.setItem(
      "unjynx_admin_user",
      JSON.stringify({ role: "SUPPORT_AGENT" }),
    );

    const result = await accessControlProvider.can({
      resource: "users",
      action: "edit",
    });
    expect(result.can).toBe(false);
  });

  it("should allow SUPPORT_AGENT to access support", async () => {
    localStorage.setItem(
      "unjynx_admin_user",
      JSON.stringify({ role: "SUPPORT_AGENT" }),
    );

    const result = await accessControlProvider.can({
      resource: "support",
      action: "list",
    });
    expect(result.can).toBe(true);
  });

  it("should allow VIEWER to see dashboard", async () => {
    localStorage.setItem(
      "unjynx_admin_user",
      JSON.stringify({ role: "VIEWER" }),
    );

    const result = await accessControlProvider.can({
      resource: "dashboard",
      action: "list",
    });
    expect(result.can).toBe(true);
  });

  it("should allow VIEWER to see analytics", async () => {
    localStorage.setItem(
      "unjynx_admin_user",
      JSON.stringify({ role: "VIEWER" }),
    );

    const result = await accessControlProvider.can({
      resource: "analytics",
      action: "list",
    });
    expect(result.can).toBe(true);
  });

  it("should deny VIEWER from creating feature flags", async () => {
    localStorage.setItem(
      "unjynx_admin_user",
      JSON.stringify({ role: "VIEWER" }),
    );

    const result = await accessControlProvider.can({
      resource: "feature-flags",
      action: "create",
    });
    expect(result.can).toBe(false);
  });

  it("should deny VIEWER from billing", async () => {
    localStorage.setItem(
      "unjynx_admin_user",
      JSON.stringify({ role: "VIEWER" }),
    );

    const result = await accessControlProvider.can({
      resource: "billing",
      action: "list",
    });
    expect(result.can).toBe(false);
  });

  it("should deny VIEWER from compliance", async () => {
    localStorage.setItem(
      "unjynx_admin_user",
      JSON.stringify({ role: "VIEWER" }),
    );

    const result = await accessControlProvider.can({
      resource: "compliance",
      action: "list",
    });
    expect(result.can).toBe(false);
  });

  it("should default to VIEWER when no user stored", async () => {
    const result = await accessControlProvider.can({
      resource: "billing",
      action: "list",
    });
    expect(result.can).toBe(false);
  });

  it("should default to VIEWER for invalid JSON", async () => {
    localStorage.setItem("unjynx_admin_user", "not-json");

    const result = await accessControlProvider.can({
      resource: "billing",
      action: "list",
    });
    expect(result.can).toBe(false);
  });

  it("should deny access for undefined resource:action combo", async () => {
    localStorage.setItem(
      "unjynx_admin_user",
      JSON.stringify({ role: "VIEWER" }),
    );

    const result = await accessControlProvider.can({
      resource: "nonexistent",
      action: "list",
    });
    expect(result.can).toBe(false);
  });
});
