import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  calculateBackoff,
  getRetryConfig,
  getBullMQBackoff,
  getBullMQJobOptions,
  CHANNEL_RETRY_CONFIG,
  type RetryConfig,
} from "../retry-policy.js";

describe("Retry Policy", () => {
  describe("calculateBackoff", () => {
    it("increases delay with higher attempt numbers", () => {
      // Fix random to isolate exponential growth
      vi.spyOn(Math, "random").mockReturnValue(0);

      const config: RetryConfig = {
        maxAttempts: 5,
        baseDelayMs: 1000,
        maxDelayMs: 60000,
      };

      const delay0 = calculateBackoff(0, config); // 1000 * 2^0 = 1000
      const delay1 = calculateBackoff(1, config); // 1000 * 2^1 = 2000
      const delay2 = calculateBackoff(2, config); // 1000 * 2^2 = 4000
      const delay3 = calculateBackoff(3, config); // 1000 * 2^3 = 8000

      expect(delay1).toBeGreaterThan(delay0);
      expect(delay2).toBeGreaterThan(delay1);
      expect(delay3).toBeGreaterThan(delay2);

      vi.restoreAllMocks();
    });

    it("never exceeds maxDelayMs cap (plus jitter)", () => {
      // Even with max jitter (random = 1), delay should not exceed cap + base
      vi.spyOn(Math, "random").mockReturnValue(1);

      const config: RetryConfig = {
        maxAttempts: 10,
        baseDelayMs: 1000,
        maxDelayMs: 5000,
      };

      // Attempt 20 would give 1000 * 2^20 = huge, but capped at 5000
      const delay = calculateBackoff(20, config);
      // Max possible = 5000 (cap) + 1000 (max jitter) = 6000
      expect(delay).toBeLessThanOrEqual(config.maxDelayMs + config.baseDelayMs);

      vi.restoreAllMocks();
    });

    it("adds jitter within [0, baseDelayMs]", () => {
      const config: RetryConfig = {
        maxAttempts: 3,
        baseDelayMs: 1000,
        maxDelayMs: 60000,
      };

      // With random = 0, jitter = 0
      vi.spyOn(Math, "random").mockReturnValue(0);
      const delayNoJitter = calculateBackoff(0, config);

      vi.restoreAllMocks();

      // With random = 0.5, jitter = 500
      vi.spyOn(Math, "random").mockReturnValue(0.5);
      const delayHalfJitter = calculateBackoff(0, config);

      vi.restoreAllMocks();

      // With random = 1, jitter = 1000
      vi.spyOn(Math, "random").mockReturnValue(1);
      const delayFullJitter = calculateBackoff(0, config);

      vi.restoreAllMocks();

      // Base delay at attempt 0 = 1000 * 2^0 = 1000 (capped at 60000)
      expect(delayNoJitter).toBe(1000); // 1000 + 0
      expect(delayHalfJitter).toBe(1500); // 1000 + 500
      expect(delayFullJitter).toBe(2000); // 1000 + 1000
    });

    it("uses default config when none provided", () => {
      vi.spyOn(Math, "random").mockReturnValue(0);

      // Default: base=1000, max=30000
      const delay = calculateBackoff(0);
      expect(delay).toBe(1000); // 1000 * 2^0 + 0 jitter

      vi.restoreAllMocks();
    });
  });

  describe("getRetryConfig", () => {
    it("returns correct config for push channel", () => {
      const config = getRetryConfig("push");
      expect(config).toEqual(CHANNEL_RETRY_CONFIG.push);
      expect(config.maxAttempts).toBe(3);
      expect(config.baseDelayMs).toBe(500);
      expect(config.maxDelayMs).toBe(10000);
    });

    it("returns correct config for whatsapp channel", () => {
      const config = getRetryConfig("whatsapp");
      expect(config).toEqual(CHANNEL_RETRY_CONFIG.whatsapp);
      expect(config.maxAttempts).toBe(2);
      expect(config.baseDelayMs).toBe(3000);
    });

    it("returns correct config for email channel", () => {
      const config = getRetryConfig("email");
      expect(config).toEqual(CHANNEL_RETRY_CONFIG.email);
      expect(config.maxAttempts).toBe(3);
      expect(config.baseDelayMs).toBe(2000);
      expect(config.maxDelayMs).toBe(60000);
    });

    it("returns correct config for sms channel", () => {
      const config = getRetryConfig("sms");
      expect(config).toEqual(CHANNEL_RETRY_CONFIG.sms);
      expect(config.maxAttempts).toBe(2);
      expect(config.baseDelayMs).toBe(5000);
    });

    it("returns correct config for telegram channel", () => {
      const config = getRetryConfig("telegram");
      expect(config).toEqual(CHANNEL_RETRY_CONFIG.telegram);
      expect(config.maxAttempts).toBe(3);
    });

    it("returns correct config for slack channel", () => {
      const config = getRetryConfig("slack");
      expect(config).toEqual(CHANNEL_RETRY_CONFIG.slack);
      expect(config.maxDelayMs).toBe(15000);
    });

    it("returns correct config for discord channel", () => {
      const config = getRetryConfig("discord");
      expect(config).toEqual(CHANNEL_RETRY_CONFIG.discord);
      expect(config.maxDelayMs).toBe(15000);
    });

    it("returns default config for unknown channels", () => {
      const config = getRetryConfig("carrier_pigeon");
      expect(config.maxAttempts).toBe(3);
      expect(config.baseDelayMs).toBe(1000);
      expect(config.maxDelayMs).toBe(30000);
    });

    it("returns default config for empty string", () => {
      const config = getRetryConfig("");
      expect(config.maxAttempts).toBe(3);
      expect(config.baseDelayMs).toBe(1000);
      expect(config.maxDelayMs).toBe(30000);
    });
  });

  describe("getBullMQBackoff", () => {
    it("returns exponential backoff for known channels", () => {
      const backoff = getBullMQBackoff("push");
      expect(backoff.type).toBe("exponential");
      expect(backoff.delay).toBe(500); // push baseDelayMs
    });

    it("returns exponential backoff for email", () => {
      const backoff = getBullMQBackoff("email");
      expect(backoff.type).toBe("exponential");
      expect(backoff.delay).toBe(2000); // email baseDelayMs
    });

    it("uses default delay for unknown channels", () => {
      const backoff = getBullMQBackoff("unknown");
      expect(backoff.type).toBe("exponential");
      expect(backoff.delay).toBe(1000); // default baseDelayMs
    });
  });

  describe("getBullMQJobOptions", () => {
    it("returns complete job options for a channel", () => {
      const options = getBullMQJobOptions("push");
      expect(options.attempts).toBe(3);
      expect(options.backoff.type).toBe("exponential");
      expect(options.backoff.delay).toBe(500);
      expect(options.removeOnComplete).toEqual({ age: 86_400, count: 1_000 });
      expect(options.removeOnFail).toEqual({ age: 604_800 });
    });

    it("uses channel-specific attempts", () => {
      const whatsappOpts = getBullMQJobOptions("whatsapp");
      expect(whatsappOpts.attempts).toBe(2); // whatsapp has maxAttempts: 2

      const emailOpts = getBullMQJobOptions("email");
      expect(emailOpts.attempts).toBe(3); // email has maxAttempts: 3
    });

    it("uses channel-specific backoff delay", () => {
      const smsOpts = getBullMQJobOptions("sms");
      expect(smsOpts.backoff.delay).toBe(5000); // sms baseDelayMs
    });
  });
});
