"use client";

import { CalendarRange, ChevronLeft, ChevronRight, Clock3, Layers3, LocateFixed, Maximize2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { todayIsoDate } from "@/lib/date";
import { moduleTheme } from "@/lib/moduleTheme";
import { MODULES, type ModuleName, type PlannerState, type Priority, type Task } from "@/lib/types";

const weekdayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const priorityTone: Record<Priority, string> = {
  High: "border-rose-500/40 bg-rose-500/12 text-rose-200",
  Medium: "border-amber-500/40 bg-amber-500/12 text-amber-200",
  Low: "border-slate-500/40 bg-slate-700 text-slate-200",
};

export function PlanningCalendar({
  state,
  tasksById,
  selectedDate,
  onSelectDate,
  onOpenDay,
}: {
  state: PlannerState;
  tasksById: Map<string, Task>;
  selectedDate: string;
  onSelectDate: (date: string) => void;
  onOpenDay: () => void;
}) {
  const today = todayIsoDate();
  const [anchorMonth, setAnchorMonth] = useState(selectedDate.slice(0, 7));

  useEffect(() => {
    setAnchorMonth(selectedDate.slice(0, 7));
  }, [selectedDate]);

  const month = useMemo(() => buildMonthGrid(anchorMonth), [anchorMonth]);
  const blocksByDate = useMemo(() => {
    const grouped = new Map<string, PlannedBlock[]>();
    state.scheduleBlocks
      .filter((block) => !block.deletedAt)
      .forEach((block) => {
        const task = tasksById.get(block.taskId);
        if (!task || task.deletedAt) return;
        const plannedBlock: PlannedBlock = {
          id: block.id,
          date: block.date,
          timeSlot: block.timeSlot,
          durationMinutes: block.durationMinutes,
          title: task.title,
          module: task.module,
          priority: task.priority,
        };
        grouped.set(block.date, [...(grouped.get(block.date) ?? []), plannedBlock]);
      });

    grouped.forEach((blocks) => blocks.sort((left, right) => left.timeSlot.localeCompare(right.timeSlot)));
    return grouped;
  }, [state.scheduleBlocks, tasksById]);

  const monthBlocks = month.days.flatMap((day) => (day.isCurrentMonth ? blocksByDate.get(day.date) ?? [] : []));
  const selectedBlocks = blocksByDate.get(selectedDate) ?? [];
  const plannedDays = new Set(monthBlocks.map((block) => block.date)).size;
  const totalMinutes = monthBlocks.reduce((sum, block) => sum + block.durationMinutes, 0);
  const moduleStats = summarizeModules(monthBlocks);

  function shiftMonth(months: number) {
    setAnchorMonth((current) => {
      const next = new Date(`${current}-01T00:00:00`);
      next.setMonth(next.getMonth() + months);
      return next.toISOString().slice(0, 7);
    });
  }

  function jumpToToday() {
    onSelectDate(today);
    setAnchorMonth(today.slice(0, 7));
  }

  return (
    <section data-testid="planning-calendar-view" className="grid gap-4 2xl:grid-cols-[minmax(0,1fr)_24rem]">
      <div className="glass-panel overflow-hidden rounded-xl">
        <div className="flex flex-col gap-4 border-b border-slate-800 px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-400">
              <CalendarRange className="h-4 w-4" />
              Month planning map
            </div>
            <div className="mt-1 flex flex-wrap items-end gap-x-4 gap-y-1">
              <h2 className="text-2xl font-semibold tracking-normal text-slate-50">Planning Calendar</h2>
              <p className="text-sm font-semibold text-slate-400">
                {plannedDays} active days / {formatMinutes(totalMinutes)}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-950 p-1 shadow-sm">
              <button
                type="button"
                aria-label="Previous month"
                title="Previous month"
                className="rounded-md p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-slate-50"
                onClick={() => shiftMonth(-1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label="Go to current month"
                title="Current month"
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-slate-300 transition hover:bg-slate-800 hover:text-slate-50"
                onClick={jumpToToday}
              >
                <LocateFixed className="h-3.5 w-3.5" />
                Today
              </button>
              <button
                type="button"
                aria-label="Next month"
                title="Next month"
                className="rounded-md p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-slate-50"
                onClick={() => shiftMonth(1)}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            <div className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-semibold text-slate-100 shadow-sm">
              {month.label}
            </div>
          </div>
        </div>

        <div className="fine-scrollbar overflow-x-auto px-3 pb-4 pt-3 lg:px-4">
          <div className="min-w-[64rem]">
            <div className="grid grid-cols-7 gap-2 text-center text-[0.68rem] font-bold uppercase text-slate-500">
              {weekdayLabels.map((label) => (
                <span key={label}>{label}</span>
              ))}
            </div>

            <div className="mt-2 grid grid-cols-7 gap-2">
              {month.days.map((day) => (
                <CalendarDay
                  key={day.date}
                  day={day}
                  today={today}
                  selectedDate={selectedDate}
                  blocks={blocksByDate.get(day.date) ?? []}
                  onSelectDate={onSelectDate}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <aside className="glass-panel rounded-xl p-4">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-400">
              <Layers3 className="h-4 w-4" />
              {selectedDate}
            </div>
            <h3 className="mt-1 text-xl font-semibold text-slate-50">Day plan</h3>
          </div>
          <button
            type="button"
            aria-label="Open selected day in Today Canvas"
            title="Open in Today Canvas"
            className="rounded-lg border border-slate-700 bg-slate-950 p-2 text-slate-300 shadow-sm transition hover:text-slate-50"
            onClick={onOpenDay}
          >
            <Maximize2 className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <SummaryTile label="Active days" value={`${plannedDays}`} />
          <SummaryTile label="Month focus" value={formatMinutes(totalMinutes)} />
        </div>

        <div className="mt-4 space-y-2">
          {selectedBlocks.length ? (
            selectedBlocks.map((block) => (
              <div
                key={block.id}
                className="rounded-lg border border-slate-800 bg-slate-950/70 p-3 shadow-sm"
                style={{ borderLeftColor: moduleTheme[block.module].color, borderLeftWidth: 4 }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-50">{block.title}</p>
                    <p className="mt-1 flex items-center gap-2 text-xs font-semibold text-slate-400">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: moduleTheme[block.module].color }}
                      />
                      {block.module}
                    </p>
                  </div>
                  <span className={`shrink-0 rounded-md border px-2 py-1 text-[0.65rem] font-bold ${priorityTone[block.priority]}`}>
                    {block.priority}
                  </span>
                </div>
                <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-slate-400">
                  <Clock3 className="h-3.5 w-3.5" />
                  {block.timeSlot} / {formatMinutes(block.durationMinutes)}
                </p>
              </div>
            ))
          ) : (
            <div className="rounded-lg border border-dashed border-slate-700 bg-slate-950/50 p-6 text-center text-sm font-semibold text-slate-400">
              No planned blocks on this day yet.
            </div>
          )}
        </div>

        <div className="mt-5">
          <p className="text-xs font-bold uppercase text-slate-500">Month color lanes</p>
          <div className="mt-3 space-y-2">
            {MODULES.map((module) => {
              const stat = moduleStats.find((item) => item.module === module);
              const minutes = stat?.minutes ?? 0;
              const count = stat?.count ?? 0;
              const width = totalMinutes ? Math.max(8, (minutes / totalMinutes) * 100) : 0;

              return (
                <div key={module}>
                  <div className="mb-1 flex items-center justify-between gap-2 text-xs font-semibold text-slate-300">
                    <span className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: moduleTheme[module].color }} />
                      {module}
                    </span>
                    <span className="text-slate-500">{count}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-800">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${width}%`, backgroundColor: moduleTheme[module].color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </aside>
    </section>
  );
}

function CalendarDay({
  day,
  today,
  selectedDate,
  blocks,
  onSelectDate,
}: {
  day: MonthDay;
  today: string;
  selectedDate: string;
  blocks: PlannedBlock[];
  onSelectDate: (date: string) => void;
}) {
  const isSelected = selectedDate === day.date;
  const isToday = today === day.date;
  const dayMinutes = blocks.reduce((sum, block) => sum + block.durationMinutes, 0);
  const activeModules = new Set(blocks.map((block) => block.module));
  const topModules = [...activeModules].slice(0, 2);

  return (
    <button
      type="button"
      data-testid={`planning-day-${day.date}`}
      aria-label={`Select ${day.date}`}
      onClick={() => onSelectDate(day.date)}
      className={`relative min-h-[9.25rem] rounded-lg border p-2 text-left transition hover:-translate-y-0.5 hover:shadow-xl ${
        isSelected
          ? "border-cyan-300 bg-slate-950 shadow-[0_0_0_1px_rgba(103,232,249,0.4)]"
          : blocks.length
            ? "border-slate-700 bg-slate-950/82"
            : "border-slate-800 bg-slate-950/46"
      } ${day.isCurrentMonth ? "" : "opacity-35"}`}
    >
      <div className="flex items-start justify-between gap-1">
        <span
          className={`flex h-7 w-7 items-center justify-center rounded-md text-xs font-bold ${
            isToday ? "bg-cyan-300 text-slate-950" : "text-slate-200"
          }`}
        >
          {day.dayOfMonth}
        </span>
        {blocks.length ? (
          <span className="rounded-md bg-slate-800 px-2 py-0.5 text-[0.65rem] font-bold text-slate-200">
            {formatMinutes(dayMinutes)}
          </span>
        ) : null}
      </div>

      <div className="mt-3 grid gap-1">
        {MODULES.map((module) => (
          <span
            key={module}
            className="h-1.5 rounded-full"
            style={{
              backgroundColor: activeModules.has(module) ? moduleTheme[module].color : "rgba(30, 41, 59, 0.72)",
              opacity: activeModules.has(module) ? 1 : 0.55,
            }}
            title={module}
          />
        ))}
      </div>

      <div className="mt-3 space-y-1.5">
        {blocks.slice(0, 2).map((block) => (
          <div key={block.id} className="min-w-0 rounded-md bg-slate-900 px-2 py-1">
            <p className="truncate text-[0.72rem] font-semibold text-slate-100">{block.title}</p>
            <p className="mt-0.5 text-[0.62rem] font-semibold text-slate-500">{block.timeSlot}</p>
          </div>
        ))}
      </div>

      {topModules.length ? (
        <div className="absolute bottom-2 left-2 right-2 flex flex-wrap gap-1">
          {topModules.map((module) => (
            <span
              key={module}
              className="rounded-md px-1.5 py-0.5 text-[0.6rem] font-bold text-white"
              style={{ backgroundColor: moduleTheme[module].color }}
            >
              {module}
            </span>
          ))}
          {activeModules.size > 2 ? (
            <span className="rounded-md bg-slate-700 px-1.5 py-0.5 text-[0.6rem] font-bold text-slate-200">
              +{activeModules.size - 2}
            </span>
          ) : null}
        </div>
      ) : null}
    </button>
  );
}

interface PlannedBlock {
  id: string;
  date: string;
  timeSlot: string;
  durationMinutes: number;
  title: string;
  module: ModuleName;
  priority: Priority;
}

interface MonthDay {
  date: string;
  dayOfMonth: number;
  isCurrentMonth: boolean;
}

function buildMonthGrid(anchorMonth: string) {
  const firstOfMonth = new Date(`${anchorMonth}-01T00:00:00`);
  const start = new Date(firstOfMonth);
  start.setDate(firstOfMonth.getDate() - ((firstOfMonth.getDay() + 6) % 7));

  const days: MonthDay[] = Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    const isoDate = date.toISOString().slice(0, 10);
    return {
      date: isoDate,
      dayOfMonth: date.getDate(),
      isCurrentMonth: date.getMonth() === firstOfMonth.getMonth(),
    };
  });

  return {
    days,
    label: new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric" }).format(firstOfMonth),
  };
}

function summarizeModules(blocks: PlannedBlock[]) {
  const stats = new Map<ModuleName, { module: ModuleName; count: number; minutes: number }>();
  blocks.forEach((block) => {
    const current = stats.get(block.module) ?? { module: block.module, count: 0, minutes: 0 };
    stats.set(block.module, {
      module: block.module,
      count: current.count + 1,
      minutes: current.minutes + block.durationMinutes,
    });
  });
  return [...stats.values()].sort((left, right) => right.minutes - left.minutes);
}

function SummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3 shadow-sm">
      <p className="text-lg font-semibold text-slate-50">{value}</p>
      <p className="text-[0.65rem] font-bold uppercase text-slate-500">{label}</p>
    </div>
  );
}

function formatMinutes(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (hours && remainder) return `${hours}h ${remainder}m`;
  if (hours) return `${hours}h`;
  return `${remainder}m`;
}
