import { describe, it, expect } from "vitest";
import {
  createInMemoryQueueConnection,
  type QueueConnectionPort,
} from "../connection.js";

describe("Queue Connection", () => {
  describe("createInMemoryQueueConnection", () => {
    it("returns a valid QueueConnectionPort", () => {
      const conn = createInMemoryQueueConnection();
      expect(conn).toBeDefined();
      expect(conn.connection).toBeDefined();
      expect(typeof conn.close).toBe("function");
    });

    it("close resolves without error", async () => {
      const conn = createInMemoryQueueConnection();
      await expect(conn.close()).resolves.toBeUndefined();
    });

    it("multiple close calls do not throw", async () => {
      const conn = createInMemoryQueueConnection();
      await conn.close();
      await expect(conn.close()).resolves.toBeUndefined();
    });
  });

  describe("QueueConnectionPort interface", () => {
    it("connection property is accessible", () => {
      const conn = createInMemoryQueueConnection();
      // In-memory stub returns an object
      expect(conn.connection).toBeTruthy();
    });

    it("satisfies the interface contract", () => {
      const conn: QueueConnectionPort = createInMemoryQueueConnection();
      expect(conn.connection).toBeDefined();
      expect(conn.close).toBeDefined();
    });
  });
});
