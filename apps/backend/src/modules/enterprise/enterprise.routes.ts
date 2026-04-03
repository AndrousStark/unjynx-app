import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { authMiddleware } from "../../middleware/auth.js";
import { tenantMiddleware, requireOrgRole } from "../../middleware/tenant.js";
import { ok, err } from "../../types/api.js";
import * as ssoService from "./sso.service.js";
import * as scimService from "./scim.service.js";

export const enterpriseRoutes = new Hono();

// ── SSO Configuration (org admin+) ─────────────────────────────────

enterpriseRoutes.use("/sso/*", authMiddleware, tenantMiddleware);

// GET /enterprise/sso/config — Get SSO configuration
enterpriseRoutes.get("/sso/config", async (c) => {
  const tenant = c.get("tenant");
  const config = await ssoService.getSsoConfig(tenant.orgId);
  return c.json(ok(config));
});

// POST /enterprise/sso/configure — Set up SSO
const configureSsoSchema = z.object({
  provider: z.enum(["saml", "oidc"]),
  domain: z.string().min(3).max(255),
  metadataUrl: z.string().url().optional(),
  entityId: z.string().optional(),
  oidcIssuer: z.string().url().optional(),
  oidcClientId: z.string().optional(),
});

enterpriseRoutes.post(
  "/sso/configure",
  requireOrgRole("admin"),
  zValidator("json", configureSsoSchema),
  async (c) => {
    const tenant = c.get("tenant");
    const input = c.req.valid("json");

    try {
      await ssoService.configureSso(tenant.orgId, input);
      return c.json(ok({ configured: true }));
    } catch (e) {
      return c.json(err((e as Error).message), 400);
    }
  },
);

// POST /enterprise/sso/verify-domain — Verify domain ownership
enterpriseRoutes.post(
  "/sso/verify-domain",
  requireOrgRole("admin"),
  async (c) => {
    const tenant = c.get("tenant");

    try {
      await ssoService.verifyDomain(tenant.orgId);
      return c.json(ok({ verified: true }));
    } catch (e) {
      return c.json(err((e as Error).message), 400);
    }
  },
);

// POST /enterprise/sso/enforce — Toggle SSO enforcement
const enforceSsoSchema = z.object({
  enforce: z.boolean(),
});

enterpriseRoutes.post(
  "/sso/enforce",
  requireOrgRole("owner"),
  zValidator("json", enforceSsoSchema),
  async (c) => {
    const tenant = c.get("tenant");
    const { enforce } = c.req.valid("json");

    try {
      await ssoService.enforceSso(tenant.orgId, enforce);
      return c.json(ok({ enforced: enforce }));
    } catch (e) {
      return c.json(err((e as Error).message), 400);
    }
  },
);

// POST /enterprise/sso/check — Check if email requires SSO
const checkSsoSchema = z.object({
  email: z.string().email(),
});

enterpriseRoutes.post(
  "/sso/check",
  zValidator("json", checkSsoSchema),
  async (c) => {
    const { email } = c.req.valid("json");
    const result = await ssoService.mustUseSso(email);
    return c.json(ok(result));
  },
);

// ── SCIM 2.0 Provisioning ──────────────────────────────────────────

// POST /enterprise/scim/enable — Generate SCIM token
enterpriseRoutes.post(
  "/scim/enable",
  authMiddleware,
  tenantMiddleware,
  requireOrgRole("owner"),
  async (c) => {
    const tenant = c.get("tenant");

    try {
      const token = await scimService.generateScimToken(tenant.orgId);
      // Token shown only once — never stored in plain text
      return c.json(ok({ token, baseUrl: `${process.env.API_BASE_URL ?? "https://api.unjynx.me"}/enterprise/scim/v2` }), 201);
    } catch (e) {
      return c.json(err((e as Error).message), 500);
    }
  },
);

// POST /enterprise/scim/disable — Disable SCIM
enterpriseRoutes.post(
  "/scim/disable",
  authMiddleware,
  tenantMiddleware,
  requireOrgRole("owner"),
  async (c) => {
    const tenant = c.get("tenant");
    await scimService.disableScim(tenant.orgId);
    return c.json(ok({ disabled: true }));
  },
);

// ── SCIM 2.0 RFC 7644 Endpoints (Bearer token auth) ────────────────

// Middleware: validate SCIM bearer token
const scimAuth = async (c: any, next: () => Promise<void>) => {
  const authHeader = c.req.header("authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "");

  if (!token) {
    return c.json({ schemas: ["urn:ietf:params:scim:api:messages:2.0:Error"], detail: "Missing bearer token", status: "401" }, 401);
  }

  const orgId = await scimService.validateScimToken(token);
  if (!orgId) {
    return c.json({ schemas: ["urn:ietf:params:scim:api:messages:2.0:Error"], detail: "Invalid token", status: "401" }, 401);
  }

  c.set("scimOrgId", orgId);
  await next();
};

// GET /enterprise/scim/v2/ServiceProviderConfig
enterpriseRoutes.get("/scim/v2/ServiceProviderConfig", scimAuth, (c) => {
  return c.json({
    schemas: ["urn:ietf:params:scim:schemas:core:2.0:ServiceProviderConfig"],
    documentationUri: "https://docs.unjynx.me/scim",
    patch: { supported: false },
    bulk: { supported: false, maxOperations: 0, maxPayloadSize: 0 },
    filter: { supported: false, maxResults: 100 },
    changePassword: { supported: false },
    sort: { supported: false },
    etag: { supported: false },
    authenticationSchemes: [{
      type: "oauthbearertoken",
      name: "OAuth Bearer Token",
      description: "SCIM bearer token authentication",
    }],
  });
});

// GET /enterprise/scim/v2/Users — List users
enterpriseRoutes.get("/scim/v2/Users", scimAuth, async (c) => {
  const orgId = c.get("scimOrgId") as string;
  const startIndex = parseInt(c.req.query("startIndex") ?? "1", 10);
  const count = parseInt(c.req.query("count") ?? "100", 10);

  const result = await scimService.listUsers(orgId, startIndex, count);

  return c.json({
    schemas: ["urn:ietf:params:scim:api:messages:2.0:ListResponse"],
    totalResults: result.totalResults,
    startIndex,
    itemsPerPage: count,
    Resources: result.Resources,
  });
});

// GET /enterprise/scim/v2/Users/:id — Get single user
enterpriseRoutes.get("/scim/v2/Users/:id", scimAuth, async (c) => {
  const orgId = c.get("scimOrgId") as string;
  const userId = c.req.param("id");
  const user = await scimService.getUser(orgId, userId);

  if (!user) {
    return c.json({
      schemas: ["urn:ietf:params:scim:api:messages:2.0:Error"],
      detail: "User not found",
      status: "404",
    }, 404);
  }

  return c.json(user);
});

// DELETE /enterprise/scim/v2/Users/:id — Deactivate user
enterpriseRoutes.delete("/scim/v2/Users/:id", scimAuth, async (c) => {
  const orgId = c.get("scimOrgId") as string;
  const userId = c.req.param("id");
  await scimService.deactivateUser(orgId, userId);
  return c.body(null, 204);
});
