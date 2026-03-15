import { describe, it, expect, vi, beforeEach } from "vitest";

const mockInsertProject = vi.fn();
const mockFindProjects = vi.fn();
const mockFindProjectById = vi.fn();
const mockUpdateProjectById = vi.fn();
const mockDeleteProjectById = vi.fn();

vi.mock("../projects.repository.js", () => ({
  insertProject: (...args: unknown[]) => mockInsertProject(...args),
  findProjects: (...args: unknown[]) => mockFindProjects(...args),
  findProjectById: (...args: unknown[]) => mockFindProjectById(...args),
  updateProjectById: (...args: unknown[]) => mockUpdateProjectById(...args),
  deleteProjectById: (...args: unknown[]) => mockDeleteProjectById(...args),
}));

import {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
} from "../projects.service.js";

const fakeProject = {
  id: "proj-1",
  userId: "user-1",
  name: "My Project",
  description: null,
  color: "#6C5CE7",
  icon: "folder",
  isArchived: false,
  sortOrder: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("Projects Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createProject", () => {
    it("creates a project via repository", async () => {
      mockInsertProject.mockResolvedValueOnce(fakeProject);

      const result = await createProject("user-1", {
        name: "My Project",
        color: "#6C5CE7",
        icon: "folder",
      });

      expect(result).toEqual(fakeProject);
      expect(mockInsertProject).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: "user-1",
          name: "My Project",
        }),
      );
    });
  });

  describe("getProjects", () => {
    it("returns paginated projects from repository", async () => {
      mockFindProjects.mockResolvedValueOnce({
        items: [fakeProject],
        total: 1,
      });

      const result = await getProjects("user-1", { page: 1, limit: 20 });

      expect(result.items).toEqual([fakeProject]);
      expect(result.total).toBe(1);
      expect(mockFindProjects).toHaveBeenCalledWith("user-1", 20, 0);
    });

    it("calculates offset from page and limit", async () => {
      mockFindProjects.mockResolvedValueOnce({ items: [], total: 0 });

      await getProjects("user-1", { page: 3, limit: 10 });

      expect(mockFindProjects).toHaveBeenCalledWith("user-1", 10, 20);
    });
  });

  describe("getProjectById", () => {
    it("returns project from repository", async () => {
      mockFindProjectById.mockResolvedValueOnce(fakeProject);

      const result = await getProjectById("user-1", "proj-1");

      expect(result).toEqual(fakeProject);
    });

    it("returns undefined when not found", async () => {
      mockFindProjectById.mockResolvedValueOnce(undefined);

      const result = await getProjectById("user-1", "non-existent");

      expect(result).toBeUndefined();
    });
  });

  describe("updateProject", () => {
    it("updates via repository with updatedAt", async () => {
      const updated = { ...fakeProject, name: "Renamed" };
      mockUpdateProjectById.mockResolvedValueOnce(updated);

      const result = await updateProject("user-1", "proj-1", {
        name: "Renamed",
      });

      expect(result).toEqual(updated);
      expect(mockUpdateProjectById).toHaveBeenCalledWith(
        "user-1",
        "proj-1",
        expect.objectContaining({
          name: "Renamed",
          updatedAt: expect.any(Date),
        }),
      );
    });

    it("returns undefined when not found", async () => {
      mockUpdateProjectById.mockResolvedValueOnce(undefined);

      const result = await updateProject("user-1", "non-existent", {
        name: "X",
      });

      expect(result).toBeUndefined();
    });
  });

  describe("deleteProject", () => {
    it("returns true on successful delete", async () => {
      mockDeleteProjectById.mockResolvedValueOnce(true);

      const result = await deleteProject("user-1", "proj-1");

      expect(result).toBe(true);
    });

    it("returns false when not found", async () => {
      mockDeleteProjectById.mockResolvedValueOnce(false);

      const result = await deleteProject("user-1", "non-existent");

      expect(result).toBe(false);
    });
  });
});
