import { describe, it, expect } from "vitest";
import { ok, err, paginated } from "../api.js";

describe("API Response Helpers", () => {
  describe("ok", () => {
    it("creates a success response", () => {
      const result = ok({ id: "1", name: "Test" });

      expect(result.success).toBe(true);
      expect(result.data).toEqual({ id: "1", name: "Test" });
      expect(result.error).toBeNull();
    });

    it("includes metadata when provided", () => {
      const meta = { total: 100, page: 1, limit: 20, totalPages: 5 };
      const result = ok([1, 2, 3], meta);

      expect(result.success).toBe(true);
      expect(result.meta).toEqual(meta);
    });

    it("handles null data", () => {
      const result = ok(null);

      expect(result.success).toBe(true);
      expect(result.data).toBeNull();
    });
  });

  describe("err", () => {
    it("creates an error response", () => {
      const result = err("Something went wrong");

      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
      expect(result.error).toBe("Something went wrong");
    });
  });

  describe("paginated", () => {
    it("creates a paginated response", () => {
      const items = [{ id: 1 }, { id: 2 }];
      const result = paginated(items, 50, 1, 20);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(items);
      expect(result.meta).toEqual({
        total: 50,
        page: 1,
        limit: 20,
        totalPages: 3,
      });
    });

    it("calculates totalPages correctly", () => {
      const result = paginated([], 0, 1, 20);
      expect(result.meta!.totalPages).toBe(0);

      const result2 = paginated([], 21, 1, 20);
      expect(result2.meta!.totalPages).toBe(2);

      const result3 = paginated([], 20, 1, 20);
      expect(result3.meta!.totalPages).toBe(1);
    });
  });
});
