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

// ── Export JSON (GDPR/DPDP Compliant) ─────────────────────────────────
// Returns ALL user data across every table for full GDPR Article 20 /
// India DPDP Act 2023 compliance. Sensitive tokens and internal IDs
// (RevenueCat, OAuth tokens) are excluded from the export.

export interface GdprExportData {
  readonly exportVersion: "2.0";
  readonly exportedAt: string;
  readonly dataSubject: {
    readonly userId: string;
    readonly requestedAt: string;
  };
  readonly profile: Record<string, unknown>;
  readonly settings: Record<string, unknown> | null;
  readonly tasks: readonly Record<string, unknown>[];
  readonly projects: readonly Record<string, unknown>[];
  readonly sections: readonly Record<string, unknown>[];
  readonly subtasks: readonly Record<string, unknown>[];
  readonly comments: readonly Record<string, unknown>[];
  readonly attachments: readonly Record<string, unknown>[];
  readonly tags: readonly Record<string, unknown>[];
  readonly taskTags: readonly Record<string, unknown>[];
  readonly recurringRules: readonly Record<string, unknown>[];
  readonly reminders: readonly Record<string, unknown>[];
  readonly notificationPreferences: Record<string, unknown> | null;
  readonly notificationChannels: readonly Record<string, unknown>[];
  readonly notifications: readonly Record<string, unknown>[];
  readonly notificationLog: readonly Record<string, unknown>[];
  readonly contentPreferences: readonly Record<string, unknown>[];
  readonly contentDeliveryLog: readonly Record<string, unknown>[];
  readonly rituals: readonly Record<string, unknown>[];
  readonly streaks: readonly Record<string, unknown>[];
  readonly progressSnapshots: readonly Record<string, unknown>[];
  readonly pomodoroSessions: readonly Record<string, unknown>[];
  readonly gamification: {
    readonly xpSummary: Record<string, unknown> | null;
    readonly xpTransactions: readonly Record<string, unknown>[];
    readonly achievements: readonly Record<string, unknown>[];
    readonly challenges: readonly Record<string, unknown>[];
  };
  readonly teams: {
    readonly memberships: readonly Record<string, unknown>[];
    readonly standups: readonly Record<string, unknown>[];
  };
  readonly accountability: {
    readonly partners: readonly Record<string, unknown>[];
    readonly sharedGoalProgress: readonly Record<string, unknown>[];
  };
  readonly billing: {
    readonly subscriptions: readonly Record<string, unknown>[];
    readonly invoices: readonly Record<string, unknown>[];
    readonly couponRedemptions: readonly Record<string, unknown>[];
  };
  readonly auditLog: readonly Record<string, unknown>[];
  readonly syncMetadata: readonly Record<string, unknown>[];
}

export async function exportJson(userId: string): Promise<GdprExportData> {
  const allData = await importExportRepo.findAllUserDataForGdpr(userId);
  const now = new Date().toISOString();

  return {
    exportVersion: "2.0",
    exportedAt: now,
    dataSubject: {
      userId,
      requestedAt: now,
    },
    ...allData,
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
  readonly immediateActions: readonly string[];
  readonly message: string;
}

export async function scheduleAccountDeletion(
  userId: string,
): Promise<AccountDeletionResult> {
  const gracePeriodDays = 30;
  const deletionDate = new Date(
    Date.now() + gracePeriodDays * 24 * 60 * 60 * 1000,
  );

  // Soft-delete: anonymize PII, cancel subscriptions, disable channels,
  // delete OAuth tokens. Full data deletion after grace period.
  const deleted = await importExportRepo.softDeleteUser(userId);

  if (!deleted) {
    throw new Error("Account not found");
  }

  return {
    scheduled: true,
    gracePeriodDays,
    scheduledDeletionDate: deletionDate.toISOString(),
    immediateActions: [
      "Profile PII anonymized (name, email, avatar)",
      "Active subscriptions cancelled",
      "Notification channels disabled",
      "Calendar OAuth tokens deleted",
    ],
    message:
      `Your account is scheduled for permanent deletion on ${deletionDate.toISOString().split("T")[0]}. ` +
      `You have ${gracePeriodDays} days to cancel this request by contacting support. ` +
      `After this period, all data will be permanently removed and cannot be recovered.`,
  };
}

// ── Hard Delete Expired Accounts (Cron Job) ──────────────────────────
// GDPR Article 17 / India DPDP Act 2023: permanently remove all user
// data after the 30-day grace period following soft deletion.
//
// The profile row is deleted and PostgreSQL CASCADE foreign keys
// automatically remove all child records (tasks, projects, subtasks,
// tags, comments, notifications, channels, gamification, team
// memberships, subscriptions, etc.). The audit_log userId is SET NULL,
// preserving an anonymised audit trail.

export interface HardDeleteResult {
  readonly deletedCount: number;
  readonly failedIds: readonly string[];
}

export async function hardDeleteExpiredAccounts(): Promise<HardDeleteResult> {
  const expiredProfiles = await importExportRepo.findExpiredDeletedProfiles(30);

  if (expiredProfiles.length === 0) {
    return { deletedCount: 0, failedIds: [] };
  }

  let deletedCount = 0;
  const failedIds: string[] = [];

  for (const profile of expiredProfiles) {
    try {
      const deleted = await importExportRepo.hardDeleteUser(profile.id);
      if (deleted) {
        deletedCount++;
      } else {
        failedIds.push(profile.id);
      }
    } catch {
      failedIds.push(profile.id);
    }
  }

  return { deletedCount, failedIds };
}
