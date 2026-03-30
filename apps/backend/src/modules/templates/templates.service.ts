// ── Task Templates Service ────────────────────────────────────────────
//
// Template CRUD + AI-powered template suggestions.
//
// Features:
//   - System templates (global, pre-built)
//   - User templates (custom, from decompose or manual)
//   - AI keyword matching: "sprint planning" → suggest Sprint Planning template
//   - "Save as template" after AI task decomposition
//   - Usage tracking (increment on each use)
//   - Fuzzy search via fuse.js

import Fuse from "fuse.js";
import { eq, and, or, desc, sql } from "drizzle-orm";
import { db } from "../../db/index.js";
import { taskTemplates, tasks } from "../../db/schema/index.js";
import type { TaskTemplate } from "../../db/schema/index.js";

// ── Types ──────────────────────────────────────────────────────────

export interface TemplateSubtask {
  readonly title: string;
  readonly estimatedMinutes: number;
  readonly isOptional?: boolean;
}

export interface TemplateWithSubtasks extends TaskTemplate {
  readonly parsedSubtasks: readonly TemplateSubtask[];
}

export interface TemplateSuggestion {
  readonly template: TaskTemplate;
  readonly score: number;
  readonly matchType: "keyword" | "fuzzy" | "category";
}

// ── System Templates (seeded on first access) ─────────────────────

const SYSTEM_TEMPLATES: readonly {
  title: string;
  description: string;
  priority: "none" | "low" | "medium" | "high" | "urgent";
  category: string;
  subtasks: TemplateSubtask[];
}[] = [
  {
    title: "Weekly Review",
    description: "End-of-week review and planning for next week",
    priority: "medium",
    category: "productivity",
    subtasks: [
      { title: "Review completed tasks this week", estimatedMinutes: 10 },
      { title: "Process inbox to zero", estimatedMinutes: 15 },
      { title: "Review upcoming calendar events", estimatedMinutes: 5 },
      { title: "Set top 3 goals for next week", estimatedMinutes: 10 },
      { title: "Update project statuses", estimatedMinutes: 10 },
    ],
  },
  {
    title: "Morning Routine",
    description: "Start your day with intention",
    priority: "medium",
    category: "wellness",
    subtasks: [
      { title: "Hydrate — drink a glass of water", estimatedMinutes: 2 },
      { title: "5-minute mindfulness or breathing", estimatedMinutes: 5 },
      { title: "Review today's plan", estimatedMinutes: 5 },
      { title: "Set daily intention", estimatedMinutes: 3 },
    ],
  },
  {
    title: "Sprint Planning",
    description: "Prepare and run sprint planning session",
    priority: "high",
    category: "professional",
    subtasks: [
      { title: "Review backlog and prioritize stories", estimatedMinutes: 20 },
      { title: "Estimate story points for top items", estimatedMinutes: 15 },
      { title: "Define sprint goal", estimatedMinutes: 10 },
      { title: "Assign tasks to team members", estimatedMinutes: 10 },
      { title: "Set up sprint board", estimatedMinutes: 5 },
      { title: "Schedule daily standups", estimatedMinutes: 5 },
    ],
  },
  {
    title: "Meeting Preparation",
    description: "Get ready for an important meeting",
    priority: "high",
    category: "professional",
    subtasks: [
      { title: "Review meeting agenda", estimatedMinutes: 5 },
      { title: "Prepare talking points", estimatedMinutes: 15 },
      { title: "Gather relevant documents/data", estimatedMinutes: 10 },
      { title: "Test presentation/screen share", estimatedMinutes: 5 },
    ],
  },
  {
    title: "Code Review Checklist",
    description: "Thorough code review before merge",
    priority: "high",
    category: "development",
    subtasks: [
      { title: "Read PR description and linked issues", estimatedMinutes: 5 },
      { title: "Review code changes line by line", estimatedMinutes: 20 },
      { title: "Check for security vulnerabilities", estimatedMinutes: 10 },
      { title: "Verify tests cover new code", estimatedMinutes: 10 },
      { title: "Check for performance implications", estimatedMinutes: 5 },
      { title: "Test locally if needed", estimatedMinutes: 15 },
      { title: "Leave constructive review comments", estimatedMinutes: 10 },
    ],
  },
  {
    title: "Blog Post Pipeline",
    description: "End-to-end blog post creation",
    priority: "medium",
    category: "content",
    subtasks: [
      { title: "Research topic and outline", estimatedMinutes: 30 },
      { title: "Write first draft", estimatedMinutes: 60 },
      { title: "Edit and proofread", estimatedMinutes: 20 },
      { title: "Add images/diagrams", estimatedMinutes: 15 },
      { title: "SEO optimization (title, meta, keywords)", estimatedMinutes: 10 },
      { title: "Publish and share on social media", estimatedMinutes: 10 },
    ],
  },
  {
    title: "Project Kickoff",
    description: "Launch a new project properly",
    priority: "high",
    category: "professional",
    subtasks: [
      { title: "Define project goals and success metrics", estimatedMinutes: 20 },
      { title: "Identify stakeholders and team members", estimatedMinutes: 10 },
      { title: "Create project timeline/milestones", estimatedMinutes: 15 },
      { title: "Set up communication channels", estimatedMinutes: 5 },
      { title: "Schedule kickoff meeting", estimatedMinutes: 5 },
      { title: "Create project documentation", estimatedMinutes: 20 },
    ],
  },
  {
    title: "Trip Preparation",
    description: "Everything to do before traveling",
    priority: "medium",
    category: "personal",
    subtasks: [
      { title: "Book flights and accommodation", estimatedMinutes: 30 },
      { title: "Pack essentials and documents", estimatedMinutes: 20 },
      { title: "Arrange transport to/from airport", estimatedMinutes: 10 },
      { title: "Set out-of-office messages", estimatedMinutes: 5 },
      { title: "Download offline maps/guides", estimatedMinutes: 10 },
      { title: "Inform relevant people", estimatedMinutes: 5 },
      { title: "Check weather and adjust packing", estimatedMinutes: 5 },
    ],
  },
];

// ── Public API ──────────────────────────────────────────────────────

/**
 * Get all templates (global system + user custom).
 */
export async function getTemplates(
  userId: string,
  category?: string,
): Promise<readonly TaskTemplate[]> {
  const conditions = [
    or(
      eq(taskTemplates.isGlobal, true),
      eq(taskTemplates.userId, userId),
    ),
  ];

  if (category) {
    conditions.push(eq(taskTemplates.category, category));
  }

  return db
    .select()
    .from(taskTemplates)
    .where(and(...conditions))
    .orderBy(desc(taskTemplates.usageCount));
}

/**
 * Get a single template by ID.
 */
export async function getTemplate(id: string): Promise<TaskTemplate | null> {
  const [template] = await db
    .select()
    .from(taskTemplates)
    .where(eq(taskTemplates.id, id))
    .limit(1);
  return template ?? null;
}

/**
 * Create a new user template.
 */
export async function createTemplate(
  userId: string,
  data: {
    title: string;
    description?: string;
    priority?: "none" | "low" | "medium" | "high" | "urgent";
    category?: string;
    subtasks?: readonly TemplateSubtask[];
  },
): Promise<TaskTemplate> {
  const [template] = await db
    .insert(taskTemplates)
    .values({
      userId,
      title: data.title,
      description: data.description,
      priority: data.priority ?? "none",
      category: data.category ?? "general",
      subtasks: data.subtasks ? JSON.stringify(data.subtasks) : null,
      isGlobal: false,
    })
    .returning();

  return template;
}

/**
 * Delete a user template (not system templates).
 */
export async function deleteTemplate(
  userId: string,
  templateId: string,
): Promise<boolean> {
  const [deleted] = await db
    .delete(taskTemplates)
    .where(
      and(
        eq(taskTemplates.id, templateId),
        eq(taskTemplates.userId, userId),
        eq(taskTemplates.isGlobal, false), // Can't delete system templates
      ),
    )
    .returning({ id: taskTemplates.id });

  return !!deleted;
}

/**
 * Use a template — create a task + subtasks from it, increment usage count.
 */
export async function useTemplate(
  userId: string,
  templateId: string,
): Promise<{ taskId: string; subtaskCount: number }> {
  const template = await getTemplate(templateId);
  if (!template) throw new Error("Template not found");

  // Create the main task
  const [task] = await db
    .insert(tasks)
    .values({
      userId,
      title: template.title,
      description: template.description,
      priority: template.priority ?? "none",
      status: "pending",
    } as never)
    .returning();

  // Parse and create subtasks (if any)
  let subtaskCount = 0;
  if (template.subtasks) {
    try {
      const subtaskList = JSON.parse(template.subtasks) as TemplateSubtask[];
      for (const sub of subtaskList) {
        await db.insert(tasks).values({
          userId,
          title: sub.title,
          parentId: task.id,
          priority: template.priority ?? "none",
          status: "pending",
          description: sub.estimatedMinutes
            ? `Estimated: ${sub.estimatedMinutes} minutes`
            : undefined,
        } as never);
        subtaskCount++;
      }
    } catch {
      // Invalid subtasks JSON — create task without subtasks
    }
  }

  // Increment usage count
  await db
    .update(taskTemplates)
    .set({ usageCount: sql`${taskTemplates.usageCount} + 1` })
    .where(eq(taskTemplates.id, templateId));

  return { taskId: task.id, subtaskCount };
}

/**
 * Save an AI decomposition as a reusable template.
 */
export async function saveDecompositionAsTemplate(
  userId: string,
  title: string,
  subtasks: readonly TemplateSubtask[],
  category: string = "custom",
): Promise<TaskTemplate> {
  return createTemplate(userId, {
    title,
    description: `Custom template from AI decomposition (${subtasks.length} steps)`,
    priority: "medium",
    category,
    subtasks,
  });
}

/**
 * Seed system templates (run once, idempotent).
 */
export async function seedSystemTemplates(): Promise<number> {
  let seeded = 0;
  for (const tmpl of SYSTEM_TEMPLATES) {
    // Check if already exists
    const [existing] = await db
      .select({ id: taskTemplates.id })
      .from(taskTemplates)
      .where(
        and(
          eq(taskTemplates.title, tmpl.title),
          eq(taskTemplates.isGlobal, true),
        ),
      )
      .limit(1);

    if (!existing) {
      await db.insert(taskTemplates).values({
        title: tmpl.title,
        description: tmpl.description,
        priority: tmpl.priority,
        category: tmpl.category,
        subtasks: JSON.stringify(tmpl.subtasks),
        isGlobal: true,
      });
      seeded++;
    }
  }
  return seeded;
}

// ── AI Template Matching ──────────────────────────────────────────

/**
 * Find templates matching a task title via fuzzy search.
 * Used by the intent classifier and task creation UI.
 */
export async function suggestTemplates(
  userId: string,
  query: string,
  limit: number = 3,
): Promise<readonly TemplateSuggestion[]> {
  const allTemplates = await getTemplates(userId);
  if (allTemplates.length === 0) return [];

  // Fuse.js fuzzy search across template titles + descriptions
  const fuse = new Fuse([...allTemplates], {
    keys: [
      { name: "title", weight: 2 },
      { name: "description", weight: 1 },
      { name: "category", weight: 0.5 },
    ],
    threshold: 0.4,
    includeScore: true,
  });

  const results = fuse.search(query);

  return results.slice(0, limit).map((r) => ({
    template: r.item,
    score: 1 - (r.score ?? 0.5),
    matchType: (r.score ?? 1) < 0.2 ? "keyword" as const : "fuzzy" as const,
  }));
}
