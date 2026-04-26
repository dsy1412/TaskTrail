import { addDaysIso, getRangeDates, todayIsoDate } from "@/lib/date";
import type { ModuleName, PlannerState, Priority } from "@/lib/types";

export interface MonthActivityTask {
  blockId: string;
  taskId: string;
  title: string;
  module: ModuleName;
  priority: Priority;
  timeSlot: string;
  durationMinutes: number;
}

export interface MonthActivityDay {
  date: string;
  dayOfMonth: number;
  isCurrentMonth: boolean;
  tasks: MonthActivityTask[];
  moduleCounts: Partial<Record<ModuleName, number>>;
  totalDurationMinutes: number;
}

export interface MonthActivitySummary {
  activeDays: number;
  totalBlocks: number;
  totalMinutes: number;
  moduleCounts: Partial<Record<ModuleName, number>>;
  topModule?: ModuleName;
}

export interface MonthActivity {
  anchorDate: string;
  monthLabel: string;
  days: MonthActivityDay[];
  summary: MonthActivitySummary;
}

export function deriveMonthActivity(
  state: PlannerState,
  anchorDate = todayIsoDate(),
): MonthActivity {
  const monthDates = getRangeDates("month", anchorDate);
  const monthDateSet = new Set(monthDates);
  const currentMonth = anchorDate.slice(0, 7);
  const taskById = new Map(state.tasks.map((task) => [task.id, task]));
  const calendarDates = getMonthCalendarDates(anchorDate);
  const tasksByDate = new Map<string, MonthActivityTask[]>();

  state.scheduleBlocks
    .filter((block) => !block.deletedAt && monthDateSet.has(block.date))
    .forEach((block) => {
      const task = taskById.get(block.taskId);
      if (!task || task.deletedAt) return;

      const item: MonthActivityTask = {
        blockId: block.id,
        taskId: task.id,
        title: task.title,
        module: task.module,
        priority: task.priority,
        timeSlot: block.timeSlot,
        durationMinutes: block.durationMinutes,
      };

      const dateTasks = tasksByDate.get(block.date) ?? [];
      dateTasks.push(item);
      tasksByDate.set(block.date, dateTasks);
    });

  const days = calendarDates.map((date) => {
    const tasks = (tasksByDate.get(date) ?? []).sort((left, right) => left.timeSlot.localeCompare(right.timeSlot));
    return {
      date,
      dayOfMonth: Number(date.slice(8, 10)),
      isCurrentMonth: date.startsWith(currentMonth),
      tasks,
      moduleCounts: countModules(tasks),
      totalDurationMinutes: tasks.reduce((total, task) => total + task.durationMinutes, 0),
    };
  });

  const monthDays = days.filter((day) => day.isCurrentMonth);
  const moduleCounts = monthDays.reduce(
    (counts, day) => {
      Object.entries(day.moduleCounts).forEach(([module, count]) => {
        counts[module as ModuleName] = (counts[module as ModuleName] ?? 0) + (count ?? 0);
      });
      return counts;
    },
    {} as Partial<Record<ModuleName, number>>,
  );

  return {
    anchorDate,
    monthLabel: new Intl.DateTimeFormat("en-US", {
      month: "long",
      year: "numeric",
    }).format(new Date(`${monthDates[0]}T00:00:00`)),
    days,
    summary: {
      activeDays: monthDays.filter((day) => day.tasks.length > 0).length,
      totalBlocks: monthDays.reduce((total, day) => total + day.tasks.length, 0),
      totalMinutes: monthDays.reduce((total, day) => total + day.totalDurationMinutes, 0),
      moduleCounts,
      topModule: getTopModule(moduleCounts),
    },
  };
}

export function getMonthCalendarDates(anchorDate = todayIsoDate()) {
  const monthDates = getRangeDates("month", anchorDate);
  const firstDate = monthDates[0];
  const lastDate = monthDates[monthDates.length - 1];
  const leadingDays = (new Date(`${firstDate}T00:00:00`).getDay() + 6) % 7;
  const trailingDays = 6 - ((new Date(`${lastDate}T00:00:00`).getDay() + 6) % 7);
  const startDate = addDaysIso(firstDate, -leadingDays);
  const visibleDayCount = monthDates.length + leadingDays + trailingDays;

  return Array.from({ length: visibleDayCount }, (_, index) => addDaysIso(startDate, index));
}

function countModules(tasks: MonthActivityTask[]) {
  return tasks.reduce(
    (counts, task) => {
      counts[task.module] = (counts[task.module] ?? 0) + 1;
      return counts;
    },
    {} as Partial<Record<ModuleName, number>>,
  );
}

function getTopModule(moduleCounts: Partial<Record<ModuleName, number>>) {
  return Object.entries(moduleCounts).sort(([, leftCount], [, rightCount]) => (rightCount ?? 0) - (leftCount ?? 0))[0]?.[0] as
    | ModuleName
    | undefined;
}
