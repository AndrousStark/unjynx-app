import { eq } from "drizzle-orm";
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
