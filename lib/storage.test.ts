import { beforeEach, describe, expect, it } from "vitest";
import { createSeedState, loadPlannerState, savePlannerState } from "@/lib/storage";

describe("planner storage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("creates sample seed data on first load", () => {
    const state = loadPlannerState();

    expect(state.tasks.length).toBeGreaterThan(0);
    expect(state.scheduleBlocks.length).toBeGreaterThan(0);
    expect(state.events.some((event) => event.type === "TASK_CREATED")).toBe(true);
  });

  it("recovers from an accidentally persisted empty state", () => {
    savePlannerState({ tasks: [], scheduleBlocks: [], events: [] });

    const state = loadPlannerState();

    expect(state.tasks.length).toBeGreaterThan(0);
    expect(state.events.length).toBeGreaterThan(0);
  });

  it("recovers from a partial state that has events but lost task entities", () => {
    savePlannerState({
      tasks: [],
      scheduleBlocks: [],
      events: [
        {
          id: "evt_orphan",
          type: "TASK_CREATED",
          payload: {},
          createdAt: "2026-04-26T00:00:00.000Z",
        },
      ],
    });

    const state = loadPlannerState();

    expect(state.tasks.length).toBeGreaterThan(0);
    expect(state.scheduleBlocks.length).toBeGreaterThan(0);
  });

  it("recovers when every persisted task is soft-deleted", () => {
    savePlannerState({
      tasks: [
        {
          id: "task_deleted",
          title: "Deleted",
          module: "Project",
          priority: "Medium",
          estimatedDurationMinutes: 60,
          notes: "",
          createdAt: "2026-04-26T00:00:00.000Z",
          deletedAt: "2026-04-26T01:00:00.000Z",
        },
      ],
      scheduleBlocks: [],
      events: [
        {
          id: "evt_deleted",
          type: "TASK_DELETED",
          taskId: "task_deleted",
          payload: {},
          createdAt: "2026-04-26T01:00:00.000Z",
        },
      ],
    });

    const state = loadPlannerState();

    expect(state.tasks.some((task) => !task.deletedAt)).toBe(true);
  });

  it("seed data starts the MVP with only the primary priority column populated today", () => {
    const state = createSeedState();
    const maxColumn = state.scheduleBlocks.reduce((max, block) => Math.max(max, block.columnIndex), 0);

    expect(maxColumn).toBe(0);
  });
});
