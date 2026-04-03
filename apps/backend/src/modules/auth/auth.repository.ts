import { eq, sql } from "drizzle-orm";
import { db } from "../../db/index.js";
import { profiles, type Profile } from "../../db/schema/index.js";

interface UpsertProfileInput {
  readonly logtoId: string;
  readonly email?: string;
  readonly name?: string;
  readonly picture?: string;
}

export async function upsertProfile(
  input: UpsertProfileInput,
): Promise<Profile> {
  const [profile] = await db
    .insert(profiles)
    .values({
      logtoId: input.logtoId,
      email: input.email,
      name: input.name,
      // Seed avatarUrl from social provider picture on first insert only.
      avatarUrl: input.picture ?? undefined,
    })
    .onConflictDoUpdate({
      target: profiles.logtoId,
      set: {
        email: input.email,
        name: input.name,
        // Do NOT overwrite avatarUrl on subsequent logins —
        // manual uploads take precedence over social provider pictures.
        updatedAt: new Date(),
      },
    })
    .returning();

  return profile;
}

export async function findProfileByLogtoId(
  logtoId: string,
): Promise<Profile | undefined> {
  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.logtoId, logtoId));

  return profile;
}

export async function findProfileById(
  id: string,
): Promise<Profile | undefined> {
  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, id));

  return profile;
}

/**
 * Update the last logout timestamp for audit trail.
 */
export async function updateLastLogout(logtoId: string): Promise<void> {
  await db
    .update(profiles)
    .set({ updatedAt: new Date() })
    .where(eq(profiles.logtoId, logtoId));
}

/**
 * Mark a user's email as verified in the profiles table.
 * Sets emailVerified = true and emailVerifiedAt = now.
 */
export async function markEmailVerified(
  profileId: string,
): Promise<Profile | undefined> {
  const [updated] = await db
    .update(profiles)
    .set({
      emailVerified: true,
      emailVerifiedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(profiles.id, profileId))
    .returning();

  return updated;
}

// ── Direct Auth Queries ──────────────────────────────────────────────

/**
 * Find a profile by its email address.
 */
export async function findProfileByEmail(
  email: string,
): Promise<Profile | undefined> {
  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.email, email));

  return profile;
}

/**
 * Find a profile by its Google ID.
 */
export async function findProfileByGoogleId(
  googleId: string,
): Promise<Profile | undefined> {
  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.googleId, googleId));

  return profile;
}

/**
 * Create or update a profile from a social login (Google, Apple).
 *
 * Uses email as the conflict key — if a profile with the same email
 * already exists, we link the googleId and update the name/avatar
 * (only if they are currently null, to preserve manual edits).
 */
export async function upsertProfileFromSocial(input: {
  readonly logtoId: string;
  readonly email: string;
  readonly name?: string;
  readonly googleId?: string;
  readonly avatarUrl?: string;
}): Promise<Profile> {
  const [profile] = await db
    .insert(profiles)
    .values({
      logtoId: input.logtoId,
      email: input.email,
      name: input.name,
      googleId: input.googleId ?? undefined,
      avatarUrl: input.avatarUrl ?? undefined,
      emailVerified: true,
      emailVerifiedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: profiles.email,
      set: {
        logtoId: input.logtoId,
        googleId: input.googleId
          ? sql`COALESCE(${profiles.googleId}, ${input.googleId})`
          : undefined,
        // Only set name if currently null (preserve manual edits)
        name: input.name
          ? sql`COALESCE(${profiles.name}, ${input.name})`
          : undefined,
        // Only set avatar if currently null
        avatarUrl: input.avatarUrl
          ? sql`COALESCE(${profiles.avatarUrl}, ${input.avatarUrl})`
          : undefined,
        emailVerified: true,
        emailVerifiedAt: new Date(),
        updatedAt: new Date(),
      },
    })
    .returning();

  return profile;
}
