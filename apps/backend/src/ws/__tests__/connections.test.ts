import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  addConnection,
  removeConnection,
  sendToUser,
  broadcast,
  connectionCount,
} from "../connections.js";

function createMockWs() {
  return {
    send: vi.fn(),
    close: vi.fn(),
    readyState: 1,
    url: null,
    protocol: null,
    raw: null,
  } as unknown as import("hono/ws").WSContext;
}

describe("WebSocket Connections", () => {
  beforeEach(() => {
    // Clean up connections between tests by removing known test users
    // Since the module uses a private Map, we need to work through the public API
  });

  it("adds and counts connections", () => {
    const userId = `test-add-${Date.now()}`;
    const ws = createMockWs();

    const before = connectionCount();
    addConnection(userId, ws);
    expect(connectionCount()).toBe(before + 1);

    // Cleanup
    removeConnection(userId, ws);
  });

  it("supports multiple connections per user", () => {
    const userId = `test-multi-${Date.now()}`;
    const ws1 = createMockWs();
    const ws2 = createMockWs();

    const before = connectionCount();
    addConnection(userId, ws1);
    addConnection(userId, ws2);
    expect(connectionCount()).toBe(before + 2);

    // Cleanup
    removeConnection(userId, ws1);
    removeConnection(userId, ws2);
  });

  it("removes connections correctly", () => {
    const userId = `test-remove-${Date.now()}`;
    const ws = createMockWs();

    addConnection(userId, ws);
    const afterAdd = connectionCount();
    removeConnection(userId, ws);
    expect(connectionCount()).toBe(afterAdd - 1);
  });

  it("handles removing non-existent connection gracefully", () => {
    const ws = createMockWs();
    // Should not throw
    removeConnection("non-existent-user", ws);
  });

  it("sends messages to all user connections", () => {
    const userId = `test-send-${Date.now()}`;
    const ws1 = createMockWs();
    const ws2 = createMockWs();

    addConnection(userId, ws1);
    addConnection(userId, ws2);

    sendToUser(userId, { type: "pong", payload: {} });

    expect(ws1.send).toHaveBeenCalledTimes(1);
    expect(ws2.send).toHaveBeenCalledTimes(1);

    const msg1 = JSON.parse(ws1.send.mock.calls[0][0] as string);
    expect(msg1.type).toBe("pong");
    expect(msg1.timestamp).toBeDefined();

    // Cleanup
    removeConnection(userId, ws1);
    removeConnection(userId, ws2);
  });

  it("handles dead connections during send", () => {
    const userId = `test-dead-${Date.now()}`;
    const ws = createMockWs();
    ws.send = vi.fn(() => {
      throw new Error("Connection closed");
    });

    addConnection(userId, ws);

    // Should not throw
    sendToUser(userId, { type: "pong", payload: {} });
  });

  it("broadcasts to all connected users", () => {
    const userId1 = `test-broadcast-a-${Date.now()}`;
    const userId2 = `test-broadcast-b-${Date.now()}`;
    const ws1 = createMockWs();
    const ws2 = createMockWs();

    addConnection(userId1, ws1);
    addConnection(userId2, ws2);

    broadcast({ type: "sync.required", payload: { reason: "test" } });

    expect(ws1.send).toHaveBeenCalled();
    expect(ws2.send).toHaveBeenCalled();

    // Cleanup
    removeConnection(userId1, ws1);
    removeConnection(userId2, ws2);
  });

  it("does nothing when sending to user with no connections", () => {
    // Should not throw
    sendToUser("no-such-user", { type: "pong", payload: {} });
  });
});
