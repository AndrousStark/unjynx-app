import { eq } from "drizzle-orm";
import { db } from "../../db/index.js";
import { profiles, type Profile } from "../../db/schema/index.js";

interface UpsertProfileInput {
  readonly logtoId: string;
  readonly email?: string;
  readonly name?: string;
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
    })
    .onConflictDoUpdate({
      target: profiles.logtoId,
      set: {
        email: input.email,
        name: input.name,
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
