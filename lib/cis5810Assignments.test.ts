import { describe, expect, it } from "vitest";
import { withCis5810Assignments } from "@/lib/cis5810Assignments";
import type { PlannerState } from "@/lib/types";

describe("CIS 5810 assignment import", () => {
  it("repairs missing deadline blocks even when the import marker already exists", () => {
    const state: PlannerState = {
      tasks: [],
      scheduleBlocks: [],
      events: [
        {
          id: "cis5810_fall_2026_assignments_import_v1",
          type: "TASK_UPDATED",
          payload: { source: "cis5810_fall_2026_assignments" },
          createdAt: "2026-08-27T05:00:00.000Z",
        },
      ],
      journalEntries: [],
    };

    const repaired = withCis5810Assignments(state);

    expect(repaired.tasks.some((task) => task.id === "cis5810_assignment_task_project_1_dolly_zoom")).toBe(true);
    expect(repaired.scheduleBlocks).toContainEqual(
      expect.objectContaining({
        id: "cis5810_assignment_block_project_1_dolly_zoom",
        date: "2026-08-31",
        timeSlot: "23:00",
      }),
    );
    expect(repaired.scheduleBlocks).toContainEqual(
      expect.objectContaining({
        id: "cis5810_assignment_block_project_7_hand_pose_estimation",
        date: "2026-11-09",
        timeSlot: "23:00",
      }),
    );
  });
});
