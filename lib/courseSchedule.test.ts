import { describe, expect, it } from "vitest";
import { withCourseSchedule } from "@/lib/courseSchedule";
import type { PlannerState } from "@/lib/types";

describe("Fall 2026 course schedule import", () => {
  it("replaces the previous CIS 5450 import with CIS 5810", () => {
    const state: PlannerState = {
      tasks: [
        {
          id: "course_task_cis5450_mw",
          title: "CIS 5450 Big Data Analytics",
          module: "Study",
          priority: "High",
          estimatedDurationMinutes: 89,
          notes: "Old import",
          createdAt: "2026-08-25T04:00:00.000Z",
          deadline: "2026-12-07",
          queued: false,
        },
        {
          id: "course_task_cis5450_f",
          title: "CIS 5450 Big Data Analytics Recitation",
          module: "Study",
          priority: "High",
          estimatedDurationMinutes: 89,
          notes: "Old recitation import",
          createdAt: "2026-08-25T04:00:00.000Z",
          deadline: "2026-12-07",
          queued: false,
        },
      ],
      scheduleBlocks: [
        {
          id: "course_block_cis5450_mw_2026-08-26",
          taskId: "course_task_cis5450_mw",
          date: "2026-08-26",
          timeSlot: "13:45",
          columnIndex: 0,
          durationMinutes: 89,
          createdAt: "2026-08-26T13:45:00.000Z",
          updatedAt: "2026-08-26T13:45:00.000Z",
        },
        {
          id: "course_block_cis5450_f_2026-08-28",
          taskId: "course_task_cis5450_f",
          date: "2026-08-28",
          timeSlot: "13:45",
          columnIndex: 0,
          durationMinutes: 89,
          createdAt: "2026-08-28T13:45:00.000Z",
          updatedAt: "2026-08-28T13:45:00.000Z",
        },
      ],
      events: [
        {
          id: "course_import_fall_2026_v3",
          type: "TASK_UPDATED",
          payload: { source: "course_import_fall_2026" },
          createdAt: "2026-08-25T04:00:00.000Z",
        },
      ],
      journalEntries: [],
    };

    const migrated = withCourseSchedule(state);

    expect(migrated.tasks.find((task) => task.id === "course_task_cis5450_mw")?.deletedAt).toBeTruthy();
    expect(migrated.tasks.find((task) => task.id === "course_task_cis5450_f")?.deletedAt).toBeTruthy();
    expect(migrated.scheduleBlocks.find((block) => block.id === "course_block_cis5450_mw_2026-08-26")?.deletedAt).toBeTruthy();
    expect(migrated.scheduleBlocks.find((block) => block.id === "course_block_cis5450_f_2026-08-28")?.deletedAt).toBeTruthy();
    expect(migrated.tasks.find((task) => task.id === "course_task_cis5810_tr")?.title).toBe(
      "CIS 5810 Computer Vision & Computational Photography",
    );
    expect(migrated.tasks.find((task) => task.id === "course_task_cis5810_tr")?.notes).toContain("TOWN 100");
    expect(migrated.scheduleBlocks).toContainEqual(
      expect.objectContaining({
        id: "course_block_cis5810_tr_2026-08-25",
        timeSlot: "15:30",
        durationMinutes: 89,
      }),
    );
    expect(migrated.scheduleBlocks).toContainEqual(
      expect.objectContaining({
        id: "course_block_cis5810_tr_2026-08-27",
        timeSlot: "15:30",
        durationMinutes: 89,
      }),
    );
    expect(migrated.events.some((event) => event.id === "course_import_fall_2026_v4")).toBe(true);
  });
});
