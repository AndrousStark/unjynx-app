import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../../env.js", () => ({
  env: {
    NODE_ENV: "test",
    PORT: 3000,
    LOG_LEVEL: "silent",
    DATABASE_URL: "postgres://test:test@localhost:5432/test",
    REDIS_URL: "redis://localhost:6379",
    LOGTO_ENDPOINT: "http://localhost:3001",
    S3_ENDPOINT: "http://localhost:9000",
    S3_ACCESS_KEY: "test",
    S3_SECRET_KEY: "test",
    S3_BUCKET: "test",
    S3_REGION: "us-east-1",
  },
}));

function createChainableMock(resolve: () => unknown) {
  const chain: Record<string, unknown> = {};
  const methods = [
    "from",
    "where",
    "orderBy",
    "limit",
    "offset",
    "set",
    "values",
    "returning",
  ];
  for (const m of methods) {
    chain[m] = vi.fn((..._args: unknown[]) => chain);
  }
  chain.then = (onFulfill: (val: unknown) => unknown) =>
    Promise.resolve(resolve()).then(onFulfill);
  return chain;
}

let selectResult: unknown = [];
let selectCountResult: unknown = [{ total: 0 }];
let insertResult: unknown = [];
let updateResult: unknown = [];
let deleteResult: unknown = [];
let selectCallIndex = 0;

vi.mock("../../../db/index.js", () => ({
  db: {
    select: vi.fn((..._args: unknown[]) => {
      const idx = selectCallIndex++;
      return createChainableMock(() =>
        idx % 2 === 0 ? selectResult : selectCountResult,
      );
    }),
    insert: vi.fn(() => createChainableMock(() => insertResult)),
    update: vi.fn(() => createChainableMock(() => updateResult)),
    delete: vi.fn(() => createChainableMock(() => deleteResult)),
  },
}));

import {
  insertProject,
  findProjects,
  findProjectById,
  updateProjectById,
  deleteProjectById,
} from "../projects.repository.js";

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

describe("Projects Repository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    selectCallIndex = 0;
    selectResult = [];
    selectCountResult = [{ total: 0 }];
    insertResult = [];
    updateResult = [];
    deleteResult = [];
  });

  describe("insertProject", () => {
    it("inserts and returns a project", async () => {
      insertResult = [fakeProject];

      const result = await insertProject({
        userId: "user-1",
        name: "My Project",
      });

      expect(result).toEqual(fakeProject);
    });
  });

  describe("findProjects", () => {
    it("returns paginated projects", async () => {
      selectResult = [fakeProject];
      selectCountResult = [{ total: 1 }];

      const result = await findProjects("user-1", 20, 0);

      expect(result.items).toEqual([fakeProject]);
      expect(result.total).toBe(1);
    });

    it("returns empty when no projects", async () => {
      selectResult = [];
      selectCountResult = [{ total: 0 }];

      const result = await findProjects("user-1", 20, 0);

      expect(result.items).toEqual([]);
      expect(result.total).toBe(0);
    });
  });

  describe("findProjectById", () => {
    it("returns project when found", async () => {
      selectResult = [fakeProject];

      const result = await findProjectById("user-1", "proj-1");

      expect(result).toEqual(fakeProject);
    });

    it("returns undefined when not found", async () => {
      selectResult = [];

      const result = await findProjectById("user-1", "non-existent");

      expect(result).toBeUndefined();
    });
  });

  describe("updateProjectById", () => {
    it("updates and returns the project", async () => {
      const updated = { ...fakeProject, name: "Renamed" };
      updateResult = [updated];

      const result = await updateProjectById("user-1", "proj-1", {
        name: "Renamed",
        updatedAt: new Date(),
      });

      expect(result).toEqual(updated);
    });

    it("returns undefined when not found", async () => {
      updateResult = [];

      const result = await updateProjectById("user-1", "non-existent", {
        name: "X",
        updatedAt: new Date(),
      });

      expect(result).toBeUndefined();
    });
  });

  describe("deleteProjectById", () => {
    it("returns true on successful delete", async () => {
      deleteResult = [{ id: "proj-1" }];

      const result = await deleteProjectById("user-1", "proj-1");

      expect(result).toBe(true);
    });

    it("returns false when not found", async () => {
      deleteResult = [];

      const result = await deleteProjectById("user-1", "non-existent");

      expect(result).toBe(false);
    });
  });
});
