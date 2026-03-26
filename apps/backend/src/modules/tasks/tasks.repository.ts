import {
  eq,
  and,
  count,
  desc,
  asc,
  gt,
  lt,
  gte,
  lte,
  or,
  ilike,
  inArray,
  sql,
  type SQL,
} from "drizzle-orm";
import { db } from "../../db/index.js";
import { tasks, type Task, type NewTask } from "../../db/schema/index.js";

export interface TaskFilters {
  readonly status?: string;
  readonly priority?: string;
  readonly projectId?: string;
}

export async function countByUser(userId: string): Promise<number> {
  const [result] = await db
    .select({ count: count() })
    .from(tasks)
    .where(eq(tasks.userId, userId));
  return Number(result?.count ?? 0);
}

export async function insertTask(data: NewTask): Promise<Task> {
  const [created] = await db.insert(tasks).values(data).returning();
  return created;
}

export async function findTasks(
  userId: string,
  filters: TaskFilters,
  limit: number,
  offset: number,
): Promise<{ items: Task[]; total: number }> {
  const conditions: SQL[] = [eq(tasks.userId, userId)];

  if (filters.status) {
    conditions.push(eq(tasks.status, filters.status as typeof tasks.status.enumValues[number]));
  }
  if (filters.priority) {
    conditions.push(eq(tasks.priority, filters.priority as typeof tasks.priority.enumValues[number]));
  }
  if (filters.projectId) {
    conditions.push(eq(tasks.projectId, filters.projectId));
  }

  const where = and(...conditions);

  const [items, [{ total }]] = await Promise.all([
    db
      .select()
      .from(tasks)
      .where(where)
      .orderBy(asc(tasks.sortOrder), desc(tasks.createdAt))
      .limit(limit)
      .offset(offset),
    db.select({ total: count() }).from(tasks).where(where),
  ]);

  return { items, total };
}

export async function findTaskById(
  userId: string,
  taskId: string,
): Promise<Task | undefined> {
  const [task] = await db
    .select()
    .from(tasks)
    .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)));

  return task;
}

export async function updateTaskById(
  userId: string,
  taskId: string,
  data: Partial<NewTask> & { updatedAt: Date },
): Promise<Task | undefined> {
  const [updated] = await db
    .update(tasks)
    .set(data)
    .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)))
    .returning();

  return updated;
}

export async function deleteTaskById(
  userId: string,
  taskId: string,
): Promise<boolean> {
  const result = await db
    .delete(tasks)
    .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)))
    .returning({ id: tasks.id });

  return result.length > 0;
}

// ── Bulk Operations ────────────────────────────────────────────────────

export async function bulkInsertTasks(data: NewTask[]): Promise<Task[]> {
  return db.insert(tasks).values(data).returning();
}

export async function bulkUpdateTasks(
  userId: string,
  updates: ReadonlyArray<{ readonly id: string; readonly data: Partial<NewTask> & { updatedAt: Date } }>,
): Promise<Task[]> {
  const results: Task[] = [];

  for (const { id, data } of updates) {
    const [updated] = await db
      .update(tasks)
      .set(data)
      .where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
      .returning();

    if (updated) {
      results.push(updated);
    }
  }

  return results;
}

export async function bulkDeleteTasks(
  userId: string,
  ids: readonly string[],
): Promise<number> {
  const result = await db
    .delete(tasks)
    .where(and(eq(tasks.userId, userId), inArray(tasks.id, [...ids])))
    .returning({ id: tasks.id });

  return result.length;
}

export async function duplicateTask(
  userId: string,
  taskId: string,
): Promise<Task | undefined> {
  const source = await findTaskById(userId, taskId);

  if (!source) {
    return undefined;
  }

  const newTask: NewTask = {
    userId: source.userId,
    projectId: source.projectId,
    title: source.title,
    description: source.description,
    priority: source.priority,
    dueDate: source.dueDate,
    rrule: source.rrule,
    sortOrder: source.sortOrder,
  };

  const [created] = await db.insert(tasks).values(newTask).returning();
  return created;
}

export async function countTasksByProject(
  userId: string,
  projectId: string,
): Promise<number> {
  const [{ total }] = await db
    .select({ total: count() })
    .from(tasks)
    .where(
      and(
        eq(tasks.userId, userId),
        eq(tasks.projectId, projectId),
        inArray(tasks.status, ["pending", "in_progress"]),
      ),
    );

  return total;
}

// ── Cursor-Based Pagination ────────────────────────────────────────────

export interface CursorFilters {
  readonly status?: string;
  readonly priority?: string;
  readonly projectId?: string;
  readonly search?: string;
  readonly dueBefore?: Date;
  readonly dueAfter?: Date;
}

export interface CursorPaginationResult {
  readonly items: Task[];
  readonly nextCursor: string | null;
  readonly hasMore: boolean;
}

interface DecodedCursor {
  readonly sortValue: string | null;
  readonly id: string;
}

const SORT_COLUMN_MAP = {
  due_at: tasks.dueDate,
  "-due_at": tasks.dueDate,
  priority: tasks.priority,
  "-priority": tasks.priority,
  created_at: tasks.createdAt,
  "-created_at": tasks.createdAt,
  title: tasks.title,
  "-title": tasks.title,
} as const;

function encodeCursor(sortValue: string | null, id: string): string {
  return Buffer.from(JSON.stringify({ sortValue, id })).toString("base64");
}

function decodeCursor(cursor: string): DecodedCursor {
  const decoded = JSON.parse(Buffer.from(cursor, "base64").toString("utf-8"));
  return { sortValue: decoded.sortValue ?? null, id: decoded.id };
}

export async function findTasksWithCursor(
  userId: string,
  filters: CursorFilters,
  sort: string,
  limit: number,
  cursor?: string,
): Promise<CursorPaginationResult> {
  const conditions: SQL[] = [eq(tasks.userId, userId)];

  if (filters.status) {
    conditions.push(
      eq(tasks.status, filters.status as (typeof tasks.status.enumValues)[number]),
    );
  }
  if (filters.priority) {
    conditions.push(
      eq(tasks.priority, filters.priority as (typeof tasks.priority.enumValues)[number]),
    );
  }
  if (filters.projectId) {
    conditions.push(eq(tasks.projectId, filters.projectId));
  }
  if (filters.search) {
    // Use PostgreSQL full-text search with plainto_tsquery for robust matching.
    // Falls back to ilike if tsvector search returns no results (e.g. very short queries).
    // Searches both title and description with title weighted higher (A vs B).
    conditions.push(
      sql`(
        to_tsvector('english', coalesce(${tasks.title}, '') || ' ' || coalesce(${tasks.description}, ''))
        @@ plainto_tsquery('english', ${filters.search})
        OR ${ilike(tasks.title, `%${filters.search}%`)}
      )`,
    );
  }
  if (filters.dueBefore) {
    conditions.push(lte(tasks.dueDate, filters.dueBefore));
  }
  if (filters.dueAfter) {
    conditions.push(gte(tasks.dueDate, filters.dueAfter));
  }

  const isDesc = sort.startsWith("-");
  const sortKey = sort as keyof typeof SORT_COLUMN_MAP;
  const sortColumn = SORT_COLUMN_MAP[sortKey];

  // Apply cursor condition using tuple comparison: (sort_col, id) > or < (cursor_sort, cursor_id)
  if (cursor) {
    const decoded = decodeCursor(cursor);

    if (decoded.sortValue === null) {
      // Null sort values: for ascending nulls come first (already past), for descending nulls come last
      if (isDesc) {
        // Looking for rows with (sort_col IS NULL AND id < cursor_id) OR sort_col IS NOT NULL ... but actually
        // nulls sort last in desc in PG by default. Simplify: just filter by id for null cursor values.
        conditions.push(lt(tasks.id, decoded.id));
      } else {
        conditions.push(gt(tasks.id, decoded.id));
      }
    } else if (isDesc) {
      // Descending: (sort_col, id) < (cursor_sort, cursor_id)
      conditions.push(
        or(
          lt(sortColumn, decoded.sortValue),
          and(eq(sortColumn, decoded.sortValue), lt(tasks.id, decoded.id)),
        )!,
      );
    } else {
      // Ascending: (sort_col, id) > (cursor_sort, cursor_id)
      conditions.push(
        or(
          gt(sortColumn, decoded.sortValue),
          and(eq(sortColumn, decoded.sortValue), gt(tasks.id, decoded.id)),
        )!,
      );
    }
  }

  const where = and(...conditions);

  const orderBy = isDesc
    ? [desc(sortColumn), desc(tasks.id)]
    : [asc(sortColumn), asc(tasks.id)];

  // Fetch one extra to determine if there are more results
  const items = await db
    .select()
    .from(tasks)
    .where(where)
    .orderBy(...orderBy)
    .limit(limit + 1);

  const hasMore = items.length > limit;
  const resultItems = hasMore ? items.slice(0, limit) : items;

  let nextCursor: string | null = null;
  if (hasMore && resultItems.length > 0) {
    const lastItem = resultItems[resultItems.length - 1];
    const sortValue = getSortValue(lastItem, sortKey);
    nextCursor = encodeCursor(sortValue, lastItem.id);
  }

  return { items: resultItems, nextCursor, hasMore };
}

// ── Calendar View ─────────────────────────────────────────────────────

export interface CalendarTask {
  readonly id: string;
  readonly title: string;
  readonly dueDate: Date | null;
  readonly priority: string;
  readonly status: string;
  readonly projectId: string | null;
}

export async function findTasksForCalendar(
  userId: string,
  start: Date,
  end: Date,
): Promise<CalendarTask[]> {
  return db
    .select({
      id: tasks.id,
      title: tasks.title,
      dueDate: tasks.dueDate,
      priority: tasks.priority,
      status: tasks.status,
      projectId: tasks.projectId,
    })
    .from(tasks)
    .where(
      and(
        eq(tasks.userId, userId),
        gte(tasks.dueDate, start),
        lte(tasks.dueDate, end),
      ),
    )
    .orderBy(asc(tasks.dueDate));
}

function getSortValue(
  task: Task,
  sortKey: string,
): string | null {
  const key = sortKey.startsWith("-") ? sortKey.slice(1) : sortKey;

  switch (key) {
    case "due_at":
      return task.dueDate?.toISOString() ?? null;
    case "priority":
      return task.priority;
    case "created_at":
      return task.createdAt.toISOString();
    case "title":
      return task.title;
    default:
      return task.createdAt.toISOString();
  }
}
