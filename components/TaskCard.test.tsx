import { DndContext } from "@dnd-kit/core";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TaskCard } from "@/components/TaskCard";
import type { ScheduleBlock, Task } from "@/lib/types";

const task: Task = {
  id: "task_with_notes",
  title: "Communicate eX",
  module: "Career",
  priority: "Medium",
  estimatedDurationMinutes: 60,
  notes: "chatgpt",
  createdAt: "2026-08-27T18:00:00.000Z",
};

function renderScheduledCard(durationMinutes: number) {
  const block: ScheduleBlock = {
    id: `block_${durationMinutes}`,
    taskId: task.id,
    date: "2026-08-27",
    timeSlot: "19:00",
    columnIndex: 0,
    durationMinutes,
    createdAt: "2026-08-27T19:00:00.000Z",
    updatedAt: "2026-08-27T19:00:00.000Z",
  };

  render(
    <DndContext>
      <TaskCard task={task} block={block} variant="scheduled" />
    </DndContext>,
  );
}

describe("TaskCard", () => {
  it("hides notes on short scheduled cards so text cannot spill into the next hour", () => {
    renderScheduledCard(60);

    expect(screen.getByText("Communicate eX")).toBeVisible();
    expect(screen.getByText("19:00-20:00")).toBeVisible();
    expect(screen.queryByText("chatgpt")).not.toBeInTheDocument();
  });

  it("keeps notes visible when a scheduled card has enough vertical room", () => {
    renderScheduledCard(90);

    expect(screen.getByText("chatgpt")).toBeVisible();
  });
});
