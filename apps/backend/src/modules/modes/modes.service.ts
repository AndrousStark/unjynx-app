import type {
  IndustryMode,
  ModeVocabularyEntry,
  ModeTemplate,
  ModeDashboardWidget,
} from "../../db/schema/index.js";
import * as modesRepo from "./modes.repository.js";

// ── Response Types ───────────────────────────────────────────────────

export interface ModeDetail {
  readonly mode: IndustryMode;
  readonly vocabulary: readonly ModeVocabularyEntry[];
  readonly templates: readonly ModeTemplate[];
  readonly widgets: readonly ModeDashboardWidget[];
}

export interface ActiveModeResponse {
  readonly mode: IndustryMode;
  readonly vocabulary: Record<string, string>;
  readonly activeSince: Date;
}

// ── Service Functions ────────────────────────────────────────────────

/**
 * Get all active industry modes ordered by sortOrder.
 */
export async function getAllModes(): Promise<readonly IndustryMode[]> {
  return modesRepo.findAllActiveModes();
}

/**
 * Get a mode by slug with full vocabulary, templates, and widgets.
 */
export async function getModeBySlug(
  slug: string,
): Promise<ModeDetail | undefined> {
  const mode = await modesRepo.findModeBySlug(slug);
  if (!mode) return undefined;

  const [vocabulary, templates, widgets] = await Promise.all([
    modesRepo.findVocabularyByModeId(mode.id),
    modesRepo.findTemplatesByModeId(mode.id),
    modesRepo.findWidgetsByModeId(mode.id),
  ]);

  return { mode, vocabulary, templates, widgets };
}

/**
 * Get the user's active mode with vocabulary map.
 * Returns undefined if the user has not set a mode.
 */
export async function getActiveMode(
  userId: string,
): Promise<ActiveModeResponse | undefined> {
  const pref = await modesRepo.findUserModePreference(userId);
  if (!pref || !pref.modeId) return undefined;

  const mode = await modesRepo.findModeById(pref.modeId);
  if (!mode) return undefined;

  const vocabEntries = await modesRepo.findVocabularyByModeId(mode.id);

  // Build a simple { originalTerm: translatedTerm } map
  const vocabulary: Record<string, string> = {};
  for (const entry of vocabEntries) {
    vocabulary[entry.originalTerm] = entry.translatedTerm;
  }

  return {
    mode,
    vocabulary,
    activeSince: pref.activeSince,
  };
}

/**
 * Set (or change) the user's active industry mode.
 * Throws if the slug is invalid or the mode is not active.
 */
export async function setActiveMode(
  userId: string,
  slug: string,
): Promise<ActiveModeResponse> {
  const mode = await modesRepo.findModeBySlug(slug);

  if (!mode) {
    throw new Error(`Mode not found: ${slug}`);
  }

  if (!mode.isActive) {
    throw new Error(`Mode is not active: ${slug}`);
  }

  const pref = await modesRepo.upsertUserModePreference(userId, mode.id);

  const vocabEntries = await modesRepo.findVocabularyByModeId(mode.id);
  const vocabulary: Record<string, string> = {};
  for (const entry of vocabEntries) {
    vocabulary[entry.originalTerm] = entry.translatedTerm;
  }

  return {
    mode,
    vocabulary,
    activeSince: pref.activeSince,
  };
}

/**
 * Get templates for a specific mode by slug.
 */
export async function getModeTemplates(
  slug: string,
): Promise<readonly ModeTemplate[] | undefined> {
  const mode = await modesRepo.findModeBySlug(slug);
  if (!mode) return undefined;

  return modesRepo.findTemplatesByModeId(mode.id);
}
