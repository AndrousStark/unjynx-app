import { describe, it, expect } from "vitest";
import { parseCsv, findDuplicates } from "../csv-parser.js";

describe("CSV Parser", () => {
  describe("parseCsv - generic format", () => {
    it("parses basic CSV", () => {
      const csv = `title,description,priority,due_date
Buy milk,Get 2% milk,low,2026-04-01
Read book,,medium,`;

      const result = parseCsv(csv, "generic");

      expect(result.headers).toEqual(["title", "description", "priority", "due_date"]);
      expect(result.tasks).toHaveLength(2);
      expect(result.tasks[0].title).toBe("Buy milk");
      expect(result.tasks[0].description).toBe("Get 2% milk");
      expect(result.tasks[0].priority).toBe("low");
      expect(result.tasks[1].title).toBe("Read book");
      expect(result.tasks[1].priority).toBe("medium");
    });

    it("handles quoted fields with commas", () => {
      const csv = `title,description
"Buy milk, bread",Simple task
"Task ""B""",Quoted desc`;

      const result = parseCsv(csv, "generic");

      expect(result.tasks[0].title).toBe("Buy milk, bread");
      expect(result.tasks[1].title).toBe('Task "B"');
    });

    it("skips empty rows", () => {
      const csv = `title,priority
Task 1,low

Task 2,high
`;

      const result = parseCsv(csv, "generic");
      expect(result.tasks).toHaveLength(2);
    });

    it("filters out rows with empty titles", () => {
      const csv = `title,priority
Task 1,low
,high`;

      const result = parseCsv(csv, "generic");
      expect(result.tasks).toHaveLength(1);
    });

    it("handles empty CSV", () => {
      const result = parseCsv("", "generic");
      expect(result.headers).toEqual([]);
      expect(result.tasks).toHaveLength(0);
    });
  });

  describe("parseCsv - todoist format", () => {
    it("maps Todoist columns correctly", () => {
      const csv = `Content,Description,Priority,Due Date,Project,Status
Buy groceries,Weekly shopping,2,2026-04-01,Home,
Review PR,Check code changes,1,,Work,`;

      const result = parseCsv(csv, "todoist");

      expect(result.tasks).toHaveLength(2);
      expect(result.tasks[0].title).toBe("Buy groceries");
      expect(result.tasks[0].priority).toBe("high");
      expect(result.tasks[0].project).toBe("Home");
      expect(result.tasks[1].priority).toBe("urgent");
    });
  });

  describe("parseCsv - ticktick format", () => {
    it("maps TickTick columns correctly", () => {
      const csv = `Title,Content,Priority,Due Date,List Name,Status
Exercise,Morning jog,3,2026-04-01,Health,
Study,,0,,Education,`;

      const result = parseCsv(csv, "ticktick");

      expect(result.tasks).toHaveLength(2);
      expect(result.tasks[0].title).toBe("Exercise");
      expect(result.tasks[0].description).toBe("Morning jog");
      expect(result.tasks[0].priority).toBe("medium");
      expect(result.tasks[0].project).toBe("Health");
      expect(result.tasks[1].priority).toBe("none");
    });
  });

  describe("parseCsv - custom delimiter", () => {
    it("handles semicolon delimiter", () => {
      const csv = `title;priority
Task 1;high
Task 2;low`;

      const result = parseCsv(csv, "generic", ";");

      expect(result.tasks).toHaveLength(2);
      expect(result.tasks[0].priority).toBe("high");
    });

    it("handles tab delimiter", () => {
      const csv = `title\tpriority
Task 1\thigh`;

      const result = parseCsv(csv, "generic", "\t");

      expect(result.tasks).toHaveLength(1);
      expect(result.tasks[0].title).toBe("Task 1");
    });
  });

  describe("parseCsv - column mapping", () => {
    it("uses custom column mapping", () => {
      const csv = `task_name,task_desc,importance
Do laundry,Wash clothes,high`;

      const result = parseCsv(csv, "generic", ",", {
        title: "task_name",
        description: "task_desc",
        priority: "importance",
      });

      expect(result.tasks[0].title).toBe("Do laundry");
      expect(result.tasks[0].description).toBe("Wash clothes");
      expect(result.tasks[0].priority).toBe("high");
    });
  });

  describe("priority normalization", () => {
    it("maps various priority formats", () => {
      const csv = `title,priority
T1,urgent
T2,high
T3,medium
T4,low
T5,none
T6,p1
T7,p2
T8,1
T9,4`;

      const result = parseCsv(csv, "generic");

      expect(result.tasks[0].priority).toBe("urgent");
      expect(result.tasks[1].priority).toBe("high");
      expect(result.tasks[2].priority).toBe("medium");
      expect(result.tasks[3].priority).toBe("low");
      expect(result.tasks[4].priority).toBe("none");
      expect(result.tasks[5].priority).toBe("urgent");
      expect(result.tasks[6].priority).toBe("high");
      expect(result.tasks[7].priority).toBe("urgent");
      expect(result.tasks[8].priority).toBe("low");
    });
  });

  describe("findDuplicates", () => {
    it("finds duplicate tasks by title + dueDate", () => {
      const incoming = [
        { title: "Buy milk", description: null, priority: "none" as const, dueDate: "2026-04-01T00:00:00.000Z", project: null, status: null },
        { title: "Read book", description: null, priority: "none" as const, dueDate: null, project: null, status: null },
        { title: "New task", description: null, priority: "none" as const, dueDate: null, project: null, status: null },
      ];
      const existing = [
        { title: "Buy milk", dueDate: new Date("2026-04-01T00:00:00.000Z") },
      ];

      const duplicates = findDuplicates(incoming, existing);

      expect(duplicates.size).toBe(1);
      expect(duplicates.has(0)).toBe(true);
      expect(duplicates.has(1)).toBe(false);
    });

    it("returns empty set when no duplicates", () => {
      const incoming = [
        { title: "New task", description: null, priority: "none" as const, dueDate: null, project: null, status: null },
      ];
      const existing = [
        { title: "Old task", dueDate: null },
      ];

      const duplicates = findDuplicates(incoming, existing);
      expect(duplicates.size).toBe(0);
    });

    it("is case-insensitive", () => {
      const incoming = [
        { title: "BUY MILK", description: null, priority: "none" as const, dueDate: null, project: null, status: null },
      ];
      const existing = [
        { title: "buy milk", dueDate: null },
      ];

      const duplicates = findDuplicates(incoming, existing);
      expect(duplicates.size).toBe(1);
    });
  });
});
