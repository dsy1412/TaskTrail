import { describe, expect, it } from "vitest";
import { deriveFocusTrail, summarizeFocusByModule } from "@/lib/focusTrail";
import type { PlannerState } from "@/lib/types";

const state: PlannerState = {
  tasks: [
    {
      id: "project",
      title: "Project App",
      module: "Project",
      priority: "High",
      estimatedDurationMinutes: 120,
      notes: "",
      createdAt: "2026-04-20T00:00:00.000Z",
    },
    {
      id: "paper",
      title: "Paper Reading",
      module: "Study",
      priority: "Medium",
      estimatedDurationMinutes: 60,
      notes: "",
      createdAt: "2026-04-20T00:00:00.000Z",
    },
  ],
  scheduleBlocks: [
    {
      id: "b1",
      taskId: "project",
      date: "2026-04-20",
      timeSlot: "09:00",
      columnIndex: 0,
      durationMinutes: 120,
      createdAt: "2026-04-20T00:00:00.000Z",
      updatedAt: "2026-04-20T00:00:00.000Z",
    },
    {
      id: "b2",
      taskId: "project",
      date: "2026-04-21",
      timeSlot: "09:00",
      columnIndex: 0,
      durationMinutes: 120,
      createdAt: "2026-04-21T00:00:00.000Z",
      updatedAt: "2026-04-21T00:00:00.000Z",
    },
    {
      id: "deleted",
      taskId: "project",
      date: "2026-04-22",
      timeSlot: "09:00",
      columnIndex: 0,
      durationMinutes: 120,
      createdAt: "2026-04-22T00:00:00.000Z",
      updatedAt: "2026-04-22T00:00:00.000Z",
      deletedAt: "2026-04-22T01:00:00.000Z",
    },
    {
      id: "b3",
      taskId: "paper",
      date: "2026-04-23",
      timeSlot: "13:00",
      columnIndex: 0,
      durationMinutes: 60,
      createdAt: "2026-04-23T00:00:00.000Z",
      updatedAt: "2026-04-23T00:00:00.000Z",
    },
  ],
  events: [],
};

describe("Focus Trail derivation", () => {
  it("connects continuous dates and ignores deleted schedule blocks", () => {
    const segments = deriveFocusTrail(state, "week", "2026-04-23");
    const project = segments.find((segment) => segment.label === "Project App");

    expect(project?.activeDates).toEqual(["2026-04-20", "2026-04-21"]);
    expect(project?.streakLength).toBe(2);
    expect(project?.endDate).toBe("2026-04-21");
  });

  it("summarizes focus days by module", () => {
    const summary = summarizeFocusByModule(state, "week");

    expect(summary.Project).toBe(2);
    expect(summary.Study).toBe(1);
  });
});
