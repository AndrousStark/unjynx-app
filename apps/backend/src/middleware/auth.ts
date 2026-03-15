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
): Promise<string> {
  const cached = profileCache.get(logtoId);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.profileId;
  }

  // Upsert ensures the profile always exists
  const profile = await upsertProfile({ logtoId, email, name });
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

  try {
    const { payload } = await jose.jwtVerify(token, getJwks(), {
      issuer: `${env.LOGTO_ENDPOINT}/oidc`,
    });
    sub = payload.sub!;
    email = payload.email as string | undefined;
    name = payload.name as string | undefined;
  } catch (err) {
    console.error("[auth] JWT verify failed:", (err as Error).message, "| code:", (err as { code?: string }).code);
    throw new HTTPException(401, { message: "Invalid or expired token" });
  }

  // Resolve logtoId -> profileId (cached, upserts on first encounter)
  const profileId = await resolveProfileId(sub, email, name);

  c.set("auth", { sub, profileId, email, name });

  await next();
});
