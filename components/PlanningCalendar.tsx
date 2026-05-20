"use client";

import { CalendarRange, ChevronLeft, ChevronRight, Clock3, Layers3, LocateFixed, Maximize2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { todayIsoDate } from "@/lib/date";
import type { ModuleName, PlannerState, Priority, Task } from "@/lib/types";

const weekdayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const moduleDots: Record<ModuleName, string> = {
  Study: "bg-sky-500",
  Project: "bg-indigo-500",
  Health: "bg-emerald-500",
  Career: "bg-rose-500",
  "Weekly Plan": "bg-amber-500",
  "Monthly Plan": "bg-teal-500",
};

const priorityTone: Record<Priority, string> = {
  High: "bg-rose-50 text-rose-700",
  Medium: "bg-amber-50 text-amber-700",
  Low: "bg-slate-100 text-slate-600",
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
  const moduleCounts = countModules(monthBlocks);

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
    <section data-testid="planning-calendar-view" className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="glass-panel overflow-hidden rounded-[1.6rem] sm:rounded-[2rem]">
        <div className="flex flex-col gap-4 border-b border-white/70 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
              <CalendarRange className="h-4 w-4" />
              Future planning map
            </div>
            <h2 className="mt-1 text-xl font-semibold tracking-normal sm:text-2xl">Planning Calendar</h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 rounded-full bg-white/72 p-1 shadow-sm">
              <button
                type="button"
                aria-label="Previous month"
                title="Previous month"
                className="rounded-full p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-950"
                onClick={() => shiftMonth(-1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label="Go to current month"
                title="Current month"
                className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
                onClick={jumpToToday}
              >
                <LocateFixed className="h-3.5 w-3.5" />
                Today
              </button>
              <button
                type="button"
                aria-label="Next month"
                title="Next month"
                className="rounded-full p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-950"
                onClick={() => shiftMonth(1)}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            <div className="rounded-full bg-white/72 px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm">
              {month.label}
            </div>
          </div>
        </div>

        <div className="fine-scrollbar overflow-x-auto p-3 sm:p-4">
          <div className="min-w-[46rem]">
            <div className="grid grid-cols-7 gap-2 text-center text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-slate-400">
              {weekdayLabels.map((label) => (
                <span key={label}>{label}</span>
              ))}
            </div>

            <div className="mt-2 grid grid-cols-7 gap-2">
              {month.days.map((day) => {
                const blocks = blocksByDate.get(day.date) ?? [];
                const isSelected = selectedDate === day.date;
                const isToday = today === day.date;
                const dayMinutes = blocks.reduce((sum, block) => sum + block.durationMinutes, 0);

                return (
                  <button
                    key={day.date}
                    type="button"
                    data-testid={`planning-day-${day.date}`}
                    aria-label={`Select ${day.date}`}
                    onClick={() => onSelectDate(day.date)}
                    className={`min-h-36 rounded-2xl border p-2 text-left transition hover:-translate-y-0.5 hover:shadow-md ${
                      isSelected
                        ? "border-slate-950 bg-white shadow-lg"
                        : blocks.length
                          ? "border-white bg-white/78 shadow-sm"
                          : "border-white/70 bg-white/34"
                    } ${day.isCurrentMonth ? "" : "opacity-40"}`}
                  >
                    <div className="flex items-start justify-between gap-1">
                      <span
                        className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                          isToday ? "bg-slate-950 text-white" : "text-slate-600"
                        }`}
                      >
                        {day.dayOfMonth}
                      </span>
                      {blocks.length ? (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[0.65rem] font-bold text-slate-600">
                          {formatMinutes(dayMinutes)}
                        </span>
                      ) : null}
                    </div>

                    <div className="mt-3 flex min-h-3 flex-wrap gap-1">
                      {[...new Set(blocks.map((block) => block.module))].map((module) => (
                        <span key={module} title={module} className={`h-2.5 w-2.5 rounded-full ${moduleDots[module]}`} />
                      ))}
                    </div>

                    <div className="mt-2 space-y-1.5">
                      {blocks.slice(0, 3).map((block) => (
                        <div key={block.id} className="rounded-xl bg-white/78 px-2 py-1 shadow-sm">
                          <p className="truncate text-[0.68rem] font-semibold text-slate-800">{block.title}</p>
                          <p className="mt-0.5 text-[0.62rem] font-semibold text-slate-400">{block.timeSlot}</p>
                        </div>
                      ))}
                      {blocks.length > 3 ? (
                        <p className="px-1 text-[0.65rem] font-semibold text-slate-400">+{blocks.length - 3} more</p>
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <aside className="glass-panel rounded-[2rem] p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
              <Layers3 className="h-4 w-4" />
              {selectedDate}
            </div>
            <h3 className="mt-1 text-lg font-semibold">Day plan</h3>
          </div>
          <button
            type="button"
            aria-label="Open selected day in Today Canvas"
            title="Open in Today Canvas"
            className="rounded-full bg-white p-2 text-slate-600 shadow-sm transition hover:text-slate-950"
            onClick={onOpenDay}
          >
            <Maximize2 className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <SummaryTile label="Month days" value={`${plannedDays}`} />
          <SummaryTile label="Month focus" value={formatMinutes(totalMinutes)} />
        </div>

        <div className="mt-4 space-y-2">
          {selectedBlocks.length ? (
            selectedBlocks.map((block) => (
              <div key={block.id} className="rounded-2xl bg-white/66 p-3 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-950">{block.title}</p>
                    <p className="mt-1 flex items-center gap-2 text-xs font-semibold text-slate-500">
                      <span className={`h-2.5 w-2.5 rounded-full ${moduleDots[block.module]}`} />
                      {block.module}
                    </p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-1 text-[0.65rem] font-bold ${priorityTone[block.priority]}`}>
                    {block.priority}
                  </span>
                </div>
                <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                  <Clock3 className="h-3.5 w-3.5" />
                  {block.timeSlot} - {formatMinutes(block.durationMinutes)}
                </p>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white/44 p-6 text-center text-sm font-semibold text-slate-500">
              No planned blocks on this day yet.
            </div>
          )}
        </div>

        {moduleCounts.length ? (
          <div className="mt-5">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Month mix</p>
            <div className="mt-2 space-y-2">
              {moduleCounts.map(([module, count]) => (
                <div key={module} className="flex items-center justify-between gap-2 text-xs font-semibold text-slate-600">
                  <span className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${moduleDots[module]}`} />
                    {module}
                  </span>
                  <span>{count}</span>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </aside>
    </section>
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

function buildMonthGrid(anchorMonth: string) {
  const firstOfMonth = new Date(`${anchorMonth}-01T00:00:00`);
  const start = new Date(firstOfMonth);
  start.setDate(firstOfMonth.getDate() - ((firstOfMonth.getDay() + 6) % 7));

  const days = Array.from({ length: 42 }, (_, index) => {
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

function countModules(blocks: PlannedBlock[]) {
  const counts = new Map<ModuleName, number>();
  blocks.forEach((block) => counts.set(block.module, (counts.get(block.module) ?? 0) + 1));
  return [...counts.entries()].sort(([, left], [, right]) => right - left);
}

function SummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/66 p-3 shadow-sm">
      <p className="text-lg font-semibold text-slate-950">{value}</p>
      <p className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-slate-400">{label}</p>
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
