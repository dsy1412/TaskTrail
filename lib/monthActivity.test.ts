import { describe, expect, it } from "vitest";
import { deriveMonthActivity, getMonthCalendarDates } from "@/lib/monthActivity";
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
      createdAt: "2026-04-01T00:00:00.000Z",
    },
    {
      id: "study",
      title: "Paper Reading",
      module: "Study",
      priority: "Medium",
      estimatedDurationMinutes: 60,
      notes: "",
      createdAt: "2026-04-01T00:00:00.000Z",
    },
    {
      id: "deleted-task",
      title: "Hidden task",
      module: "Career",
      priority: "Low",
      estimatedDurationMinutes: 30,
      notes: "",
      createdAt: "2026-04-01T00:00:00.000Z",
      deletedAt: "2026-04-07T00:00:00.000Z",
    },
  ],
  scheduleBlocks: [
    {
      id: "b1",
      taskId: "project",
      date: "2026-04-06",
      timeSlot: "09:00",
      columnIndex: 0,
      durationMinutes: 120,
      createdAt: "2026-04-06T09:00:00.000Z",
      updatedAt: "2026-04-06T09:00:00.000Z",
    },
    {
      id: "b2",
      taskId: "study",
      date: "2026-04-06",
      timeSlot: "13:00",
      columnIndex: 0,
      durationMinutes: 60,
      createdAt: "2026-04-06T13:00:00.000Z",
      updatedAt: "2026-04-06T13:00:00.000Z",
    },
    {
      id: "b3",
      taskId: "project",
      date: "2026-04-08",
      timeSlot: "10:00",
      columnIndex: 0,
      durationMinutes: 90,
      createdAt: "2026-04-08T10:00:00.000Z",
      updatedAt: "2026-04-08T10:00:00.000Z",
    },
    {
      id: "deleted-block",
      taskId: "project",
      date: "2026-04-09",
      timeSlot: "10:00",
      columnIndex: 0,
      durationMinutes: 90,
      createdAt: "2026-04-09T10:00:00.000Z",
      updatedAt: "2026-04-09T10:00:00.000Z",
      deletedAt: "2026-04-09T11:00:00.000Z",
    },
    {
      id: "hidden-task-block",
      taskId: "deleted-task",
      date: "2026-04-10",
      timeSlot: "10:00",
      columnIndex: 0,
      durationMinutes: 30,
      createdAt: "2026-04-10T10:00:00.000Z",
      updatedAt: "2026-04-10T10:00:00.000Z",
    },
  ],
  events: [],
};

describe("Month activity derivation", () => {
  it("builds a Monday-first calendar grid with padded weeks", () => {
    const dates = getMonthCalendarDates("2026-04-26");

    expect(dates[0]).toBe("2026-03-30");
    expect(dates[dates.length - 1]).toBe("2026-05-03");
    expect(dates.length % 7).toBe(0);
  });

  it("aggregates completed blocks by day and ignores soft-deleted data", () => {
    const activity = deriveMonthActivity(state, "2026-04-26");
    const aprilSixth = activity.days.find((day) => day.date === "2026-04-06");
    const aprilNinth = activity.days.find((day) => day.date === "2026-04-09");
    const aprilTenth = activity.days.find((day) => day.date === "2026-04-10");

    expect(activity.summary.activeDays).toBe(2);
    expect(activity.summary.totalBlocks).toBe(3);
    expect(activity.summary.totalMinutes).toBe(270);
    expect(activity.summary.topModule).toBe("Project");
    expect(aprilSixth?.tasks.map((task) => task.title)).toEqual(["Project App", "Paper Reading"]);
    expect(aprilSixth?.moduleCounts).toEqual({ Project: 1, Study: 1 });
    expect(aprilNinth?.tasks).toEqual([]);
    expect(aprilTenth?.tasks).toEqual([]);
  });
});
