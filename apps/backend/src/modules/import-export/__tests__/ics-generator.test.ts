import { describe, it, expect } from "vitest";
import { generateIcs, type IcsTask } from "../ics-generator.js";

describe("ICS Generator", () => {
  const baseTasks: IcsTask[] = [
    {
      id: "task-1",
      title: "Buy groceries",
      description: "Get milk and bread",
      dueDate: new Date("2026-04-01T10:00:00Z"),
      completedAt: null,
      status: "pending",
      priority: "high",
      rrule: null,
      createdAt: new Date("2026-03-01T00:00:00Z"),
      updatedAt: new Date("2026-03-01T00:00:00Z"),
    },
  ];

  it("generates valid VCALENDAR structure", () => {
    const ics = generateIcs(baseTasks);

    expect(ics).toContain("BEGIN:VCALENDAR");
    expect(ics).toContain("END:VCALENDAR");
    expect(ics).toContain("VERSION:2.0");
    expect(ics).toContain("PRODID:-//UNJYNX//Task Manager//EN");
  });

  it("generates VTODO component", () => {
    const ics = generateIcs(baseTasks);

    expect(ics).toContain("BEGIN:VTODO");
    expect(ics).toContain("END:VTODO");
    expect(ics).toContain("SUMMARY:Buy groceries");
    expect(ics).toContain("DESCRIPTION:Get milk and bread");
    expect(ics).toContain("UID:task-1@unjynx.app");
  });

  it("includes DUE date", () => {
    const ics = generateIcs(baseTasks);
    expect(ics).toContain("DUE:");
  });

  it("maps priority correctly", () => {
    const ics = generateIcs(baseTasks);
    // High priority maps to 3
    expect(ics).toContain("PRIORITY:3");
  });

  it("maps status correctly", () => {
    const ics = generateIcs(baseTasks);
    expect(ics).toContain("STATUS:NEEDS-ACTION");
  });

  it("handles completed tasks", () => {
    const completedTasks: IcsTask[] = [
      {
        ...baseTasks[0],
        status: "completed",
        completedAt: new Date("2026-03-15T12:00:00Z"),
      },
    ];

    const ics = generateIcs(completedTasks);

    expect(ics).toContain("STATUS:COMPLETED");
    expect(ics).toContain("COMPLETED:");
    expect(ics).toContain("PERCENT-COMPLETE:100");
  });

  it("includes RRULE for recurring tasks", () => {
    const recurringTasks: IcsTask[] = [
      {
        ...baseTasks[0],
        rrule: "FREQ=WEEKLY;BYDAY=MO,WE,FR",
      },
    ];

    const ics = generateIcs(recurringTasks);
    expect(ics).toContain("RRULE:FREQ=WEEKLY;BYDAY=MO,WE,FR");
  });

  it("handles tasks without description", () => {
    const noDescTasks: IcsTask[] = [
      {
        ...baseTasks[0],
        description: null,
      },
    ];

    const ics = generateIcs(noDescTasks);
    expect(ics).not.toContain("DESCRIPTION:");
  });

  it("handles tasks without due date", () => {
    const noDueTasks: IcsTask[] = [
      {
        ...baseTasks[0],
        dueDate: null,
      },
    ];

    const ics = generateIcs(noDueTasks);
    expect(ics).not.toContain("DUE:");
  });

  it("escapes special characters in text", () => {
    const specialTasks: IcsTask[] = [
      {
        ...baseTasks[0],
        title: "Task with, comma; semicolon\nand newline",
      },
    ];

    const ics = generateIcs(specialTasks);
    expect(ics).toContain("SUMMARY:Task with\\, comma\\; semicolon\\nand newline");
  });

  it("generates multiple VTODOs for multiple tasks", () => {
    const multiTasks: IcsTask[] = [
      baseTasks[0],
      {
        ...baseTasks[0],
        id: "task-2",
        title: "Second task",
        priority: "urgent",
      },
    ];

    const ics = generateIcs(multiTasks);
    const vtodoCount = (ics.match(/BEGIN:VTODO/g) || []).length;

    expect(vtodoCount).toBe(2);
    expect(ics).toContain("PRIORITY:1"); // urgent = 1
  });

  it("maps all priority levels", () => {
    const priorities = ["urgent", "high", "medium", "low", "none"];
    const expectedValues = [1, 3, 5, 7, 9];

    for (let i = 0; i < priorities.length; i++) {
      const tasks: IcsTask[] = [
        { ...baseTasks[0], priority: priorities[i], id: `task-${i}` },
      ];
      const ics = generateIcs(tasks);
      expect(ics).toContain(`PRIORITY:${expectedValues[i]}`);
    }
  });

  it("maps all status values", () => {
    const statuses = [
      { input: "completed", expected: "COMPLETED" },
      { input: "cancelled", expected: "CANCELLED" },
      { input: "in_progress", expected: "IN-PROCESS" },
      { input: "pending", expected: "NEEDS-ACTION" },
    ];

    for (const { input, expected } of statuses) {
      const tasks: IcsTask[] = [
        { ...baseTasks[0], status: input, id: `task-${input}` },
      ];
      const ics = generateIcs(tasks);
      expect(ics).toContain(`STATUS:${expected}`);
    }
  });
});
