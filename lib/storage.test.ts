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
    expect(state.journalEntries).toEqual([]);
    expect(state.lexiconEntries.some((entry) => entry.word === "radiance")).toBe(true);
    expect(state.lexiconEntries.some((entry) => entry.word === "BRDF")).toBe(true);
    expect(state.lexiconEntries.some((entry) => entry.word === "framing")).toBe(true);
  });

  it("recovers from an accidentally persisted empty state", () => {
    savePlannerState({ tasks: [], scheduleBlocks: [], events: [], journalEntries: [], lexiconEntries: [] });

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
      journalEntries: [],
      lexiconEntries: [],
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
      journalEntries: [],
      lexiconEntries: [],
    });

    const state = loadPlannerState();

    expect(state.tasks.some((task) => !task.deletedAt)).toBe(true);
  });

  it("seed data starts the MVP with only the primary priority column populated today", () => {
    const state = createSeedState();
    const maxColumn = state.scheduleBlocks.reduce((max, block) => Math.max(max, block.columnIndex), 0);

    expect(maxColumn).toBe(0);
  });

  it("imports CIS 5810 Fall 2026 assignment deadlines", () => {
    const state = createSeedState();
    const assignments = state.tasks.filter((task) => task.id.startsWith("cis5810_assignment_task_"));

    expect(assignments).toHaveLength(10);
    expect(assignments.map((task) => task.title)).toContain("CIS 5810 Project 1: Dolly Zoom");
    expect(assignments.map((task) => task.title)).toContain("CIS 5810 Project 7: Hand Pose Estimation");
    expect(state.scheduleBlocks.some((block) => block.id === "cis5810_assignment_block_project_1_dolly_zoom")).toBe(true);
    expect(state.scheduleBlocks.some((block) => block.id === "cis5810_assignment_block_project_7_hand_pose_estimation")).toBe(true);
  });

  it("migrates older persisted states with no journal or lexicon entries", () => {
    window.localStorage.setItem(
      "tasktrail.mvp.state.v1",
      JSON.stringify({
        tasks: [
          {
            id: "task_old",
            title: "Old task",
            module: "Project",
            priority: "Medium",
            estimatedDurationMinutes: 60,
            notes: "",
            createdAt: "2026-04-26T00:00:00.000Z",
          },
        ],
        scheduleBlocks: [],
        events: [],
      }),
    );

    const state = loadPlannerState();

    expect(state.journalEntries).toEqual([]);
    expect(state.lexiconEntries.some((entry) => entry.word === "radiance")).toBe(true);
  });

  it("migrates older lexicon cards with no pronunciation fields", () => {
    window.localStorage.setItem(
      "tasktrail.mvp.state.v1",
      JSON.stringify({
        tasks: [
          {
            id: "task_old",
            title: "Old task",
            module: "Project",
            priority: "Medium",
            estimatedDurationMinutes: 60,
            notes: "",
            createdAt: "2026-04-26T00:00:00.000Z",
          },
        ],
        scheduleBlocks: [],
        events: [],
        journalEntries: [],
        lexiconEntries: [
          {
            id: "lexicon_old",
            word: "posterior",
            fieldContext: "ML",
            meaning: "after observing data",
            association: "",
            example: "",
            related: [],
            reviewCount: 0,
            createdAt: "2026-04-26T00:00:00.000Z",
            updatedAt: "2026-04-26T00:00:00.000Z",
          },
        ],
      }),
    );

    const state = loadPlannerState();

    expect(state.lexiconEntries[0]).toEqual(expect.objectContaining({ ipa: "", phonics: "" }));
  });
});
