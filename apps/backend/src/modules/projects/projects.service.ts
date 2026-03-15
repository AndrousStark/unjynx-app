import type { Project, NewProject } from "../../db/schema/index.js";
import type {
  CreateProjectInput,
  UpdateProjectInput,
  ProjectQuery,
} from "./projects.schema.js";
import * as projectRepo from "./projects.repository.js";

export async function createProject(
  userId: string,
  input: CreateProjectInput,
): Promise<Project> {
  const newProject: NewProject = {
    userId,
    name: input.name,
    description: input.description,
    color: input.color,
    icon: input.icon,
  };

  return projectRepo.insertProject(newProject);
}

export async function getProjects(
  userId: string,
  query: ProjectQuery,
): Promise<{ items: Project[]; total: number }> {
  const offset = (query.page - 1) * query.limit;
  return projectRepo.findProjects(userId, query.limit, offset);
}

export async function getProjectById(
  userId: string,
  projectId: string,
): Promise<Project | undefined> {
  return projectRepo.findProjectById(userId, projectId);
}

export async function updateProject(
  userId: string,
  projectId: string,
  input: UpdateProjectInput,
): Promise<Project | undefined> {
  return projectRepo.updateProjectById(userId, projectId, {
    ...input,
    updatedAt: new Date(),
  });
}

export async function deleteProject(
  userId: string,
  projectId: string,
): Promise<boolean> {
  return projectRepo.deleteProjectById(userId, projectId);
}
