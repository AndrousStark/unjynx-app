// ============================================================
// UNJYNX Dev Portal - Constants Tests
// ============================================================

import { describe, it, expect } from "vitest";
import { COLORS, CHANNEL_INFO, NAV_ITEMS, REFRESH_INTERVALS } from "@/utils/constants";

describe("COLORS", () => {
  it("has all required brand colors", () => {
    expect(COLORS.midnight).toBe("#0F0A1A");
    expect(COLORS.gold).toBe("#FFD700");
    expect(COLORS.violet).toBe("#6C5CE7");
    expect(COLORS.lightBg).toBe("#F8F5FF");
  });

  it("has all status colors", () => {
    expect(COLORS.healthy).toBeDefined();
    expect(COLORS.warning).toBeDefined();
    expect(COLORS.critical).toBeDefined();
    expect(COLORS.info).toBeDefined();
    expect(COLORS.unknown).toBeDefined();
  });
});

describe("CHANNEL_INFO", () => {
  it("has all 8 channels defined", () => {
    const channels = [
      "whatsapp",
      "telegram",
      "email",
      "sms",
      "push",
      "instagram",
      "slack",
      "discord",
    ];
    channels.forEach((ch) => {
      expect(CHANNEL_INFO[ch]).toBeDefined();
      expect(CHANNEL_INFO[ch].label).toBeTruthy();
      expect(CHANNEL_INFO[ch].color).toBeTruthy();
      expect(CHANNEL_INFO[ch].provider).toBeTruthy();
    });
  });

  it("has correct provider mappings", () => {
    expect(CHANNEL_INFO.whatsapp.provider).toBe("Gupshup");
    expect(CHANNEL_INFO.telegram.provider).toBe("Bot API");
    expect(CHANNEL_INFO.email.provider).toBe("SendGrid");
    expect(CHANNEL_INFO.sms.provider).toBe("MSG91");
    expect(CHANNEL_INFO.push.provider).toBe("FCM");
  });
});

describe("NAV_ITEMS", () => {
  it("has 8 navigation items for R1-R8", () => {
    expect(NAV_ITEMS).toHaveLength(8);
  });

  it("all items have key, label, and icon", () => {
    NAV_ITEMS.forEach((item) => {
      expect(item.key).toMatch(/^\//);
      expect(item.label).toBeTruthy();
      expect(item.icon).toBeTruthy();
    });
  });
});

describe("REFRESH_INTERVALS", () => {
  it("has correct interval values", () => {
    expect(REFRESH_INTERVALS.realtime).toBe(5000);
    expect(REFRESH_INTERVALS.fast).toBe(15000);
    expect(REFRESH_INTERVALS.normal).toBe(30000);
    expect(REFRESH_INTERVALS.slow).toBe(60000);
  });

  it("intervals are in ascending order", () => {
    expect(REFRESH_INTERVALS.realtime).toBeLessThan(REFRESH_INTERVALS.fast);
    expect(REFRESH_INTERVALS.fast).toBeLessThan(REFRESH_INTERVALS.normal);
    expect(REFRESH_INTERVALS.normal).toBeLessThan(REFRESH_INTERVALS.slow);
  });
});
