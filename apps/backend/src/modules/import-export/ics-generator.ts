/**
 * RFC 5545 compliant ICS (iCalendar) generator.
 * Generates VTODO components for tasks with optional RRULE.
 */

export interface IcsTask {
  readonly id: string;
  readonly title: string;
  readonly description: string | null;
  readonly dueDate: Date | null;
  readonly completedAt: Date | null;
  readonly status: string;
  readonly priority: string;
  readonly rrule: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

function formatIcsDate(date: Date): string {
  return date
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
}

function escapeIcsText(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

function mapPriority(priority: string): number {
  switch (priority) {
    case "urgent":
      return 1;
    case "high":
      return 3;
    case "medium":
      return 5;
    case "low":
      return 7;
    default:
      return 9;
  }
}

function mapStatus(status: string): string {
  switch (status) {
    case "completed":
      return "COMPLETED";
    case "cancelled":
      return "CANCELLED";
    case "in_progress":
      return "IN-PROCESS";
    default:
      return "NEEDS-ACTION";
  }
}

function generateVTodo(task: IcsTask): string {
  const lines: string[] = [
    "BEGIN:VTODO",
    `UID:${task.id}@unjynx.app`,
    `DTSTAMP:${formatIcsDate(task.updatedAt)}`,
    `CREATED:${formatIcsDate(task.createdAt)}`,
    `LAST-MODIFIED:${formatIcsDate(task.updatedAt)}`,
    `SUMMARY:${escapeIcsText(task.title)}`,
    `STATUS:${mapStatus(task.status)}`,
    `PRIORITY:${mapPriority(task.priority)}`,
  ];

  if (task.description) {
    lines.push(`DESCRIPTION:${escapeIcsText(task.description)}`);
  }

  if (task.dueDate) {
    lines.push(`DUE:${formatIcsDate(task.dueDate)}`);
  }

  if (task.completedAt) {
    lines.push(`COMPLETED:${formatIcsDate(task.completedAt)}`);
    lines.push("PERCENT-COMPLETE:100");
  }

  if (task.rrule) {
    lines.push(`RRULE:${task.rrule}`);
  }

  lines.push("END:VTODO");

  return lines.join("\r\n");
}

export function generateIcs(tasks: readonly IcsTask[]): string {
  const header = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//UNJYNX//Task Manager//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ].join("\r\n");

  const todos = tasks.map(generateVTodo).join("\r\n");

  const footer = "END:VCALENDAR";

  return `${header}\r\n${todos}\r\n${footer}`;
}
