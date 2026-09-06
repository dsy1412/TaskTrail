import { describe, expect, it } from "vitest";
import { withCourseSchedule } from "@/lib/courseSchedule";
import { withFall2026LabSemesterPlan } from "@/lib/semesterPlan";
import { withFall2026SemesterRoutine } from "@/lib/semesterRoutine";
import type { PlannerState } from "@/lib/types";

const emptyState: PlannerState = {
  tasks: [],
  scheduleBlocks: [],
  events: [],
  journalEntries: [],
  lexiconEntries: [],
};

describe("Fall 2026 semester routine", () => {
  it("adds the approved study, gym, meal, and internship blocks", () => {
    const state = withFall2026SemesterRoutine(withCourseSchedule(emptyState));

    expect(state.tasks.find((task) => task.id === "semester_routine_task_weekday_gym")).toEqual(
      expect.objectContaining({
        title: "Gym training",
        module: "Health",
        estimatedDurationMinutes: 90,
      }),
    );
    expect(state.tasks.find((task) => task.id === "semester_routine_task_mw_leetcode_patterns")).toEqual(
      expect.objectContaining({
        title: "LeetCode patterns",
        module: "Career",
      }),
    );
    expect(state.scheduleBlocks).toContainEqual(
      expect.objectContaining({
        id: "semester_routine_block_weekday_gym_2026-08-31",
        date: "2026-08-31",
        timeSlot: "10:00",
        durationMinutes: 90,
      }),
    );
    expect(state.scheduleBlocks).toContainEqual(
      expect.objectContaining({
        id: "semester_routine_block_mw_lunch_2026-08-31",
        date: "2026-08-31",
        timeSlot: "13:35",
        durationMinutes: 40,
      }),
    );
    expect(state.scheduleBlocks).toContainEqual(
      expect.objectContaining({
        id: "semester_routine_block_tuth_post_gym_snack_2026-09-01",
        date: "2026-09-01",
        timeSlot: "11:30",
        durationMinutes: 20,
      }),
    );
    expect(state.scheduleBlocks).toContainEqual(
      expect.objectContaining({
        id: "semester_routine_block_tuth_lunch_2026-09-01",
        date: "2026-09-01",
        timeSlot: "13:35",
        durationMinutes: 40,
      }),
    );
    expect(state.scheduleBlocks).toContainEqual(
      expect.objectContaining({
        id: "semester_routine_block_tuth_dinner_2026-09-01",
        date: "2026-09-01",
        timeSlot: "17:10",
        durationMinutes: 40,
      }),
    );
    expect(state.scheduleBlocks).toContainEqual(
      expect.objectContaining({
        id: "semester_routine_block_fri_internship_outreach_2026-08-28",
        date: "2026-08-28",
        timeSlot: "15:30",
      }),
    );
  });

  it("uses another column when a routine block overlaps an existing semester plan block", () => {
    const state = withFall2026SemesterRoutine(withFall2026LabSemesterPlan(withCourseSchedule(emptyState)));
    const labBlock = state.scheduleBlocks.find((block) => block.id === "semester_plan_block_waves_lab_paper_map");
    const routineBlock = state.scheduleBlocks.find(
      (block) => block.id === "semester_routine_block_tuth_cis5810_project_2026-09-01",
    );

    expect(labBlock).toEqual(expect.objectContaining({ date: "2026-09-01", timeSlot: "19:00", columnIndex: 0 }));
    expect(routineBlock).toEqual(expect.objectContaining({ date: "2026-09-01", timeSlot: "18:00" }));
    expect(routineBlock?.columnIndex).not.toBe(labBlock?.columnIndex);
  });
});
