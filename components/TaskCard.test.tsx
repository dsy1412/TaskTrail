import { DndContext } from "@dnd-kit/core";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
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

  it("lets trackable routine cards record done or rest status", async () => {
    const user = userEvent.setup();
    const onUpdateBlockStatus = vi.fn();
    const routineTask: Task = {
      id: "semester_routine_task_weekday_gym",
      title: "Gym training",
      module: "Health",
      priority: "Medium",
      estimatedDurationMinutes: 90,
      notes: "Routine",
      createdAt: "2026-09-07T10:00:00.000Z",
    };
    const block: ScheduleBlock = {
      id: "semester_routine_block_weekday_gym_2026-09-07",
      taskId: routineTask.id,
      date: "2026-09-07",
      timeSlot: "10:00",
      columnIndex: 0,
      durationMinutes: 90,
      createdAt: "2026-09-07T10:00:00.000Z",
      updatedAt: "2026-09-07T10:00:00.000Z",
    };

    render(
      <DndContext>
        <TaskCard
          task={routineTask}
          block={block}
          variant="scheduled"
          onUpdateBlockStatus={onUpdateBlockStatus}
        />
      </DndContext>,
    );

    await user.click(screen.getByRole("button", { name: "Mark Gym training done" }));
    await user.click(screen.getByRole("button", { name: "Mark Gym training as rest" }));

    expect(onUpdateBlockStatus).toHaveBeenNthCalledWith(1, "done");
    expect(onUpdateBlockStatus).toHaveBeenNthCalledWith(2, "skipped");
  });
});
