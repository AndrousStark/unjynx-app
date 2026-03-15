/**
 * Lightweight CSV parser service.
 * Supports Todoist, TickTick, and generic CSV formats.
 */

export interface ParsedTask {
  readonly title: string;
  readonly description: string | null;
  readonly priority: "none" | "low" | "medium" | "high" | "urgent";
  readonly dueDate: string | null;
  readonly project: string | null;
  readonly status: string | null;
}

export interface CsvParseResult {
  readonly headers: readonly string[];
  readonly rows: readonly Record<string, string>[];
  readonly tasks: readonly ParsedTask[];
  readonly totalRows: number;
}

// ── Core CSV Parsing ──────────────────────────────────────────────────

function parseCsvRows(
  content: string,
  delimiter: string,
): { headers: string[]; rows: Record<string, string>[] } {
  const lines = content
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0);

  if (lines.length === 0) {
    return { headers: [], rows: [] };
  }

  const headers = parseCsvLine(lines[0], delimiter);
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i], delimiter);
    const row: Record<string, string> = {};

    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = values[j] ?? "";
    }

    rows.push(row);
  }

  return { headers, rows };
}

function parseCsvLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (inQuotes) {
      if (char === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === delimiter) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

// ── Format-Specific Mappers ───────────────────────────────────────────

const PRIORITY_MAP: Record<string, ParsedTask["priority"]> = {
  "1": "urgent",
  "2": "high",
  "3": "medium",
  "4": "low",
  p1: "urgent",
  p2: "high",
  p3: "medium",
  p4: "low",
  urgent: "urgent",
  high: "high",
  medium: "medium",
  low: "low",
  none: "none",
  "0": "none",
  "5": "none",
};

function normalizePriority(value: string | undefined): ParsedTask["priority"] {
  if (!value) return "none";
  return PRIORITY_MAP[value.toLowerCase().trim()] ?? "none";
}

function todoistMapper(row: Record<string, string>): ParsedTask {
  return {
    title: row["Content"] ?? row["content"] ?? "",
    description: row["Description"] ?? row["description"] ?? null,
    priority: normalizePriority(row["Priority"] ?? row["priority"]),
    dueDate: row["Due Date"] ?? row["due_date"] ?? null,
    project: row["Project"] ?? row["project"] ?? null,
    status: row["Status"] ?? row["status"] ?? null,
  };
}

function ticktickMapper(row: Record<string, string>): ParsedTask {
  return {
    title: row["Title"] ?? row["title"] ?? "",
    description: row["Content"] ?? row["content"] ?? null,
    priority: normalizePriority(row["Priority"] ?? row["priority"]),
    dueDate: row["Due Date"] ?? row["due_date"] ?? row["DueDate"] ?? null,
    project: row["List Name"] ?? row["list_name"] ?? row["Folder"] ?? null,
    status: row["Status"] ?? row["status"] ?? null,
  };
}

function genericMapper(
  row: Record<string, string>,
  mapping?: Record<string, string>,
): ParsedTask {
  if (mapping) {
    return {
      title: row[mapping.title ?? "title"] ?? "",
      description: row[mapping.description ?? "description"] ?? null,
      priority: normalizePriority(row[mapping.priority ?? "priority"]),
      dueDate: row[mapping.dueDate ?? "due_date"] ?? null,
      project: row[mapping.project ?? "project"] ?? null,
      status: row[mapping.status ?? "status"] ?? null,
    };
  }

  // Auto-detect common column names
  const title =
    row["title"] ?? row["Title"] ?? row["name"] ?? row["Name"] ?? row["task"] ?? "";
  const description =
    row["description"] ?? row["Description"] ?? row["notes"] ?? row["Notes"] ?? null;

  return {
    title,
    description,
    priority: normalizePriority(
      row["priority"] ?? row["Priority"] ?? row["importance"],
    ),
    dueDate:
      row["due_date"] ?? row["Due Date"] ?? row["dueDate"] ?? row["deadline"] ?? null,
    project:
      row["project"] ?? row["Project"] ?? row["list"] ?? row["category"] ?? null,
    status: row["status"] ?? row["Status"] ?? null,
  };
}

// ── Public API ────────────────────────────────────────────────────────

export function parseCsv(
  content: string,
  format: "todoist" | "ticktick" | "generic",
  delimiter: string = ",",
  columnMapping?: Record<string, string>,
): CsvParseResult {
  const { headers, rows } = parseCsvRows(content, delimiter);

  const mapper =
    format === "todoist"
      ? todoistMapper
      : format === "ticktick"
        ? ticktickMapper
        : (row: Record<string, string>) => genericMapper(row, columnMapping);

  const tasks = rows
    .map(mapper)
    .filter((task) => task.title.length > 0);

  return { headers, rows, tasks, totalRows: rows.length };
}

/**
 * Detect duplicates by matching title + dueDate.
 */
export function findDuplicates(
  incoming: readonly ParsedTask[],
  existing: readonly { title: string; dueDate: Date | null }[],
): Set<number> {
  const existingSet = new Set(
    existing.map(
      (e) => `${e.title.toLowerCase()}|${e.dueDate?.toISOString() ?? ""}`,
    ),
  );

  const duplicateIndices = new Set<number>();

  for (let i = 0; i < incoming.length; i++) {
    const key = `${incoming[i].title.toLowerCase()}|${incoming[i].dueDate ?? ""}`;
    if (existingSet.has(key)) {
      duplicateIndices.add(i);
    }
  }

  return duplicateIndices;
}
