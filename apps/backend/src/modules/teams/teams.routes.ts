import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { authMiddleware } from "../../middleware/auth.js";
import { teamRole } from "../../middleware/team-rbac.js";
import { ok, err } from "../../types/api.js";
import {
  createTeamSchema,
  updateTeamSchema,
  inviteMemberSchema,
  updateMemberRoleSchema,
  submitStandupSchema,
  standupQuerySchema,
  teamReportsQuerySchema,
} from "./teams.schema.js";
import * as teamService from "./teams.service.js";

export const teamRoutes = new Hono();

teamRoutes.use("/*", authMiddleware);

// POST /teams - Create team
teamRoutes.post(
  "/",
  zValidator("json", createTeamSchema),
  async (c) => {
    const auth = c.get("auth");
    const input = c.req.valid("json");
    const team = await teamService.createTeam(auth.profileId, input);
    return c.json(ok(team), 201);
  },
);

// GET /teams/:teamId - Get team details
teamRoutes.get("/:teamId", async (c) => {
  const teamId = c.req.param("teamId");
  const team = await teamService.getTeam(teamId);

  if (!team) {
    return c.json(err("Team not found"), 404);
  }

  return c.json(ok(team));
});

// PATCH /teams/:teamId - Update team (owner/admin only)
teamRoutes.patch(
  "/:teamId",
  teamRole("owner", "admin"),
  zValidator("json", updateTeamSchema),
  async (c) => {
    const teamId = c.req.param("teamId");
    const input = c.req.valid("json");
    const team = await teamService.updateTeam(teamId, input);

    if (!team) {
      return c.json(err("Team not found"), 404);
    }

    return c.json(ok(team));
  },
);

// GET /teams/:teamId/members - List members
teamRoutes.get("/:teamId/members", async (c) => {
  const teamId = c.req.param("teamId");
  const members = await teamService.getMembers(teamId);
  return c.json(ok(members));
});

// POST /teams/:teamId/invite - Invite member (admin+)
teamRoutes.post(
  "/:teamId/invite",
  teamRole("owner", "admin"),
  zValidator("json", inviteMemberSchema),
  async (c) => {
    const auth = c.get("auth");
    const teamId = c.req.param("teamId");
    const input = c.req.valid("json");

    try {
      const invite = await teamService.inviteMember(
        teamId,
        auth.profileId,
        input,
      );
      return c.json(ok(invite), 201);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to invite member";
      return c.json(err(message), 400);
    }
  },
);

// PATCH /teams/:teamId/members/:userId - Update role (admin+)
teamRoutes.patch(
  "/:teamId/members/:userId",
  teamRole("owner", "admin"),
  zValidator("json", updateMemberRoleSchema),
  async (c) => {
    const teamId = c.req.param("teamId");
    const userId = c.req.param("userId");
    const { role } = c.req.valid("json");

    try {
      const member = await teamService.updateMemberRole(teamId, userId, role);

      if (!member) {
        return c.json(err("Member not found"), 404);
      }

      return c.json(ok(member));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update role";
      return c.json(err(message), 400);
    }
  },
);

// DELETE /teams/:teamId/members/:userId - Remove member (admin+)
teamRoutes.delete(
  "/:teamId/members/:userId",
  teamRole("owner", "admin"),
  async (c) => {
    const teamId = c.req.param("teamId");
    const userId = c.req.param("userId");

    try {
      const deleted = await teamService.removeMember(teamId, userId);

      if (!deleted) {
        return c.json(err("Member not found"), 404);
      }

      return c.json(ok({ deleted: true }));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to remove member";
      return c.json(err(message), 400);
    }
  },
);

// GET /teams/:teamId/reports - Team reports
teamRoutes.get(
  "/:teamId/reports",
  zValidator("query", teamReportsQuerySchema),
  async (c) => {
    const teamId = c.req.param("teamId");
    const query = c.req.valid("query");
    const report = await teamService.getTeamReport(teamId, query);
    return c.json(ok(report));
  },
);

// GET /teams/:teamId/standups - Get standups
teamRoutes.get(
  "/:teamId/standups",
  zValidator("query", standupQuerySchema),
  async (c) => {
    const teamId = c.req.param("teamId");
    const query = c.req.valid("query");
    const standupList = await teamService.getStandups(
      teamId,
      query.date,
      query.limit,
    );
    return c.json(ok(standupList));
  },
);

// POST /teams/:teamId/standups - Submit standup
teamRoutes.post(
  "/:teamId/standups",
  zValidator("json", submitStandupSchema),
  async (c) => {
    const auth = c.get("auth");
    const teamId = c.req.param("teamId");
    const input = c.req.valid("json");
    const standup = await teamService.submitStandup(
      teamId,
      auth.profileId,
      input,
    );
    return c.json(ok(standup), 201);
  },
);
