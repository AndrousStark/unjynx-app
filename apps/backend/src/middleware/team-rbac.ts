import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import { eq, and } from "drizzle-orm";
import { db } from "../db/index.js";
import { teamMembers } from "../db/schema/index.js";

type TeamRole = "owner" | "admin" | "member" | "viewer";

/**
 * Middleware that restricts access to team routes based on the user's team role.
 * Requires `teamId` as a route parameter and auth middleware to have run first.
 */
export function teamRole(...allowedRoles: TeamRole[]) {
  return createMiddleware(async (c, next) => {
    const teamId = c.req.param("teamId");
    const userId = c.get("auth").profileId;

    if (!teamId) {
      throw new HTTPException(400, { message: "teamId parameter is required" });
    }

    const [member] = await db
      .select({ role: teamMembers.role, status: teamMembers.status })
      .from(teamMembers)
      .where(
        and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, userId)),
      )
      .limit(1);

    if (!member) {
      throw new HTTPException(403, {
        message: "You are not a member of this team",
      });
    }

    if (member.status !== "active") {
      throw new HTTPException(403, {
        message: "Your team membership is not active",
      });
    }

    if (!allowedRoles.includes(member.role as TeamRole)) {
      throw new HTTPException(403, {
        message: `This action requires one of: ${allowedRoles.join(", ")}. Your role: ${member.role}`,
      });
    }

    await next();
  });
}
