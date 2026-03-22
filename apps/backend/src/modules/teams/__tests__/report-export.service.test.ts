import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks ────────────────────────────────────────────────────────────

const mockFindTeamById = vi.fn();
const mockFindMembers = vi.fn();
const mockGetTeamReport = vi.fn();

vi.mock("../teams.repository.js", () => ({
  findTeamById: (...args: unknown[]) => mockFindTeamById(...args),
  findMembers: (...args: unknown[]) => mockFindMembers(...args),
  getTeamReport: (...args: unknown[]) => mockGetTeamReport(...args),
}));

vi.mock("../teams.service.js", () => ({
  getTeamReport: vi.fn().mockImplementation(
    async (_teamId: string, _query: unknown) => ({
      memberCount: 2,
      totalTasks: 10,
      completedTasks: 7,
      completionRate: 0.7,
    }),
  ),
}));

import {
  exportTeamReportCsv,
  exportTeamReportPdf,
} from "../report-export.service.js";

// ── Helpers ──────────────────────────────────────────────────────────

const TEAM_ID = "team-001";
const WEEK_QUERY = { period: "week" as const };
const MONTH_QUERY = { period: "month" as const };

function setupMocks(options?: { teamName?: string; members?: unknown[] }) {
  mockFindTeamById.mockResolvedValue({
    id: TEAM_ID,
    name: options?.teamName ?? "Test Team Alpha",
    ownerId: "user-001",
    maxMembers: 50,
  });

  mockFindMembers.mockResolvedValue(
    options?.members ?? [
      { id: "m1", teamId: TEAM_ID, userId: "Alice", role: "owner", status: "active" },
      { id: "m2", teamId: TEAM_ID, userId: "Bob", role: "member", status: "active" },
    ],
  );
}

// ── CSV Tests ────────────────────────────────────────────────────────

describe("exportTeamReportCsv", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupMocks();
  });

  it("returns a UTF-8 BOM prefixed string", async () => {
    const csv = await exportTeamReportCsv(TEAM_ID, WEEK_QUERY);
    expect(csv.charCodeAt(0)).toBe(0xfeff); // UTF-8 BOM
  });

  it("includes the team name in the summary", async () => {
    const csv = await exportTeamReportCsv(TEAM_ID, WEEK_QUERY);
    expect(csv).toContain("Test Team Alpha");
  });

  it("includes UNJYNX branding", async () => {
    const csv = await exportTeamReportCsv(TEAM_ID, WEEK_QUERY);
    expect(csv).toContain("UNJYNX Team Report");
    expect(csv).toContain("unjynx.me");
  });

  it("contains period label for weekly report", async () => {
    const csv = await exportTeamReportCsv(TEAM_ID, WEEK_QUERY);
    expect(csv).toContain("Last 7 Days");
  });

  it("contains period label for monthly report", async () => {
    const csv = await exportTeamReportCsv(TEAM_ID, MONTH_QUERY);
    expect(csv).toContain("Last 30 Days");
  });

  it("includes the CSV header row", async () => {
    const csv = await exportTeamReportCsv(TEAM_ID, WEEK_QUERY);
    expect(csv).toContain("Member,Role,Tasks Completed,Completion Rate,Overdue Tasks");
  });

  it("includes member rows", async () => {
    const csv = await exportTeamReportCsv(TEAM_ID, WEEK_QUERY);
    expect(csv).toContain("Alice");
    expect(csv).toContain("Bob");
  });

  it("includes completion rate as percentage", async () => {
    const csv = await exportTeamReportCsv(TEAM_ID, WEEK_QUERY);
    expect(csv).toContain("70.0%");
  });

  it("escapes CSV fields with commas", async () => {
    setupMocks({ teamName: "Team, With Comma" });
    const csv = await exportTeamReportCsv(TEAM_ID, WEEK_QUERY);
    expect(csv).toContain('"Team, With Comma"');
  });

  it("uses CRLF line endings", async () => {
    const csv = await exportTeamReportCsv(TEAM_ID, WEEK_QUERY);
    expect(csv).toContain("\r\n");
  });

  it("handles empty team gracefully", async () => {
    setupMocks({ members: [] });
    const csv = await exportTeamReportCsv(TEAM_ID, WEEK_QUERY);
    expect(csv).toContain("No team members found for this period");
  });
});

// ── PDF Tests ────────────────────────────────────────────────────────

describe("exportTeamReportPdf", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupMocks();
  });

  it("returns a valid PDF (starts with PDF magic bytes)", async () => {
    const pdfBytes = await exportTeamReportPdf(TEAM_ID, WEEK_QUERY);
    expect(pdfBytes).toBeInstanceOf(Uint8Array);
    expect(pdfBytes.length).toBeGreaterThan(100);

    // PDF files start with "%PDF-"
    const header = String.fromCharCode(
      pdfBytes[0],
      pdfBytes[1],
      pdfBytes[2],
      pdfBytes[3],
      pdfBytes[4],
    );
    expect(header).toBe("%PDF-");
  });

  it("generates a non-empty byte array for week period", async () => {
    const pdfBytes = await exportTeamReportPdf(TEAM_ID, WEEK_QUERY);
    expect(pdfBytes.byteLength).toBeGreaterThan(0);
  });

  it("generates a non-empty byte array for month period", async () => {
    const pdfBytes = await exportTeamReportPdf(TEAM_ID, MONTH_QUERY);
    expect(pdfBytes.byteLength).toBeGreaterThan(0);
  });

  it("handles empty team without error", async () => {
    setupMocks({ members: [] });
    const pdfBytes = await exportTeamReportPdf(TEAM_ID, WEEK_QUERY);
    expect(pdfBytes).toBeInstanceOf(Uint8Array);
    expect(pdfBytes.byteLength).toBeGreaterThan(0);
  });

  it("handles a team with many members", async () => {
    const manyMembers = Array.from({ length: 50 }, (_, i) => ({
      id: `m${i}`,
      teamId: TEAM_ID,
      userId: `Member-${i}`,
      role: "member",
      status: "active",
    }));
    setupMocks({ members: manyMembers });
    const pdfBytes = await exportTeamReportPdf(TEAM_ID, WEEK_QUERY);
    expect(pdfBytes).toBeInstanceOf(Uint8Array);
    expect(pdfBytes.byteLength).toBeGreaterThan(0);
  });

  it("handles missing team name gracefully", async () => {
    mockFindTeamById.mockResolvedValue(undefined);
    const pdfBytes = await exportTeamReportPdf(TEAM_ID, WEEK_QUERY);
    expect(pdfBytes).toBeInstanceOf(Uint8Array);
  });
});
