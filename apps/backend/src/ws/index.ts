import { Hono } from "hono";
import { createNodeWebSocket } from "@hono/node-ws";
import * as jose from "jose";
import { env } from "../env.js";
import { logger } from "../middleware/logger.js";
import { addConnection, removeConnection, sendToUser } from "./connections.js";
import type { ClientEvent } from "./types.js";

const wsApp = new Hono();

export const { injectWebSocket, upgradeWebSocket } = createNodeWebSocket({
  app: wsApp,
});

/// WebSocket endpoint with JWT authentication via query param.
///
/// Usage: ws://localhost:3000/ws?token=<jwt>
wsApp.get(
  "/ws",
  upgradeWebSocket(async (c) => {
    // Authenticate via token query param
    const token = c.req.query("token");
    let userId: string | null = null;

    if (token) {
      try {
        const jwksUrl = new URL("/oidc/jwks", env.LOGTO_ENDPOINT);
        const jwks = jose.createRemoteJWKSet(jwksUrl);
        const { payload } = await jose.jwtVerify(token, jwks, {
          issuer: `${env.LOGTO_ENDPOINT}/oidc`,
        });
        userId = payload.sub ?? null;
      } catch {
        logger.warn("WebSocket connection rejected: invalid token");
      }
    }

    // For local dev without Logto, accept anonymous connections
    if (!userId && env.NODE_ENV === "development") {
      userId = "dev-user";
    }

    if (!userId) {
      return {
        onOpen(_event, ws) {
          ws.close(4001, "Unauthorized");
        },
      };
    }

    const connUserId = userId;

    return {
      onOpen(_event, ws) {
        addConnection(connUserId, ws);
        logger.info({ userId: connUserId }, "WebSocket connected");
      },

      onMessage(event, ws) {
        try {
          const data = JSON.parse(
            typeof event.data === "string"
              ? event.data
              : new TextDecoder().decode(event.data as ArrayBuffer),
          ) as ClientEvent;

          switch (data.type) {
            case "ping":
              sendToUser(connUserId, { type: "pong", payload: {} });
              break;

            case "subscribe":
              // Future: channel-based subscriptions
              logger.debug(
                { userId: connUserId, channels: data.payload.channels },
                "Subscribe request",
              );
              break;

            default:
              logger.warn({ type: (data as { type: string }).type }, "Unknown WS message type");
          }
        } catch {
          logger.warn("Failed to parse WebSocket message");
        }
      },

      onClose(_event, ws) {
        removeConnection(connUserId, ws);
        logger.info({ userId: connUserId }, "WebSocket disconnected");
      },

      onError(error) {
        logger.error({ userId: connUserId, error }, "WebSocket error");
      },
    };
  }),
);

export { wsApp };
