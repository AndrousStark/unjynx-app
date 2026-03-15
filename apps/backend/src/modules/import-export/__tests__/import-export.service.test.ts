import { describe, it, expect, vi, beforeEach } from "vitest";

const mockFindAllUserTasks = vi.fn();
const mockFindUserTasksByTitleAndDate = vi.fn();
const mockBulkInsertTasks = vi.fn();
const mockSoftDeleteUser = vi.fn();
const mockFindUserProfile = vi.fn();

vi.mock("../import-export.repository.js", () => ({
  findAllUserTasks: (...args: unknown[]) => mockFindAllUserTasks(...args),
  findUserTasksByTitleAndDate: (...args: unknown[]) => mockFindUserTasksByTitleAndDate(...args),
  bulkInsertTasks: (...args: unknown[]) => mockBulkInsertTasks(...args),
  softDeleteUser: (...args: unknown[]) => mockSoftDeleteUser(...args),
  findUserProfile: (...args: unknown[]) => mockFindUserProfile(...args),
}));

import {
  previewImport,
  executeImport,
  exportCsv,
  exportJson,
  createDataRequest,
  scheduleAccountDeletion,
} from "../import-export.service.js";

const fakeTasks = [
  {
    id: "task-1",
    userId: "user-1",
    title: "Buy milk",
    description: null,
    status: "pending",
    priority: "none",
    dueDate: new Date("2026-04-01"),
    completedAt: null,
    rrule: null,
    createdAt: new Date("2026-03-01"),
    updatedAt: new Date("2026-03-01"),
    projectId: null,
    sortOrder: 0,
  },
];

describe("Import/Export Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("previewImport", () => {
    it("returns preview of parsed tasks", () => {
      const result = previewImport({
        csvContent: `title,priority\nBuy milk,low\nRead book,high`,
        format: "generic",
        delimiter: ",",
      });

      expect(result.headers).toEqual(["title", "priority"]);
      expect(result.sampleTasks).toHaveLength(2);
      expect(result.totalRows).toBe(2);
    });

    it("limits sample to 10 tasks", () => {
      const rows = Array.from({ length: 20 }, (_, i) => `Task ${i},low`).join("\n");
      const csv = `title,priority\n${rows}`;

      const result = previewImport({
        csvContent: csv,
        format: "generic",
        delimiter: ",",
      });

      expect(result.sampleTasks).toHaveLength(10);
      expect(result.totalRows).toBe(20);
    });
  });

  describe("executeImport", () => {
    it("imports tasks from CSV", async () => {
      mockFindUserTasksByTitleAndDate.mockResolvedValueOnce([]);
      mockBulkInsertTasks.mockResolvedValueOnce([
        { id: "t-1", title: "Buy milk" },
        { id: "t-2", title: "Read book" },
      ]);

      const result = await executeImport("user-1", {
        csvContent: `title,priority\nBuy milk,low\nRead book,high`,
        format: "generic",
        delimiter: ",",
        skipDuplicates: true,
      });

      expect(result.imported).toBe(2);
      expect(result.skippedDuplicates).toBe(0);
    });

    it("skips duplicates", async () => {
      mockFindUserTasksByTitleAndDate.mockResolvedValueOnce([
        { title: "Buy milk", dueDate: null },
      ]);
      mockBulkInsertTasks.mockResolvedValueOnce([
        { id: "t-1", title: "Read book" },
      ]);

      const result = await executeImport("user-1", {
        csvContent: `title,priority\nBuy milk,low\nRead book,high`,
        format: "generic",
        delimiter: ",",
        skipDuplicates: true,
      });

      expect(result.imported).toBe(1);
      expect(result.skippedDuplicates).toBe(1);
    });

    it("does not skip duplicates when disabled", async () => {
      mockBulkInsertTasks.mockResolvedValueOnce([
        { id: "t-1" },
        { id: "t-2" },
      ]);

      const result = await executeImport("user-1", {
        csvContent: `title,priority\nBuy milk,low\nRead book,high`,
        format: "generic",
        delimiter: ",",
        skipDuplicates: false,
      });

      expect(result.imported).toBe(2);
      expect(result.skippedDuplicates).toBe(0);
    });
  });

  describe("exportCsv", () => {
    it("exports tasks as CSV string", async () => {
      mockFindAllUserTasks.mockResolvedValueOnce(fakeTasks);

      const csv = await exportCsv("user-1", {});

      expect(csv).toContain("title,description,status,priority,dueDate,createdAt");
      expect(csv).toContain("Buy milk");
    });

    it("escapes fields with commas", async () => {
      mockFindAllUserTasks.mockResolvedValueOnce([
        {
          ...fakeTasks[0],
          title: "Buy milk, bread",
        },
      ]);

      const csv = await exportCsv("user-1", {});
      expect(csv).toContain('"Buy milk, bread"');
    });
  });

  describe("exportJson", () => {
    it("exports user data as JSON", async () => {
      mockFindUserProfile.mockResolvedValueOnce({ id: "user-1", name: "Test" });
      mockFindAllUserTasks.mockResolvedValueOnce(fakeTasks);

      const result = await exportJson("user-1");

      expect(result.profile).toEqual({ id: "user-1", name: "Test" });
      expect(result.tasks).toHaveLength(1);
      expect(result.exportedAt).toBeTruthy();
    });
  });

  describe("createDataRequest", () => {
    it("creates a GDPR data request", () => {
      const result = createDataRequest("user-1");

      expect(result.requestId).toContain("gdpr-user-1-");
      expect(result.status).toBe("processing");
      expect(result.estimatedCompletionMinutes).toBe(30);
    });
  });

  describe("scheduleAccountDeletion", () => {
    it("schedules account deletion with 30-day grace period", async () => {
      mockSoftDeleteUser.mockResolvedValueOnce(true);

      const result = await scheduleAccountDeletion("user-1");

      expect(result.scheduled).toBe(true);
      expect(result.gracePeriodDays).toBe(30);
      expect(result.scheduledDeletionDate).toBeTruthy();
      expect(mockSoftDeleteUser).toHaveBeenCalledWith("user-1");
    });
  });
});
