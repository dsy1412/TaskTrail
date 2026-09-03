import { describe, expect, it } from "vitest";
import { withCis5210Assignments } from "@/lib/cis5210Assignments";
import type { PlannerState } from "@/lib/types";

describe("CIS 5210 assignment import", () => {
  it("repairs missing deadline blocks even when the import marker already exists", () => {
    const state: PlannerState = {
      tasks: [],
      scheduleBlocks: [],
      events: [
        {
          id: "cis5210_fall_2026_assignments_import_v1",
          type: "TASK_UPDATED",
          payload: { source: "cis5210_fall_2026_gradescope_assignments" },
          createdAt: "2026-09-03T12:00:00.000Z",
        },
      ],
      journalEntries: [],
      lexiconEntries: [],
    };

    const repaired = withCis5210Assignments(state);

    expect(repaired.tasks.some((task) => task.id === "cis5210_assignment_task_homework_1_python_skills")).toBe(true);
    expect(repaired.tasks.some((task) => task.title === "CIS 5210 Homework 5: Sudoku Games")).toBe(true);
    expect(repaired.scheduleBlocks).toContainEqual(
      expect.objectContaining({
        id: "cis5210_assignment_block_homework_2_uninformed_search",
        date: "2026-09-09",
        timeSlot: "23:00",
      }),
    );
    expect(repaired.scheduleBlocks).toContainEqual(
      expect.objectContaining({
        id: "cis5210_assignment_block_homework_5_sudoku_games",
        date: "2026-09-30",
        timeSlot: "23:00",
      }),
    );
  });
});
