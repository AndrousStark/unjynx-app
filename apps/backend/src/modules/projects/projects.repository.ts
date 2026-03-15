import { eq, and, asc, count } from "drizzle-orm";
import { db } from "../../db/index.js";
import {
  projects,
  type Project,
  type NewProject,
} from "../../db/schema/index.js";

export async function insertProject(data: NewProject): Promise<Project> {
  const [created] = await db.insert(projects).values(data).returning();
  return created;
}

export async function findProjects(
  userId: string,
  limit: number,
  offset: number,
): Promise<{ items: Project[]; total: number }> {
  const where = eq(projects.userId, userId);

  const [items, [{ total }]] = await Promise.all([
    db
      .select()
      .from(projects)
      .where(where)
      .orderBy(asc(projects.sortOrder), asc(projects.name))
      .limit(limit)
      .offset(offset),
    db.select({ total: count() }).from(projects).where(where),
  ]);

  return { items, total };
}

export async function findProjectById(
  userId: string,
  projectId: string,
): Promise<Project | undefined> {
  const [project] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, userId)));

  return project;
}

export async function updateProjectById(
  userId: string,
  projectId: string,
  data: Partial<NewProject> & { updatedAt: Date },
): Promise<Project | undefined> {
  const [updated] = await db
    .update(projects)
    .set(data)
    .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
    .returning();

  return updated;
}

export async function deleteProjectById(
  userId: string,
  projectId: string,
): Promise<boolean> {
  const result = await db
    .delete(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
    .returning({ id: projects.id });

  return result.length > 0;
}
