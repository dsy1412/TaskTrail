import { describe, expect, it } from "vitest";
import { getScheduledColumnCount, getVisibleColumnCount } from "@/lib/columns";
import type { ScheduleBlock } from "@/lib/types";

const blocks: ScheduleBlock[] = [
  {
    id: "primary",
    taskId: "task",
    date: "2026-04-26",
    timeSlot: "09:00",
    columnIndex: 0,
    durationMinutes: 60,
    createdAt: "2026-04-26T00:00:00.000Z",
    updatedAt: "2026-04-26T00:00:00.000Z",
  },
  {
    id: "fourth-column",
    taskId: "task",
    date: "2026-04-26",
    timeSlot: "10:00",
    columnIndex: 3,
    durationMinutes: 60,
    createdAt: "2026-04-26T00:00:00.000Z",
    updatedAt: "2026-04-26T00:00:00.000Z",
  },
  {
    id: "tomorrow-deleted",
    taskId: "task",
    date: "2026-04-27",
    timeSlot: "10:00",
    columnIndex: 3,
    durationMinutes: 60,
    createdAt: "2026-04-26T00:00:00.000Z",
    updatedAt: "2026-04-26T00:00:00.000Z",
    deletedAt: "2026-04-26T01:00:00.000Z",
  },
];

describe("column derivation", () => {
  it("derives columns from active blocks on the selected date", () => {
    expect(getScheduledColumnCount(blocks, "2026-04-26")).toBe(4);
    expect(getScheduledColumnCount(blocks, "2026-04-27")).toBe(1);
  });

  it("uses draft expansion only while dragging, then shrinks back to scheduled columns", () => {
    expect(
      getVisibleColumnCount({
        scheduledColumnCount: 1,
        draftColumnCount: 4,
        isDragging: true,
        maxColumns: 4,
      }),
    ).toBe(4);

    expect(
      getVisibleColumnCount({
        scheduledColumnCount: 1,
        draftColumnCount: 4,
        isDragging: false,
        maxColumns: 4,
      }),
    ).toBe(1);
  });
});
