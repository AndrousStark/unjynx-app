import type { Task, NewTask } from "../../db/schema/index.js";
import type {
  ImportPreviewInput,
  ImportExecuteInput,
  ExportQuery,
} from "./import-export.schema.js";
import { parseCsv, findDuplicates, type ParsedTask, type CsvParseResult } from "./csv-parser.js";
import { generateIcs, type IcsTask } from "./ics-generator.js";
import * as importExportRepo from "./import-export.repository.js";

// ── Import Preview ────────────────────────────────────────────────────

export interface ImportPreviewResult {
  readonly headers: readonly string[];
  readonly sampleTasks: readonly ParsedTask[];
  readonly totalRows: number;
}

export function previewImport(input: ImportPreviewInput): ImportPreviewResult {
  const result = parseCsv(input.csvContent, input.format, input.delimiter);

  return {
    headers: result.headers,
    sampleTasks: result.tasks.slice(0, 10),
    totalRows: result.totalRows,
  };
}

// ── Import Execute ────────────────────────────────────────────────────

export interface ImportResult {
  readonly imported: number;
  readonly skippedDuplicates: number;
  readonly totalRows: number;
}

export async function executeImport(
  userId: string,
  input: ImportExecuteInput,
): Promise<ImportResult> {
  const result = parseCsv(
    input.csvContent,
    input.format,
    input.delimiter,
    input.columnMapping as Record<string, string> | undefined,
  );

  let tasksToImport = [...result.tasks];
  let skippedDuplicates = 0;

  // Duplicate detection
  if (input.skipDuplicates) {
    const existingTasks = await importExportRepo.findUserTasksByTitleAndDate(userId);
    const duplicateIndices = findDuplicates(result.tasks, existingTasks);
    skippedDuplicates = duplicateIndices.size;
    tasksToImport = result.tasks.filter((_, idx) => !duplicateIndices.has(idx));
  }

  // Convert parsed tasks to NewTask objects
  const newTasks: NewTask[] = tasksToImport.map((task) => ({
    userId,
    title: task.title,
    description: task.description,
    priority: task.priority,
    dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
  }));

  const created = await importExportRepo.bulkInsertTasks(newTasks);

  return {
    imported: created.length,
    skippedDuplicates,
    totalRows: result.totalRows,
  };
}

// ── Export CSV ─────────────────────────────────────────────────────────

export async function exportCsv(
  userId: string,
  query: ExportQuery,
): Promise<string> {
  const tasks = await importExportRepo.findAllUserTasks(userId, {
    status: query.status,
    projectId: query.projectId,
  });

  const headers = [
    "title",
    "description",
    "status",
    "priority",
    "dueDate",
    "createdAt",
  ];

  const rows = tasks.map((task) =>
    [
      escapeCsvField(task.title),
      escapeCsvField(task.description ?? ""),
      task.status,
      task.priority,
      task.dueDate?.toISOString() ?? "",
      task.createdAt.toISOString(),
    ].join(","),
  );

  return [headers.join(","), ...rows].join("\n");
}

function escapeCsvField(field: string): string {
  if (field.includes(",") || field.includes('"') || field.includes("\n")) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}

// ── Export JSON (GDPR) ────────────────────────────────────────────────

export interface GdprExportData {
  readonly profile: Record<string, unknown>;
  readonly tasks: readonly Task[];
  readonly exportedAt: string;
}

export async function exportJson(userId: string): Promise<GdprExportData> {
  const [profile, allTasks] = await Promise.all([
    importExportRepo.findUserProfile(userId),
    importExportRepo.findAllUserTasks(userId),
  ]);

  return {
    profile: profile ?? {},
    tasks: allTasks,
    exportedAt: new Date().toISOString(),
  };
}

// ── Export ICS ─────────────────────────────────────────────────────────

export async function exportIcs(
  userId: string,
  query: ExportQuery,
): Promise<string> {
  const tasks = await importExportRepo.findAllUserTasks(userId, {
    status: query.status,
    projectId: query.projectId,
  });

  const icsTasks: IcsTask[] = tasks.map((task) => ({
    id: task.id,
    title: task.title,
    description: task.description,
    dueDate: task.dueDate,
    completedAt: task.completedAt,
    status: task.status,
    priority: task.priority,
    rrule: task.rrule,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
  }));

  return generateIcs(icsTasks);
}

// ── GDPR Data Request ─────────────────────────────────────────────────

export interface DataRequestResult {
  readonly requestId: string;
  readonly status: "processing";
  readonly estimatedCompletionMinutes: number;
}

export function createDataRequest(userId: string): DataRequestResult {
  return {
    requestId: `gdpr-${userId}-${Date.now()}`,
    status: "processing",
    estimatedCompletionMinutes: 30,
  };
}

// ── Account Deletion ──────────────────────────────────────────────────

export interface AccountDeletionResult {
  readonly scheduled: boolean;
  readonly gracePeriodDays: number;
  readonly scheduledDeletionDate: string;
}

export async function scheduleAccountDeletion(
  userId: string,
): Promise<AccountDeletionResult> {
  const gracePeriodDays = 30;
  const deletionDate = new Date(
    Date.now() + gracePeriodDays * 24 * 60 * 60 * 1000,
  );

  // Soft-delete the user (marks profile)
  await importExportRepo.softDeleteUser(userId);

  return {
    scheduled: true,
    gracePeriodDays,
    scheduledDeletionDate: deletionDate.toISOString(),
  };
}
