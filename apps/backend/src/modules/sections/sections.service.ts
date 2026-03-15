import type { Section } from "../../db/schema/index.js";
import type {
  CreateSectionInput,
  UpdateSectionInput,
  ReorderSectionsInput,
} from "./sections.schema.js";
import * as sectionRepo from "./sections.repository.js";

async function ensureProjectOwnership(
  userId: string,
  projectId: string,
): Promise<void> {
  const project = await sectionRepo.verifyProjectOwnership(userId, projectId);

  if (!project) {
    throw new Error("Project not found");
  }
}

export async function createSection(
  userId: string,
  projectId: string,
  input: CreateSectionInput,
): Promise<Section> {
  await ensureProjectOwnership(userId, projectId);
  return sectionRepo.insertSection(projectId, userId, { name: input.name });
}

export async function getSections(
  userId: string,
  projectId: string,
): Promise<Section[]> {
  await ensureProjectOwnership(userId, projectId);
  return sectionRepo.findSectionsByProjectId(projectId);
}

export async function updateSection(
  userId: string,
  projectId: string,
  sectionId: string,
  input: UpdateSectionInput,
): Promise<Section | undefined> {
  await ensureProjectOwnership(userId, projectId);
  return sectionRepo.updateSectionById(sectionId, projectId, input);
}

export async function deleteSection(
  userId: string,
  projectId: string,
  sectionId: string,
): Promise<boolean> {
  await ensureProjectOwnership(userId, projectId);
  return sectionRepo.deleteSectionById(sectionId, projectId);
}

export async function reorderSections(
  userId: string,
  projectId: string,
  input: ReorderSectionsInput,
): Promise<void> {
  await ensureProjectOwnership(userId, projectId);
  await sectionRepo.reorderSections(projectId, input.ids);
}
