import type { Comment } from "../../db/schema/index.js";
import type {
  CreateCommentInput,
  UpdateCommentInput,
  CommentQuery,
} from "./comments.schema.js";
import * as commentRepo from "./comments.repository.js";

export async function createComment(
  userId: string,
  taskId: string,
  input: CreateCommentInput,
): Promise<Comment> {
  return commentRepo.insertComment({
    taskId,
    userId,
    content: input.content,
  });
}

export async function getComments(
  taskId: string,
  query: CommentQuery,
): Promise<{ items: Comment[]; total: number }> {
  const offset = (query.page - 1) * query.limit;

  return commentRepo.findCommentsByTaskId(taskId, query.limit, offset);
}

export async function updateComment(
  userId: string,
  commentId: string,
  input: UpdateCommentInput,
): Promise<Comment | undefined> {
  return commentRepo.updateCommentById(userId, commentId, {
    content: input.content,
    updatedAt: new Date(),
  });
}

export async function deleteComment(
  userId: string,
  commentId: string,
): Promise<boolean> {
  return commentRepo.deleteCommentById(userId, commentId);
}
