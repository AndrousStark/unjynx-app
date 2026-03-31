import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { authMiddleware } from "../../middleware/auth.js";
import { tenantMiddleware, requireOrgRole } from "../../middleware/tenant.js";
import { ok, err } from "../../types/api.js";
import * as msgService from "./messaging.service.js";

export const messagingRoutes = new Hono();

messagingRoutes.use("/*", authMiddleware);
messagingRoutes.use("/*", tenantMiddleware);

// ── Schemas ──────────────────────────────────────────────────────────

const createChannelSchema = z.object({
  name: z.string().min(1).max(80),
  description: z.string().max(500).optional(),
  channelType: z.enum(["public", "private"]).default("public"),
  topic: z.string().max(250).optional(),
});

const updateChannelSchema = z.object({
  name: z.string().min(1).max(80).optional(),
  description: z.string().max(500).optional(),
  topic: z.string().max(250).optional(),
});

const sendMessageSchema = z.object({
  content: z.string().min(1).max(10000),
  threadId: z.string().uuid().optional(),
  mentionedUserIds: z.array(z.string().uuid()).max(50).optional(),
  mentionedTeamIds: z.array(z.string().uuid()).max(10).optional(),
  isChannelMention: z.boolean().optional(),
});

const editMessageSchema = z.object({
  content: z.string().min(1).max(10000),
});

const reactionSchema = z.object({
  emoji: z.string().min(1).max(32),
});

const dmSchema = z.object({
  userIds: z.array(z.string().uuid()).min(1).max(8),
});

const searchSchema = z.object({
  q: z.string().min(1).max(200),
  channelId: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

const messagesQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  before: z.string().uuid().optional(),
});

// ── Channel Routes ───────────────────────────────────────────────────

// POST /messaging/channels — Create channel (member+)
messagingRoutes.post(
  "/channels",
  requireOrgRole("member"),
  zValidator("json", createChannelSchema),
  async (c) => {
    const tenant = c.get("tenant");
    const auth = c.get("auth");
    if (!tenant.orgId) return c.json(err("Organization context required"), 400);

    const input = c.req.valid("json");
    try {
      const channel = await msgService.createChannel(tenant.orgId, auth.profileId, input);
      return c.json(ok(channel), 201);
    } catch (e) {
      return c.json(err((e as Error).message), 400);
    }
  },
);

// GET /messaging/channels — List channels
messagingRoutes.get("/channels", async (c) => {
  const tenant = c.get("tenant");
  const auth = c.get("auth");
  if (!tenant.orgId) return c.json(err("Organization context required"), 400);

  const list = await msgService.getChannels(tenant.orgId, auth.profileId);
  return c.json(ok(list));
});

// GET /messaging/channels/:id — Get channel detail
messagingRoutes.get("/channels/:id", async (c) => {
  const channel = await msgService.getChannel(c.req.param("id"));
  if (!channel) return c.json(err("Channel not found"), 404);
  return c.json(ok(channel));
});

// PATCH /messaging/channels/:id — Update channel (admin of channel)
messagingRoutes.patch(
  "/channels/:id",
  zValidator("json", updateChannelSchema),
  async (c) => {
    const input = c.req.valid("json");
    try {
      const channel = await msgService.updateChannel(c.req.param("id"), input);
      return c.json(ok(channel));
    } catch (e) {
      return c.json(err((e as Error).message), 400);
    }
  },
);

// POST /messaging/channels/:id/archive — Archive channel (admin+)
messagingRoutes.post(
  "/channels/:id/archive",
  requireOrgRole("admin"),
  async (c) => {
    try {
      const channel = await msgService.archiveChannel(c.req.param("id"));
      return c.json(ok(channel));
    } catch (e) {
      return c.json(err((e as Error).message), 400);
    }
  },
);

// ── DM Routes ────────────────────────────────────────────────────────

// POST /messaging/dm — Get or create DM channel
messagingRoutes.post(
  "/dm",
  zValidator("json", dmSchema),
  async (c) => {
    const tenant = c.get("tenant");
    const auth = c.get("auth");
    if (!tenant.orgId) return c.json(err("Organization context required"), 400);

    const { userIds } = c.req.valid("json");
    // Always include the current user
    const allUserIds = Array.from(new Set([auth.profileId, ...userIds]));

    const channel = await msgService.getOrCreateDm(tenant.orgId, allUserIds);
    return c.json(ok(channel));
  },
);

// ── Channel Member Routes ────────────────────────────────────────────

// POST /messaging/channels/:id/join — Join a public channel
messagingRoutes.post("/channels/:id/join", async (c) => {
  const tenant = c.get("tenant");
  const auth = c.get("auth");
  if (!tenant.orgId) return c.json(err("Organization context required"), 400);

  const member = await msgService.joinChannel(tenant.orgId, c.req.param("id"), auth.profileId);
  return c.json(ok(member));
});

// POST /messaging/channels/:id/leave — Leave a channel
messagingRoutes.post("/channels/:id/leave", async (c) => {
  const auth = c.get("auth");
  await msgService.leaveChannel(c.req.param("id"), auth.profileId);
  return c.json(ok({ left: true }));
});

// GET /messaging/channels/:id/members — List members
messagingRoutes.get("/channels/:id/members", async (c) => {
  const members = await msgService.getChannelMembers(c.req.param("id"));
  return c.json(ok(members));
});

// ── Message Routes ───────────────────────────────────────────────────

// POST /messaging/channels/:id/messages — Send message
messagingRoutes.post(
  "/channels/:id/messages",
  zValidator("json", sendMessageSchema),
  async (c) => {
    const tenant = c.get("tenant");
    const auth = c.get("auth");
    if (!tenant.orgId) return c.json(err("Organization context required"), 400);

    const input = c.req.valid("json");
    const message = await msgService.sendMessage(
      tenant.orgId,
      c.req.param("id"),
      auth.profileId,
      input,
    );
    return c.json(ok(message), 201);
  },
);

// GET /messaging/channels/:id/messages — List messages (paginated)
messagingRoutes.get(
  "/channels/:id/messages",
  zValidator("query", messagesQuerySchema),
  async (c) => {
    const { limit, before } = c.req.valid("query");
    const list = await msgService.getMessages(c.req.param("id"), { limit, before });
    return c.json(ok(list));
  },
);

// GET /messaging/channels/:id/messages/:msgId/thread — Get thread replies
messagingRoutes.get(
  "/channels/:id/messages/:msgId/thread",
  zValidator("query", messagesQuerySchema),
  async (c) => {
    const { limit, before } = c.req.valid("query");
    const list = await msgService.getMessages(c.req.param("id"), {
      limit,
      before,
      threadId: c.req.param("msgId"),
    });
    return c.json(ok(list));
  },
);

// PATCH /messaging/messages/:id — Edit message (author only)
messagingRoutes.patch(
  "/messages/:id",
  zValidator("json", editMessageSchema),
  async (c) => {
    const auth = c.get("auth");
    const { content } = c.req.valid("json");
    try {
      const msg = await msgService.editMessage(c.req.param("id"), auth.profileId, content);
      return c.json(ok(msg));
    } catch (e) {
      return c.json(err((e as Error).message), 400);
    }
  },
);

// DELETE /messaging/messages/:id — Delete message (author only)
messagingRoutes.delete("/messages/:id", async (c) => {
  const auth = c.get("auth");
  try {
    await msgService.deleteMessage(c.req.param("id"), auth.profileId);
    return c.json(ok({ deleted: true }));
  } catch (e) {
    return c.json(err((e as Error).message), 400);
  }
});

// ── Reaction Routes ──────────────────────────────────────────────────

// POST /messaging/messages/:id/reactions — Add reaction
messagingRoutes.post(
  "/messages/:id/reactions",
  zValidator("json", reactionSchema),
  async (c) => {
    const tenant = c.get("tenant");
    const auth = c.get("auth");
    if (!tenant.orgId) return c.json(err("Organization context required"), 400);

    const { emoji } = c.req.valid("json");
    const reaction = await msgService.addReaction(
      tenant.orgId,
      c.req.param("id"),
      auth.profileId,
      emoji,
    );
    return c.json(ok(reaction), 201);
  },
);

// DELETE /messaging/messages/:id/reactions/:emoji — Remove reaction
messagingRoutes.delete("/messages/:id/reactions/:emoji", async (c) => {
  const auth = c.get("auth");
  await msgService.removeReaction(c.req.param("id"), auth.profileId, c.req.param("emoji"));
  return c.json(ok({ removed: true }));
});

// GET /messaging/messages/:id/reactions — List reactions
messagingRoutes.get("/messages/:id/reactions", async (c) => {
  const reactions = await msgService.getReactions(c.req.param("id"));
  return c.json(ok(reactions));
});

// ── Pin Routes ───────────────────────────────────────────────────────

// POST /messaging/channels/:id/pins — Pin a message
messagingRoutes.post(
  "/channels/:id/pins",
  zValidator("json", z.object({ messageId: z.string().uuid() })),
  async (c) => {
    const tenant = c.get("tenant");
    const auth = c.get("auth");
    if (!tenant.orgId) return c.json(err("Organization context required"), 400);

    const { messageId } = c.req.valid("json");
    const pin = await msgService.pinMessage(
      tenant.orgId,
      c.req.param("id"),
      messageId,
      auth.profileId,
    );
    return c.json(ok(pin), 201);
  },
);

// DELETE /messaging/channels/:id/pins/:messageId — Unpin
messagingRoutes.delete("/channels/:id/pins/:messageId", async (c) => {
  await msgService.unpinMessage(c.req.param("id"), c.req.param("messageId"));
  return c.json(ok({ unpinned: true }));
});

// GET /messaging/channels/:id/pins — List pinned messages
messagingRoutes.get("/channels/:id/pins", async (c) => {
  const pins = await msgService.getPinnedMessages(c.req.param("id"));
  return c.json(ok(pins));
});

// ── Unread & Read Tracking ───────────────────────────────────────────

// POST /messaging/channels/:id/read — Mark channel as read
messagingRoutes.post(
  "/channels/:id/read",
  zValidator("json", z.object({ messageId: z.string().uuid() })),
  async (c) => {
    const auth = c.get("auth");
    const { messageId } = c.req.valid("json");
    await msgService.markAsRead(c.req.param("id"), auth.profileId, messageId);
    return c.json(ok({ read: true }));
  },
);

// GET /messaging/unread — Get unread counts for all channels
messagingRoutes.get("/unread", async (c) => {
  const tenant = c.get("tenant");
  const auth = c.get("auth");
  if (!tenant.orgId) return c.json(err("Organization context required"), 400);

  const counts = await msgService.getUnreadCounts(tenant.orgId, auth.profileId);
  return c.json(ok(counts));
});

// ── Search ───────────────────────────────────────────────────────────

// GET /messaging/search — Full-text search messages
messagingRoutes.get(
  "/search",
  zValidator("query", searchSchema),
  async (c) => {
    const tenant = c.get("tenant");
    if (!tenant.orgId) return c.json(err("Organization context required"), 400);

    const { q, channelId, limit } = c.req.valid("query");
    const results = await msgService.searchMessages(tenant.orgId, q, { channelId, limit });
    return c.json(ok(results));
  },
);
