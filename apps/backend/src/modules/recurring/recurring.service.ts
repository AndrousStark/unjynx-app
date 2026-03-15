import type { RecurringRule } from "../../db/schema/index.js";
import * as recurringRepo from "./recurring.repository.js";
import * as taskRepo from "../tasks/tasks.repository.js";
import { parseRRule, getNextOccurrences } from "./rrule-parser.js";

export async function getRecurrence(
  taskId: string,
  profileId: string,
): Promise<RecurringRule | undefined> {
  // Verify the task belongs to this user
  const task = await taskRepo.findTaskById(profileId, taskId);

  if (!task) {
    return undefined;
  }

  return recurringRepo.findByTaskId(taskId, profileId);
}

export async function setRecurrence(
  taskId: string,
  profileId: string,
  rrule: string,
): Promise<RecurringRule | undefined> {
  // Verify the task belongs to this user
  const task = await taskRepo.findTaskById(profileId, taskId);

  if (!task) {
    return undefined;
  }

  // Validate and parse the RRULE to compute next occurrence
  const parsed = parseRRule(rrule);

  if (!parsed) {
    throw new Error("Invalid RRULE string");
  }

  const occurrences = getNextOccurrences(rrule, 1);
  const nextOccurrence = occurrences.length > 0 ? occurrences[0] : null;

  // Also update the task's rrule field for consistency
  await taskRepo.updateTaskById(profileId, taskId, {
    rrule,
    updatedAt: new Date(),
  });

  return recurringRepo.upsert(taskId, profileId, rrule, nextOccurrence);
}

export async function removeRecurrence(
  taskId: string,
  profileId: string,
): Promise<boolean> {
  // Verify the task belongs to this user
  const task = await taskRepo.findTaskById(profileId, taskId);

  if (!task) {
    return false;
  }

  // Clear the rrule field on the task
  await taskRepo.updateTaskById(profileId, taskId, {
    rrule: null,
    updatedAt: new Date(),
  });

  return recurringRepo.remove(taskId, profileId);
}

export async function getOccurrences(
  taskId: string,
  profileId: string,
  count: number,
): Promise<Date[] | undefined> {
  // Verify the task belongs to this user
  const task = await taskRepo.findTaskById(profileId, taskId);

  if (!task) {
    return undefined;
  }

  const rule = await recurringRepo.findByTaskId(taskId, profileId);

  if (!rule) {
    return undefined;
  }

  return getNextOccurrences(rule.rrule, count);
}
