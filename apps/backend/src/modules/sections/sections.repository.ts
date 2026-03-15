import { eq, and, asc } from "drizzle-orm";
import { db } from "../../db/index.js";
import {
  sections,
  projects,
  type Section,
  type NewSection,
  type Project,
} from "../../db/schema/index.js";

export async function verifyProjectOwnership(
  userId: string,
  projectId: string,
): Promise<Project | undefined> {
  const [project] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, userId)));

  return project;
}

export async function insertSection(
  projectId: string,
  userId: string,
  data: { name: string },
): Promise<Section> {
  const newSection: NewSection = {
    projectId,
    userId,
    name: data.name,
  };

  const [created] = await db.insert(sections).values(newSection).returning();
  return created;
}

export async function findSectionsByProjectId(
  projectId: string,
): Promise<Section[]> {
  return db
    .select()
    .from(sections)
    .where(eq(sections.projectId, projectId))
    .orderBy(asc(sections.sortOrder));
}

export async function findSectionById(
  sectionId: string,
): Promise<Section | undefined> {
  const [section] = await db
    .select()
    .from(sections)
    .where(eq(sections.id, sectionId));

  return section;
}

export async function updateSectionById(
  sectionId: string,
  projectId: string,
  data: Partial<Pick<Section, "name" | "sortOrder">>,
): Promise<Section | undefined> {
  const [updated] = await db
    .update(sections)
    .set(data)
    .where(and(eq(sections.id, sectionId), eq(sections.projectId, projectId)))
    .returning();

  return updated;
}

export async function deleteSectionById(
  sectionId: string,
  projectId: string,
): Promise<boolean> {
  const result = await db
    .delete(sections)
    .where(and(eq(sections.id, sectionId), eq(sections.projectId, projectId)))
    .returning({ id: sections.id });

  return result.length > 0;
}

export async function reorderSections(
  projectId: string,
  ids: string[],
): Promise<void> {
  await db.transaction(async (tx) => {
    const updates = ids.map((id, index) =>
      tx
        .update(sections)
        .set({ sortOrder: index })
        .where(and(eq(sections.id, id), eq(sections.projectId, projectId))),
    );

    await Promise.all(updates);
  });
}
