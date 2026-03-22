import { eq, and, asc } from "drizzle-orm";
import { db } from "../../db/index.js";
import {
  industryModes,
  modeVocabulary,
  modeTemplates,
  modeDashboardWidgets,
  userModePreference,
  type IndustryMode,
  type ModeVocabularyEntry,
  type ModeTemplate,
  type ModeDashboardWidget,
  type UserModePreferenceRow,
} from "../../db/schema/index.js";

// ── Modes ────────────────────────────────────────────────────────────

export async function findAllActiveModes(): Promise<IndustryMode[]> {
  return db
    .select()
    .from(industryModes)
    .where(eq(industryModes.isActive, true))
    .orderBy(asc(industryModes.sortOrder));
}

export async function findModeBySlug(
  slug: string,
): Promise<IndustryMode | undefined> {
  const [mode] = await db
    .select()
    .from(industryModes)
    .where(eq(industryModes.slug, slug))
    .limit(1);

  return mode;
}

export async function findModeById(
  modeId: string,
): Promise<IndustryMode | undefined> {
  const [mode] = await db
    .select()
    .from(industryModes)
    .where(eq(industryModes.id, modeId))
    .limit(1);

  return mode;
}

// ── Vocabulary ───────────────────────────────────────────────────────

export async function findVocabularyByModeId(
  modeId: string,
): Promise<ModeVocabularyEntry[]> {
  return db
    .select()
    .from(modeVocabulary)
    .where(eq(modeVocabulary.modeId, modeId))
    .orderBy(asc(modeVocabulary.originalTerm));
}

// ── Templates ────────────────────────────────────────────────────────

export async function findTemplatesByModeId(
  modeId: string,
): Promise<ModeTemplate[]> {
  return db
    .select()
    .from(modeTemplates)
    .where(eq(modeTemplates.modeId, modeId))
    .orderBy(asc(modeTemplates.sortOrder));
}

// ── Dashboard Widgets ────────────────────────────────────────────────

export async function findWidgetsByModeId(
  modeId: string,
): Promise<ModeDashboardWidget[]> {
  return db
    .select()
    .from(modeDashboardWidgets)
    .where(eq(modeDashboardWidgets.modeId, modeId))
    .orderBy(asc(modeDashboardWidgets.sortOrder));
}

// ── User Preference ──────────────────────────────────────────────────

export async function findUserModePreference(
  userId: string,
): Promise<UserModePreferenceRow | undefined> {
  const [pref] = await db
    .select()
    .from(userModePreference)
    .where(eq(userModePreference.userId, userId))
    .limit(1);

  return pref;
}

export async function upsertUserModePreference(
  userId: string,
  modeId: string,
): Promise<UserModePreferenceRow> {
  const existing = await findUserModePreference(userId);

  if (!existing) {
    const [created] = await db
      .insert(userModePreference)
      .values({ userId, modeId, activeSince: new Date() })
      .returning();
    return created;
  }

  const [updated] = await db
    .update(userModePreference)
    .set({ modeId, activeSince: new Date() })
    .where(eq(userModePreference.userId, userId))
    .returning();

  return updated;
}
