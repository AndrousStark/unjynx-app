import type { Tag, NewTag, TaskTag } from "../../db/schema/index.js";
import type {
  CreateTagInput,
  UpdateTagInput,
  TagQuery,
} from "./tags.schema.js";
import * as tagRepo from "./tags.repository.js";

export async function createTag(
  userId: string,
  input: CreateTagInput,
): Promise<Tag> {
  const existing = await tagRepo.findTagByName(userId, input.name);
  if (existing) {
    throw new Error("A tag with this name already exists");
  }

  const newTag: NewTag = {
    userId,
    name: input.name,
    color: input.color,
  };

  return tagRepo.insertTag(newTag);
}

export async function getTags(
  userId: string,
  query: TagQuery,
): Promise<{ items: Tag[]; total: number }> {
  const offset = (query.page - 1) * query.limit;
  return tagRepo.findTags(userId, query.limit, offset);
}

export async function getTagById(
  userId: string,
  tagId: string,
): Promise<Tag | undefined> {
  return tagRepo.findTagById(userId, tagId);
}

export async function updateTag(
  userId: string,
  tagId: string,
  input: UpdateTagInput,
): Promise<Tag | undefined> {
  if (input.name) {
    const existing = await tagRepo.findTagByName(userId, input.name);
    if (existing && existing.id !== tagId) {
      throw new Error("A tag with this name already exists");
    }
  }

  return tagRepo.updateTagById(userId, tagId, input);
}

export async function deleteTag(
  userId: string,
  tagId: string,
): Promise<boolean> {
  return tagRepo.deleteTagById(userId, tagId);
}

export async function addTagToTask(
  userId: string,
  taskId: string,
  tagId: string,
): Promise<TaskTag> {
  const tag = await tagRepo.findTagById(userId, tagId);
  if (!tag) {
    throw new Error("Tag not found");
  }

  return tagRepo.addTagToTask(taskId, tagId);
}

export async function removeTagFromTask(
  userId: string,
  taskId: string,
  tagId: string,
): Promise<boolean> {
  const tag = await tagRepo.findTagById(userId, tagId);
  if (!tag) {
    throw new Error("Tag not found");
  }

  return tagRepo.removeTagFromTask(taskId, tagId);
}

export async function getTagsForTask(taskId: string): Promise<Tag[]> {
  return tagRepo.findTagsByTaskId(taskId);
}
