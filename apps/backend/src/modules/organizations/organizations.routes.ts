import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { authMiddleware } from "../../middleware/auth.js";
import { tenantMiddleware, requireOrgRole } from "../../middleware/tenant.js";
import { ok, err } from "../../types/api.js";
import {
  createOrgSchema,
  updateOrgSchema,
  inviteToOrgSchema,
  updateOrgMemberSchema,
  orgIdParamSchema,
  memberIdParamSchema,
} from "./organizations.schema.js";
import * as orgService from "./organizations.service.js";
import * as gdprService from "./gdpr.service.js";

export const organizationRoutes = new Hono();

organizationRoutes.use("/*", authMiddleware);

// ── Organization CRUD ────────────────────────────────────────────────

// POST /orgs — Create a new organization
organizationRoutes.post(
  "/",
  zValidator("json", createOrgSchema),
  async (c) => {
    const auth = c.get("auth");
    const input = c.req.valid("json");

    try {
      const org = await orgService.createOrg(auth.profileId, input);
      return c.json(ok(org), 201);
    } catch (e) {
      return c.json(err((e as Error).message), 400);
    }
  },
);

// GET /orgs — List user's organizations
organizationRoutes.get("/", async (c) => {
  const auth = c.get("auth");
  const orgs = await orgService.getUserOrgs(auth.profileId);
  return c.json(ok(orgs));
});

// GET /orgs/:orgId — Get organization details
organizationRoutes.get(
  "/:orgId",
  zValidator("param", orgIdParamSchema),
  tenantMiddleware,
  async (c) => {
    const { orgId } = c.req.valid("param");
    const org = await orgService.getOrg(orgId);
    if (!org) return c.json(err("Organization not found"), 404);
    return c.json(ok(org));
  },
);

// PATCH /orgs/:orgId — Update organization (admin+)
organizationRoutes.patch(
  "/:orgId",
  zValidator("param", orgIdParamSchema),
  zValidator("json", updateOrgSchema),
  tenantMiddleware,
  requireOrgRole("admin"),
  async (c) => {
    const { orgId } = c.req.valid("param");
    const input = c.req.valid("json");

    try {
      const org = await orgService.updateOrg(orgId, input);
      return c.json(ok(org));
    } catch (e) {
      return c.json(err((e as Error).message), 400);
    }
  },
);

// DELETE /orgs/:orgId — Delete organization (owner only)
organizationRoutes.delete(
  "/:orgId",
  zValidator("param", orgIdParamSchema),
  tenantMiddleware,
  requireOrgRole("owner"),
  async (c) => {
    const auth = c.get("auth");
    const { orgId } = c.req.valid("param");

    try {
      await orgService.deleteOrg(orgId, auth.profileId);
      return c.json(ok({ deleted: true }));
    } catch (e) {
      return c.json(err((e as Error).message), 400);
    }
  },
);

// ── Member Management ────────────────────────────────────────────────

// GET /orgs/:orgId/members — List org members (member+)
organizationRoutes.get(
  "/:orgId/members",
  zValidator("param", orgIdParamSchema),
  tenantMiddleware,
  requireOrgRole("viewer"),
  async (c) => {
    const { orgId } = c.req.valid("param");
    const members = await orgService.getMembers(orgId);
    return c.json(ok(members));
  },
);

// POST /orgs/:orgId/invite — Invite a member (admin+)
organizationRoutes.post(
  "/:orgId/invite",
  zValidator("param", orgIdParamSchema),
  zValidator("json", inviteToOrgSchema),
  tenantMiddleware,
  requireOrgRole("admin"),
  async (c) => {
    const auth = c.get("auth");
    const { orgId } = c.req.valid("param");
    const input = c.req.valid("json");

    try {
      const invite = await orgService.inviteMember(orgId, auth.profileId, input);
      return c.json(ok(invite), 201);
    } catch (e) {
      return c.json(err((e as Error).message), 400);
    }
  },
);

// GET /orgs/:orgId/invites — List pending invites (admin+)
organizationRoutes.get(
  "/:orgId/invites",
  zValidator("param", orgIdParamSchema),
  tenantMiddleware,
  requireOrgRole("admin"),
  async (c) => {
    const { orgId } = c.req.valid("param");
    const invites = await orgService.getPendingInvites(orgId);
    return c.json(ok(invites));
  },
);

// PATCH /orgs/:orgId/members/:userId — Update member role (admin+)
organizationRoutes.patch(
  "/:orgId/members/:userId",
  zValidator("param", memberIdParamSchema),
  zValidator("json", updateOrgMemberSchema),
  tenantMiddleware,
  requireOrgRole("admin"),
  async (c) => {
    const auth = c.get("auth");
    const { orgId, userId } = c.req.valid("param");
    const input = c.req.valid("json");

    try {
      const member = await orgService.updateMemberRole(orgId, userId, auth.profileId, input);
      return c.json(ok(member));
    } catch (e) {
      return c.json(err((e as Error).message), 400);
    }
  },
);

// DELETE /orgs/:orgId/members/:userId — Remove member (admin+)
organizationRoutes.delete(
  "/:orgId/members/:userId",
  zValidator("param", memberIdParamSchema),
  tenantMiddleware,
  requireOrgRole("admin"),
  async (c) => {
    const auth = c.get("auth");
    const { orgId, userId } = c.req.valid("param");

    try {
      await orgService.removeMember(orgId, userId, auth.profileId);
      return c.json(ok({ removed: true }));
    } catch (e) {
      return c.json(err((e as Error).message), 400);
    }
  },
);

// POST /orgs/:orgId/leave — Leave an organization
organizationRoutes.post(
  "/:orgId/leave",
  zValidator("param", orgIdParamSchema),
  tenantMiddleware,
  async (c) => {
    const auth = c.get("auth");
    const { orgId } = c.req.valid("param");

    try {
      await orgService.leaveOrg(orgId, auth.profileId);
      return c.json(ok({ left: true }));
    } catch (e) {
      return c.json(err((e as Error).message), 400);
    }
  },
);

// ── Invite Acceptance (no org auth needed — uses invite code) ────────

import { z } from "zod";

const acceptInviteSchema = z.object({
  inviteCode: z.string().min(1).max(64),
});

// POST /orgs/accept-invite — Accept an invite via code
organizationRoutes.post(
  "/accept-invite",
  zValidator("json", acceptInviteSchema),
  async (c) => {
    const auth = c.get("auth");
    const { inviteCode } = c.req.valid("json");

    try {
      const member = await orgService.acceptInvite(inviteCode, auth.profileId);
      return c.json(ok(member), 201);
    } catch (e) {
      return c.json(err((e as Error).message), 400);
    }
  },
);

// ── GDPR Data Export & Deletion ──────────────────────────────────────

// GET /orgs/:orgId/export — Export all org data (owner only)
organizationRoutes.get(
  "/:orgId/export",
  zValidator("param", orgIdParamSchema),
  tenantMiddleware,
  requireOrgRole("owner"),
  async (c) => {
    const { orgId } = c.req.valid("param");
    try {
      const data = await gdprService.exportOrgData(orgId);
      return c.json(ok(data));
    } catch (e) {
      return c.json(err((e as Error).message), 400);
    }
  },
);

// DELETE /orgs/:orgId/data — Permanently delete all org data (owner only, GDPR erasure)
organizationRoutes.delete(
  "/:orgId/data",
  zValidator("param", orgIdParamSchema),
  tenantMiddleware,
  requireOrgRole("owner"),
  async (c) => {
    const { orgId } = c.req.valid("param");
    try {
      const result = await gdprService.deleteOrgData(orgId);
      return c.json(ok(result));
    } catch (e) {
      return c.json(err((e as Error).message), 400);
    }
  },
);
