import type { Subtask } from "../../db/schema/index.js";
import type {
  CreateSubtaskInput,
  UpdateSubtaskInput,
  ReorderSubtasksInput,
  SubtaskQuery,
} from "./subtasks.schema.js";
import * as subtaskRepo from "./subtasks.repository.js";

export async function createSubtask(
  userId: string,
  taskId: string,
  input: CreateSubtaskInput,
): Promise<Subtask | undefined> {
  return subtaskRepo.insertSubtask(userId, taskId, {
    title: input.title,
  });
}

export async function getSubtasks(
  userId: string,
  taskId: string,
  query: SubtaskQuery,
): Promise<{ items: Subtask[]; total: number }> {
  const offset = (query.page - 1) * query.limit;

  return subtaskRepo.findSubtasksByTaskId(
    userId,
    taskId,
    query.limit,
    offset,
  );
}

export async function updateSubtask(
  userId: string,
  subtaskId: string,
  input: UpdateSubtaskInput,
): Promise<Subtask | undefined> {
  return subtaskRepo.updateSubtaskById(userId, subtaskId, {
    ...input,
    updatedAt: new Date(),
  });
}

export async function deleteSubtask(
  userId: string,
  subtaskId: string,
): Promise<boolean> {
  return subtaskRepo.deleteSubtaskById(userId, subtaskId);
}

export async function reorderSubtasks(
  userId: string,
  taskId: string,
  input: ReorderSubtasksInput,
): Promise<boolean> {
  return subtaskRepo.reorderSubtasks(userId, taskId, input.ids);
}

export async function getSubtaskProgress(
  userId: string,
  taskId: string,
): Promise<{ total: number; completed: number }> {
  return subtaskRepo.countSubtasksByTaskId(userId, taskId);
}
