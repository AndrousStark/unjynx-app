import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import * as jose from "jose";
import { env } from "../env.js";
import { upsertProfile } from "../modules/auth/auth.repository.js";

interface AuthPayload {
  readonly sub: string;
  readonly profileId: string;
  readonly email?: string;
  readonly name?: string;
}

declare module "hono" {
  interface ContextVariableMap {
    auth: AuthPayload;
  }
}

let jwks: ReturnType<typeof jose.createRemoteJWKSet>;

function getJwks() {
  if (!jwks) {
    const jwksUrl = new URL("/oidc/jwks", env.LOGTO_ENDPOINT);
    jwks = jose.createRemoteJWKSet(jwksUrl);
  }
  return jwks;
}

// In-memory cache: logtoId -> { profileId, expiresAt }
const profileCache = new Map<
  string,
  { profileId: string; expiresAt: number }
>();
const CACHE_TTL_MS = 5 * 60_000; // 5 minutes

async function resolveProfileId(
  logtoId: string,
  email?: string,
  name?: string,
  picture?: string,
): Promise<string> {
  const cached = profileCache.get(logtoId);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.profileId;
  }

  // Upsert ensures the profile always exists.
  // On first login, picture (from Google/social sign-in) seeds avatarUrl.
  const profile = await upsertProfile({ logtoId, email, name, picture });
  profileCache.set(logtoId, {
    profileId: profile.id,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });

  return profile.id;
}

export const authMiddleware = createMiddleware(async (c, next) => {
  const authHeader = c.req.header("Authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    throw new HTTPException(401, { message: "Missing or invalid token" });
  }

  const token = authHeader.slice(7);

  let sub: string;
  let email: string | undefined;
  let name: string | undefined;
  let picture: string | undefined;

  try {
    const { payload } = await jose.jwtVerify(token, getJwks(), {
      issuer: `${env.LOGTO_ENDPOINT}/oidc`,
      // Audience validation: Logto tokens include the app ID as audience.
      // If LOGTO_APP_ID is configured, enforce it; otherwise skip
      // (backward compat for dev environments without the env var).
      audience: env.LOGTO_APP_ID || undefined,
    });
    sub = payload.sub!;
    email = payload.email as string | undefined;
    name = payload.name as string | undefined;
    picture = payload.picture as string | undefined;
  } catch (err) {
    const errorMessage = (err as Error).message;
    const errorCode = (err as { code?: string }).code;
    // Log minimal info — never log the token itself
    console.error("[auth] JWT verify failed:", errorMessage, "| code:", errorCode);
    throw new HTTPException(401, { message: "Invalid or expired token" });
  }

  // Resolve logtoId -> profileId (cached, upserts on first encounter)
  const profileId = await resolveProfileId(sub, email, name, picture);

  c.set("auth", { sub, profileId, email, name });

  await next();
});
