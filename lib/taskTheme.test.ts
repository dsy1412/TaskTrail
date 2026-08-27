import { describe, expect, it } from "vitest";
import { taskAccent } from "@/lib/taskTheme";

describe("taskAccent", () => {
  it("keeps a task color stable from its identity", () => {
    const task = { id: "seed_study", title: "Read paper notes" };

    expect(taskAccent(task)).toEqual(taskAccent(task));
  });

  it("gives different tasks in the same module different colors", () => {
    const readPaper = { id: "seed_study", title: "Read paper notes" };
    const orientation = { id: "task_mse_orientation", title: "mse Orientation" };

    expect(taskAccent(readPaper).color).not.toBe(taskAccent(orientation).color);
  });

  it("marks CIS 5810 assignments in red", () => {
    const assignment = { id: "cis5810_assignment_task_project_1_dolly_zoom", title: "CIS 5810 Project 1: Dolly Zoom" };

    expect(taskAccent(assignment).color).toBe("#ef4444");
  });
});
