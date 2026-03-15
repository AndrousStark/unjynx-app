import type { WSContext } from "hono/ws";
import type { ServerEvent } from "./types.js";

/// Manages active WebSocket connections indexed by user ID.
const connections = new Map<string, Set<WSContext>>();

export function addConnection(userId: string, ws: WSContext): void {
  const userConns = connections.get(userId) ?? new Set();
  userConns.add(ws);
  connections.set(userId, userConns);
}

export function removeConnection(userId: string, ws: WSContext): void {
  const userConns = connections.get(userId);
  if (!userConns) return;

  userConns.delete(ws);
  if (userConns.size === 0) {
    connections.delete(userId);
  }
}

/// Send a message to all connections for a specific user.
export function sendToUser(userId: string, event: ServerEvent): void {
  const userConns = connections.get(userId);
  if (!userConns) return;

  const message = JSON.stringify({
    ...event,
    timestamp: new Date().toISOString(),
  });

  for (const ws of userConns) {
    try {
      ws.send(message);
    } catch {
      // Connection dead — will be cleaned up on close
      userConns.delete(ws);
    }
  }
}

/// Broadcast to all connected users.
export function broadcast(event: ServerEvent): void {
  for (const userId of connections.keys()) {
    sendToUser(userId, event);
  }
}

/// Get the count of active connections.
export function connectionCount(): number {
  let total = 0;
  for (const conns of connections.values()) {
    total += conns.size;
  }
  return total;
}
