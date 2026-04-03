import * as jose from "jose";
import type { CryptoKey } from "jose";
import { env } from "../../env.js";
import { logger } from "../../middleware/logger.js";

const log = logger.child({ module: "jwt" });

const ACCESS_TOKEN_TTL = "15m";
const REFRESH_TOKEN_BYTES = 32;
const ISSUER = "unjynx";

// ── Key Management ────────────────────────────────────────────────

let privateKey: CryptoKey | Uint8Array | null = null;
let publicKey: CryptoKey | Uint8Array | null = null;

async function getPrivateKey(): Promise<CryptoKey | Uint8Array> {
  if (privateKey) return privateKey;

  if (!env.JWT_PRIVATE_KEY) {
    // Dev fallback: use HS256 with JWT_SECRET
    log.warn("JWT_PRIVATE_KEY not set — falling back to HS256 with JWT_SECRET (dev only)");
    privateKey = new TextEncoder().encode(env.JWT_SECRET);
    return privateKey;
  }

  privateKey = await jose.importPKCS8(env.JWT_PRIVATE_KEY, "RS256");
  return privateKey;
}

async function getPublicKey(): Promise<CryptoKey | Uint8Array> {
  if (publicKey) return publicKey;

  if (!env.JWT_PUBLIC_KEY) {
    // Dev fallback: use HS256 with JWT_SECRET
    log.warn("JWT_PUBLIC_KEY not set — falling back to HS256 with JWT_SECRET (dev only)");
    publicKey = new TextEncoder().encode(env.JWT_SECRET);
    return publicKey;
  }

  publicKey = await jose.importSPKI(env.JWT_PUBLIC_KEY, "RS256");
  return publicKey;
}

function getAlgorithm(): string {
  return env.JWT_PRIVATE_KEY ? "RS256" : "HS256";
}

// ── Token Operations ──────────────────────────────────────────────

interface TokenPayload {
  readonly profileId: string;
  readonly email?: string;
  readonly name?: string;
  readonly role: string;
  readonly emailVerified?: boolean;
}

export async function signAccessToken(payload: TokenPayload): Promise<string> {
  const key = await getPrivateKey();
  const alg = getAlgorithm();

  return new jose.SignJWT({
    email: payload.email,
    name: payload.name,
    role: payload.role,
    email_verified: payload.emailVerified,
  })
    .setProtectedHeader({ alg })
    .setSubject(payload.profileId)
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_TTL)
    .setIssuer(ISSUER)
    .sign(key);
}

export interface AccessTokenClaims {
  readonly sub: string;
  readonly email?: string;
  readonly name?: string;
  readonly role: string;
  readonly email_verified?: boolean;
}

export async function verifyAccessToken(
  token: string,
): Promise<AccessTokenClaims> {
  const key = await getPublicKey();

  const { payload } = await jose.jwtVerify(token, key, {
    issuer: ISSUER,
  });

  return {
    sub: payload.sub!,
    email: payload.email as string | undefined,
    name: payload.name as string | undefined,
    role: (payload.role as string) ?? "member",
    email_verified: payload.email_verified as boolean | undefined,
  };
}

// ── Refresh Token ─────────────────────────────────────────────────

export function generateRefreshToken(): string {
  const bytes = new Uint8Array(REFRESH_TOKEN_BYTES);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// ── Dev Key Generation Helper ─────────────────────────────────────

/**
 * Generate an RS256 keypair for development.
 * Call this once and set the output as JWT_PRIVATE_KEY / JWT_PUBLIC_KEY.
 */
export async function generateDevKeypair(): Promise<{
  privateKey: string;
  publicKey: string;
}> {
  const { privateKey: priv, publicKey: pub } = await jose.generateKeyPair("RS256");
  const privateKeyPem = await jose.exportPKCS8(priv);
  const publicKeyPem = await jose.exportSPKI(pub);
  return { privateKey: privateKeyPem, publicKey: publicKeyPem };
}
