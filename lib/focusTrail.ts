import { areConsecutiveDates, getRangeDates, todayIsoDate } from "@/lib/date";
import type { FocusTrailSegment, ModuleName, PlannerState } from "@/lib/types";

export function deriveFocusTrail(
  state: PlannerState,
  range: "day" | "week" | "month",
  anchorDate = todayIsoDate(),
): FocusTrailSegment[] {
  const rangeDates = new Set(getRangeDates(range, anchorDate));
  const taskById = new Map(state.tasks.map((task) => [task.id, task]));
  const grouped = new Map<string, Set<string>>();

  state.scheduleBlocks
    .filter((block) => !block.deletedAt && rangeDates.has(block.date))
    .forEach((block) => {
      const task = taskById.get(block.taskId);
      if (!task || task.deletedAt) return;
      const key = block.taskId;
      if (!grouped.has(key)) grouped.set(key, new Set<string>());
      grouped.get(key)?.add(block.date);
    });

  const segments: FocusTrailSegment[] = [];

  grouped.forEach((dateSet, taskId) => {
    const task = taskById.get(taskId);
    if (!task) return;
    const dates = Array.from(dateSet).sort();
    let chunk: string[] = [];

    dates.forEach((date, index) => {
      const previous = dates[index - 1];
      if (index === 0 || areConsecutiveDates(previous, date)) {
        chunk.push(date);
      } else {
        segments.push(toSegment(task.title, task.module, taskId, chunk));
        chunk = [date];
      }
    });

    if (chunk.length) {
      segments.push(toSegment(task.title, task.module, taskId, chunk));
    }
  });

  return segments.sort((a, b) => {
    if (b.streakLength !== a.streakLength) return b.streakLength - a.streakLength;
    return a.label.localeCompare(b.label);
  });
}

function toSegment(
  label: string,
  module: ModuleName,
  taskId: string,
  dates: string[],
): FocusTrailSegment {
  return {
    id: `${taskId}_${dates[0]}_${dates[dates.length - 1]}`,
    label,
    module,
    startDate: dates[0],
    endDate: dates[dates.length - 1],
    activeDates: dates,
    streakLength: dates.length,
  };
}

export function summarizeFocusByModule(state: PlannerState, range: "week" | "month") {
  const segments = deriveFocusTrail(state, range);
  return segments.reduce(
    (summary, segment) => {
      summary[segment.module] = (summary[segment.module] ?? 0) + segment.activeDates.length;
      return summary;
    },
    {} as Partial<Record<ModuleName, number>>,
  );
}
