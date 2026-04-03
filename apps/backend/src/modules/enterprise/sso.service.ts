import { db } from "../../db/index.js";
import { organizations } from "../../db/schema/index.js";
import { eq } from "drizzle-orm";
import { createLogger } from "../../utils/logger.js";

const log = createLogger("sso");

// ── Types ───────────────────────────────────────────────────────────

export interface SsoConfig {
  provider: "saml" | "oidc";
  domain: string;
  metadataUrl?: string;
  entityId?: string;
  oidcIssuer?: string;
  oidcClientId?: string;
}

// ── Configure SSO ───────────────────────────────────────────────────

export async function configureSso(
  orgId: string,
  config: SsoConfig,
): Promise<void> {
  const metadata: Record<string, unknown> = {};

  if (config.provider === "saml") {
    metadata.metadataUrl = config.metadataUrl;
    metadata.entityId = config.entityId ?? `unjynx-${orgId}`;
    metadata.acsUrl = `${process.env.API_BASE_URL ?? "https://api.unjynx.me"}/enterprise/sso/saml/acs`;
  } else {
    metadata.oidcIssuer = config.oidcIssuer;
    metadata.oidcClientId = config.oidcClientId;
  }

  await db.update(organizations)
    .set({
      ssoProvider: config.provider,
      ssoDomain: config.domain.toLowerCase(),
      ssoMetadata: metadata,
      updatedAt: new Date(),
    })
    .where(eq(organizations.id, orgId));

  log.info({ orgId, provider: config.provider, domain: config.domain }, "SSO configured");
}

// ── Domain Verification ─────────────────────────────────────────────

export async function verifyDomain(orgId: string): Promise<void> {
  await db.update(organizations)
    .set({
      ssoDomainVerified: true,
      updatedAt: new Date(),
    })
    .where(eq(organizations.id, orgId));

  log.info({ orgId }, "SSO domain verified");
}

// ── Enforce SSO ─────────────────────────────────────────────────────

export async function enforceSso(
  orgId: string,
  enforce: boolean,
): Promise<void> {
  await db.update(organizations)
    .set({
      ssoEnforced: enforce,
      updatedAt: new Date(),
    })
    .where(eq(organizations.id, orgId));

  log.info({ orgId, enforce }, "SSO enforcement updated");
}

// ── Check if user must use SSO ──────────────────────────────────────

export async function mustUseSso(email: string): Promise<{
  required: boolean;
  orgId?: string;
  provider?: string;
}> {
  const domain = email.split("@")[1]?.toLowerCase();
  if (!domain) return { required: false };

  const [org] = await db.select()
    .from(organizations)
    .where(eq(organizations.ssoDomain, domain))
    .limit(1);

  if (org && org.ssoEnforced && org.ssoDomainVerified && org.ssoProvider) {
    return {
      required: true,
      orgId: org.id,
      provider: org.ssoProvider,
    };
  }

  return { required: false };
}

// ── Get SSO Config ──────────────────────────────────────────────────

export async function getSsoConfig(orgId: string): Promise<{
  provider: string | null;
  domain: string | null;
  domainVerified: boolean;
  enforced: boolean;
  metadata: Record<string, unknown>;
} | null> {
  const [org] = await db.select({
    ssoProvider: organizations.ssoProvider,
    ssoDomain: organizations.ssoDomain,
    ssoDomainVerified: organizations.ssoDomainVerified,
    ssoEnforced: organizations.ssoEnforced,
    ssoMetadata: organizations.ssoMetadata,
  })
    .from(organizations)
    .where(eq(organizations.id, orgId))
    .limit(1);

  if (!org) return null;

  return {
    provider: org.ssoProvider,
    domain: org.ssoDomain,
    domainVerified: org.ssoDomainVerified,
    enforced: org.ssoEnforced,
    metadata: (org.ssoMetadata as Record<string, unknown>) ?? {},
  };
}
