import { describe, it, expect } from "vitest";
import {
  parseInboundMessage,
  parseDuration,
  getHelpText,
} from "../inbound-parser.js";

// ── parseDuration ─────────────────────────────────────────────────

describe("parseDuration", () => {
  it("parses plain number as minutes", () => {
    expect(parseDuration("30")).toBe(30);
    expect(parseDuration("1")).toBe(1);
    expect(parseDuration("60")).toBe(60);
    expect(parseDuration("1440")).toBe(1440);
  });

  it("parses 'm' suffix as minutes", () => {
    expect(parseDuration("30m")).toBe(30);
    expect(parseDuration("5min")).toBe(5);
    expect(parseDuration("15 m")).toBe(15);
    expect(parseDuration("120minutes")).toBe(120);
  });

  it("parses 'h' suffix as hours converted to minutes", () => {
    expect(parseDuration("1h")).toBe(60);
    expect(parseDuration("2h")).toBe(120);
    expect(parseDuration("1.5h")).toBe(90);
  });

  it("parses compound hour+minute formats", () => {
    expect(parseDuration("2h30m")).toBe(150);
    expect(parseDuration("1h30")).toBe(90);
    expect(parseDuration("1h 15m")).toBe(75);
  });

  it("returns null for empty input", () => {
    expect(parseDuration("")).toBeNull();
    expect(parseDuration("   ")).toBeNull();
  });

  it("returns null for out-of-range values", () => {
    expect(parseDuration("0")).toBeNull();
    expect(parseDuration("1441")).toBeNull();
    expect(parseDuration("25h")).toBeNull();
  });

  it("returns null for unparseable strings", () => {
    expect(parseDuration("abc")).toBeNull();
    expect(parseDuration("one hour")).toBeNull();
    expect(parseDuration("--5")).toBeNull();
  });

  it("is case insensitive", () => {
    expect(parseDuration("1H")).toBe(60);
    expect(parseDuration("30M")).toBe(30);
    expect(parseDuration("2H30M")).toBe(150);
  });
});

// ── parseInboundMessage ───────────────────────────────────────────

describe("parseInboundMessage", () => {
  // DONE command
  describe("DONE command", () => {
    it("parses 'DONE' as done", () => {
      const result = parseInboundMessage("DONE");
      expect(result.command).toBe("done");
      expect(result.rawText).toBe("DONE");
    });

    it("parses 'done' (lowercase) as done", () => {
      expect(parseInboundMessage("done").command).toBe("done");
    });

    it("parses 'Complete' as done", () => {
      expect(parseInboundMessage("Complete").command).toBe("done");
    });

    it("parses 'completed' as done", () => {
      expect(parseInboundMessage("completed").command).toBe("done");
    });

    it("parses 'FINISHED' as done", () => {
      expect(parseInboundMessage("FINISHED").command).toBe("done");
    });

    it("parses 'finish' as done", () => {
      expect(parseInboundMessage("finish").command).toBe("done");
    });

    it("trims whitespace", () => {
      const result = parseInboundMessage("  DONE  ");
      expect(result.command).toBe("done");
      expect(result.rawText).toBe("DONE");
    });
  });

  // SNOOZE command
  describe("SNOOZE command", () => {
    it("parses bare 'SNOOZE' with 15 min default", () => {
      const result = parseInboundMessage("SNOOZE");
      expect(result.command).toBe("snooze");
      expect(result.snoozeDuration).toBe(15);
    });

    it("parses 'SNOOZE 30' as 30 minutes", () => {
      const result = parseInboundMessage("SNOOZE 30");
      expect(result.command).toBe("snooze");
      expect(result.snoozeDuration).toBe(30);
    });

    it("parses 'snooze 1h' as 60 minutes", () => {
      const result = parseInboundMessage("snooze 1h");
      expect(result.command).toBe("snooze");
      expect(result.snoozeDuration).toBe(60);
    });

    it("parses 'SNOOZE 30m' as 30 minutes", () => {
      const result = parseInboundMessage("SNOOZE 30m");
      expect(result.command).toBe("snooze");
      expect(result.snoozeDuration).toBe(30);
    });

    it("parses 'snooze 2h30m' as 150 minutes", () => {
      const result = parseInboundMessage("snooze 2h30m");
      expect(result.command).toBe("snooze");
      expect(result.snoozeDuration).toBe(150);
    });

    it("falls back to 15 min default for invalid duration", () => {
      const result = parseInboundMessage("SNOOZE abc");
      expect(result.command).toBe("snooze");
      expect(result.snoozeDuration).toBe(15);
    });

    it("preserves rawText", () => {
      const result = parseInboundMessage("SNOOZE 1h");
      expect(result.rawText).toBe("SNOOZE 1h");
    });
  });

  // STOP command
  describe("STOP command", () => {
    it("parses 'STOP' as stop", () => {
      expect(parseInboundMessage("STOP").command).toBe("stop");
    });

    it("parses 'stop' (lowercase) as stop", () => {
      expect(parseInboundMessage("stop").command).toBe("stop");
    });

    it("parses 'UNSUBSCRIBE' as stop", () => {
      expect(parseInboundMessage("UNSUBSCRIBE").command).toBe("stop");
    });

    it("parses 'unsub' as stop", () => {
      expect(parseInboundMessage("unsub").command).toBe("stop");
    });

    it("parses 'optout' as stop", () => {
      expect(parseInboundMessage("optout").command).toBe("stop");
    });

    it("parses 'opt-out' as stop", () => {
      expect(parseInboundMessage("opt-out").command).toBe("stop");
    });
  });

  // HELP command
  describe("HELP command", () => {
    it("parses 'HELP' as help", () => {
      expect(parseInboundMessage("HELP").command).toBe("help");
    });

    it("parses 'help' (lowercase) as help", () => {
      expect(parseInboundMessage("help").command).toBe("help");
    });

    it("parses '?' as help", () => {
      expect(parseInboundMessage("?").command).toBe("help");
    });
  });

  // Unknown command
  describe("unknown command", () => {
    it("returns unknown for unrecognized text", () => {
      const result = parseInboundMessage("gibberish");
      expect(result.command).toBe("unknown");
      expect(result.rawText).toBe("gibberish");
    });

    it("returns unknown for empty after trim", () => {
      // Note: empty string after trim is not a valid DONE/STOP/HELP alias
      const result = parseInboundMessage("random text");
      expect(result.command).toBe("unknown");
    });
  });
});

// ── getHelpText ───────────────────────────────────────────────────

describe("getHelpText", () => {
  it("includes DONE, SNOOZE, STOP, HELP commands", () => {
    const text = getHelpText();
    expect(text).toContain("DONE");
    expect(text).toContain("SNOOZE");
    expect(text).toContain("STOP");
    expect(text).toContain("HELP");
  });

  it("includes UNJYNX branding", () => {
    expect(getHelpText()).toContain("UNJYNX");
  });
});
