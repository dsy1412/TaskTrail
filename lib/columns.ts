import type { ScheduleBlock } from "@/lib/types";

export function getScheduledColumnCount(scheduleBlocks: ScheduleBlock[], date: string) {
  return scheduleBlocks
    .filter((block) => !block.deletedAt && block.date === date)
    .reduce((max, block) => Math.max(max, block.columnIndex + 1), 1);
}

export function getVisibleColumnCount({
  scheduledColumnCount,
  draftColumnCount,
  isDragging,
  maxColumns,
}: {
  scheduledColumnCount: number;
  draftColumnCount: number;
  isDragging: boolean;
  maxColumns: number;
}) {
  return Math.min(maxColumns, Math.max(scheduledColumnCount, isDragging ? draftColumnCount : 1));
}
