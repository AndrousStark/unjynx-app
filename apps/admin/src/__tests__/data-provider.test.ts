import { describe, it, expect, beforeEach, vi } from "vitest";
import { dataProvider } from "../providers/data-provider";

describe("dataProvider", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe("getApiUrl", () => {
    it("should return the admin API URL", () => {
      const url = dataProvider.getApiUrl();
      expect(url).toContain("/api/v1/admin");
    });
  });

  describe("getList", () => {
    it("should call API with pagination params", async () => {
      const mockResponse = {
        success: true,
        data: [{ id: "1", name: "Test User" }],
        meta: { total: 1, page: 1, limit: 20 },
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await dataProvider.getList({
        resource: "users",
        pagination: { current: 1, pageSize: 20 },
      });

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);

      const calledUrl = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
      expect(calledUrl).toContain("page=1");
      expect(calledUrl).toContain("limit=20");
    });

    it("should include filters in query params", async () => {
      const mockResponse = {
        success: true,
        data: [],
        meta: { total: 0, page: 1, limit: 20 },
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      await dataProvider.getList({
        resource: "users",
        filters: [
          { field: "search", operator: "eq", value: "test" },
        ],
      });

      const calledUrl = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
      expect(calledUrl).toContain("search=test");
    });

    it("should include auth header when token exists", async () => {
      localStorage.setItem("unjynx_admin_token", "jwt-token");

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, data: [], meta: { total: 0 } }),
      });

      await dataProvider.getList({ resource: "users" });

      const headers = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1]?.headers;
      expect(headers.Authorization).toBe("Bearer jwt-token");
    });

    it("should throw on non-ok response", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        json: () => Promise.resolve({ error: "Forbidden" }),
      });

      await expect(
        dataProvider.getList({ resource: "users" }),
      ).rejects.toThrow("Forbidden");
    });
  });

  describe("getOne", () => {
    it("should call API with resource and id", async () => {
      const mockResponse = {
        success: true,
        data: { id: "user-1", name: "Test" },
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await dataProvider.getOne({
        resource: "users",
        id: "user-1",
      });

      const calledUrl = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
      expect(calledUrl).toContain("users/user-1");
      expect(result.data).toEqual({ id: "user-1", name: "Test" });
    });
  });

  describe("create", () => {
    it("should POST to the correct endpoint", async () => {
      const mockResponse = {
        success: true,
        data: { id: "new-1", content: "test" },
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      await dataProvider.create({
        resource: "content",
        variables: { category: "stoic_wisdom", content: "Test content" },
      });

      const fetchCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(fetchCall[1].method).toBe("POST");
      expect(JSON.parse(fetchCall[1].body)).toEqual({
        category: "stoic_wisdom",
        content: "Test content",
      });
    });
  });

  describe("update", () => {
    it("should PATCH to the correct endpoint", async () => {
      const mockResponse = {
        success: true,
        data: { id: "user-1", name: "Updated" },
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      await dataProvider.update({
        resource: "users",
        id: "user-1",
        variables: { name: "Updated Name" },
      });

      const fetchCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(fetchCall[1].method).toBe("PATCH");
      expect(fetchCall[0]).toContain("users/user-1");
    });
  });

  describe("deleteOne", () => {
    it("should DELETE to the correct endpoint", async () => {
      const mockResponse = {
        success: true,
        data: { deleted: true },
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      await dataProvider.deleteOne({
        resource: "content",
        id: "content-1",
      });

      const fetchCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(fetchCall[1].method).toBe("DELETE");
      expect(fetchCall[0]).toContain("content/content-1");
    });
  });
});
