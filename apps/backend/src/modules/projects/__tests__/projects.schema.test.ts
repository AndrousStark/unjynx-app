import { describe, it, expect } from "vitest";
import {
  createProjectSchema,
  updateProjectSchema,
  projectQuerySchema,
} from "../projects.schema.js";

describe("Project Schemas", () => {
  describe("createProjectSchema", () => {
    it("validates a minimal project", () => {
      const result = createProjectSchema.safeParse({ name: "Work" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe("Work");
        expect(result.data.color).toBe("#6C5CE7");
        expect(result.data.icon).toBe("folder");
      }
    });

    it("validates a full project", () => {
      const result = createProjectSchema.safeParse({
        name: "Personal",
        description: "Personal tasks",
        color: "#FF6B6B",
        icon: "star",
      });
      expect(result.success).toBe(true);
    });

    it("rejects empty name", () => {
      const result = createProjectSchema.safeParse({ name: "" });
      expect(result.success).toBe(false);
    });

    it("rejects name exceeding 200 chars", () => {
      const result = createProjectSchema.safeParse({ name: "x".repeat(201) });
      expect(result.success).toBe(false);
    });

    it("rejects invalid color format", () => {
      const invalids = ["red", "#fff", "#GGGGGG", "6C5CE7", "#6C5CE7FF"];
      for (const color of invalids) {
        const result = createProjectSchema.safeParse({ name: "Test", color });
        expect(result.success).toBe(false);
      }
    });

    it("accepts valid hex colors", () => {
      const valids = ["#000000", "#FFFFFF", "#6C5CE7", "#ff6b6b"];
      for (const color of valids) {
        const result = createProjectSchema.safeParse({ name: "Test", color });
        expect(result.success).toBe(true);
      }
    });
  });

  describe("updateProjectSchema", () => {
    it("validates partial updates", () => {
      const result = updateProjectSchema.safeParse({ name: "New Name" });
      expect(result.success).toBe(true);
    });

    it("allows nullable description", () => {
      const result = updateProjectSchema.safeParse({ description: null });
      expect(result.success).toBe(true);
    });

    it("validates isArchived as boolean", () => {
      expect(updateProjectSchema.safeParse({ isArchived: true }).success).toBe(true);
      expect(updateProjectSchema.safeParse({ isArchived: "yes" }).success).toBe(false);
    });

    it("validates sortOrder as integer", () => {
      expect(updateProjectSchema.safeParse({ sortOrder: 3 }).success).toBe(true);
      expect(updateProjectSchema.safeParse({ sortOrder: 1.5 }).success).toBe(false);
    });
  });

  describe("projectQuerySchema", () => {
    it("provides defaults", () => {
      const result = projectQuerySchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(20);
      }
    });

    it("rejects invalid pagination", () => {
      expect(projectQuerySchema.safeParse({ page: -1 }).success).toBe(false);
      expect(projectQuerySchema.safeParse({ limit: 200 }).success).toBe(false);
    });
  });
});
