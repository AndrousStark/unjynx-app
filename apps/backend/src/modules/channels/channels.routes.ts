import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { authMiddleware } from "../../middleware/auth.js";
import { ok, err } from "../../types/api.js";
import {
  connectPushSchema,
  connectEmailSchema,
  connectTelegramSchema,
  connectPhoneSchema,
  connectInstagramSchema,
} from "./channels.schema.js";
import * as channelService from "./channels.service.js";
import { ChannelError } from "./channels.service.js";

export const channelRoutes = new Hono();

channelRoutes.use("/*", authMiddleware);

// ── GET / — List all channels for user ───────────────────────────────
channelRoutes.get("/", async (c) => {
  const auth = c.get("auth");
  const channels = await channelService.getChannels(auth.profileId);

  return c.json(ok(channels));
});

// ── POST /:type/connect — Connect a channel ─────────────────────────
channelRoutes.post(
  "/push/connect",
  zValidator("json", connectPushSchema),
  async (c) => {
    const auth = c.get("auth");
    const { token } = c.req.valid("json");

    try {
      const channel = await channelService.connectChannel(
        auth.profileId,
        "push",
        token,
      );
      return c.json(ok(channel), 201);
    } catch (error) {
      if (error instanceof ChannelError) {
        return c.json(err(error.message), 400);
      }
      throw error;
    }
  },
);

channelRoutes.post(
  "/telegram/connect",
  zValidator("json", connectTelegramSchema),
  async (c) => {
    const auth = c.get("auth");
    const { token } = c.req.valid("json");

    try {
      const channel = await channelService.connectChannel(
        auth.profileId,
        "telegram",
        token,
      );
      return c.json(ok(channel), 201);
    } catch (error) {
      if (error instanceof ChannelError) {
        return c.json(err(error.message), 400);
      }
      throw error;
    }
  },
);

channelRoutes.post(
  "/email/connect",
  zValidator("json", connectEmailSchema),
  async (c) => {
    const auth = c.get("auth");
    const { email } = c.req.valid("json");

    try {
      const channel = await channelService.connectChannel(
        auth.profileId,
        "email",
        email,
      );
      return c.json(ok(channel), 201);
    } catch (error) {
      if (error instanceof ChannelError) {
        return c.json(err(error.message), 400);
      }
      throw error;
    }
  },
);

channelRoutes.post(
  "/whatsapp/connect",
  zValidator("json", connectPhoneSchema),
  async (c) => {
    const auth = c.get("auth");
    const { phoneNumber, countryCode } = c.req.valid("json");
    const identifier = `${countryCode}${phoneNumber}`;

    try {
      const channel = await channelService.connectChannel(
        auth.profileId,
        "whatsapp",
        identifier,
        JSON.stringify({ phoneNumber, countryCode }),
      );
      return c.json(ok(channel), 201);
    } catch (error) {
      if (error instanceof ChannelError) {
        return c.json(err(error.message), 400);
      }
      throw error;
    }
  },
);

channelRoutes.post(
  "/instagram/connect",
  zValidator("json", connectInstagramSchema),
  async (c) => {
    const auth = c.get("auth");
    const { username } = c.req.valid("json");

    try {
      const channel = await channelService.connectChannel(
        auth.profileId,
        "instagram",
        username,
      );
      return c.json(ok(channel), 201);
    } catch (error) {
      if (error instanceof ChannelError) {
        return c.json(err(error.message), 400);
      }
      throw error;
    }
  },
);

// ── Valid Channel Types ──────────────────────────────────────────────
const VALID_CHANNEL_TYPES = new Set([
  "push", "telegram", "email", "whatsapp", "sms", "instagram", "slack", "discord",
]);

function validateChannelType(type: string): boolean {
  return VALID_CHANNEL_TYPES.has(type);
}

// ── POST /:type/test — Send test message ─────────────────────────────
channelRoutes.post("/:type/test", async (c) => {
  const auth = c.get("auth");
  const channelType = c.req.param("type");

  if (!validateChannelType(channelType)) {
    return c.json(err("Invalid channel type"), 400);
  }

  try {
    const result = await channelService.testChannel(
      auth.profileId,
      channelType,
    );
    return c.json(ok(result));
  } catch (error) {
    if (error instanceof ChannelError) {
      return c.json(err(error.message), 400);
    }
    throw error;
  }
});

// ── DELETE /:type — Disconnect a channel ─────────────────────────────
channelRoutes.delete("/:type", async (c) => {
  const auth = c.get("auth");
  const channelType = c.req.param("type");

  if (!validateChannelType(channelType)) {
    return c.json(err("Invalid channel type"), 400);
  }

  const deleted = await channelService.disconnectChannel(
    auth.profileId,
    channelType,
  );

  if (!deleted) {
    return c.json(err("Channel not found"), 404);
  }

  return c.json(ok({ deleted: true }));
});
