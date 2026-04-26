"use client";

import { motion } from "framer-motion";
import { CalendarDays, CheckCircle2, Clock3, Layers3 } from "lucide-react";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { todayIsoDate } from "@/lib/date";
import { deriveMonthActivity } from "@/lib/monthActivity";
import type { ModuleName, PlannerState } from "@/lib/types";

const weekdayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const moduleStyles: Record<ModuleName, { dot: string; bg: string; text: string; ring: string }> = {
  Study: {
    dot: "bg-sky-500",
    bg: "bg-sky-50",
    text: "text-sky-700",
    ring: "ring-sky-200",
  },
  Project: {
    dot: "bg-indigo-500",
    bg: "bg-indigo-50",
    text: "text-indigo-700",
    ring: "ring-indigo-200",
  },
  Health: {
    dot: "bg-emerald-500",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    ring: "ring-emerald-200",
  },
  Career: {
    dot: "bg-rose-500",
    bg: "bg-rose-50",
    text: "text-rose-700",
    ring: "ring-rose-200",
  },
  "Weekly Plan": {
    dot: "bg-amber-500",
    bg: "bg-amber-50",
    text: "text-amber-700",
    ring: "ring-amber-200",
  },
  "Monthly Plan": {
    dot: "bg-teal-500",
    bg: "bg-teal-50",
    text: "text-teal-700",
    ring: "ring-teal-200",
  },
};

export function MonthActivityCalendar({ state }: { state: PlannerState }) {
  const activity = useMemo(() => deriveMonthActivity(state), [state]);
  const today = todayIsoDate();
  const firstActiveDate = activity.days.find((day) => day.isCurrentMonth && day.tasks.length > 0)?.date;
  const firstMonthDate = activity.days.find((day) => day.isCurrentMonth)?.date ?? activity.anchorDate;
  const [selectedDate, setSelectedDate] = useState(firstActiveDate ?? firstMonthDate);
  const selectedDay =
    activity.days.find((day) => day.date === selectedDate) ??
    activity.days.find((day) => day.date === firstActiveDate) ??
    activity.days.find((day) => day.isCurrentMonth);

  const topModules = Object.entries(activity.summary.moduleCounts)
    .sort(([, leftCount], [, rightCount]) => (rightCount ?? 0) - (leftCount ?? 0))
    .slice(0, 4) as Array<[ModuleName, number]>;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      data-testid="month-activity-calendar"
      className="grid gap-5"
    >
      <div className="grid gap-4 rounded-[1.75rem] border border-white/80 bg-white/58 p-4 shadow-sm lg:grid-cols-[minmax(0,1fr)_16rem]">
        <div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                <CalendarDays className="h-4 w-4" />
                Month view
              </div>
              <h3 className="mt-1 text-xl font-semibold text-slate-950">{activity.monthLabel}</h3>
            </div>
            <div className="flex flex-wrap gap-2 text-xs font-semibold text-slate-600">
              <span className="rounded-full bg-white px-3 py-1.5 shadow-sm">
                {activity.summary.activeDays} active days
              </span>
              <span className="rounded-full bg-white px-3 py-1.5 shadow-sm">
                {activity.summary.totalBlocks} completed blocks
              </span>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-7 gap-2 text-center text-[0.7rem] font-semibold text-slate-400">
            {weekdayLabels.map((label) => (
              <span key={label}>{label}</span>
            ))}
          </div>

          <div className="mt-2 grid grid-cols-7 gap-2">
            {activity.days.map((day) => {
              const isSelected = selectedDay?.date === day.date;
              const isToday = day.date === today;
              const activeModules = Object.keys(day.moduleCounts) as ModuleName[];

              return (
                <button
                  key={day.date}
                  type="button"
                  data-testid={`month-day-${day.date}`}
                  aria-label={`View ${day.date} activity`}
                  onClick={() => setSelectedDate(day.date)}
                  className={`min-h-24 rounded-2xl border p-2 text-left transition hover:-translate-y-0.5 hover:shadow-md ${
                    isSelected
                      ? "border-slate-950 bg-white shadow-lg"
                      : day.tasks.length
                        ? "border-white bg-white/76 shadow-sm"
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
                    {day.tasks.length ? (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[0.65rem] font-bold text-slate-600">
                        {day.tasks.length}
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-3 flex min-h-4 flex-wrap gap-1">
                    {activeModules.map((module) => (
                      <span
                        key={module}
                        title={module}
                        className={`h-2.5 w-2.5 rounded-full ${moduleStyles[module].dot}`}
                      />
                    ))}
                  </div>

                  <div className="mt-2 space-y-1">
                    {day.tasks.slice(0, 2).map((task) => (
                      <p key={task.blockId} className="truncate text-[0.68rem] font-semibold text-slate-700">
                        {task.title}
                      </p>
                    ))}
                    {day.tasks.length > 2 ? (
                      <p className="text-[0.65rem] font-semibold text-slate-400">+{day.tasks.length - 2} more</p>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <aside className="rounded-[1.5rem] bg-white/72 p-4 shadow-sm" data-testid="selected-month-day-detail">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
            <CheckCircle2 className="h-4 w-4" />
            {selectedDay?.date ?? "No day selected"}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <StatTile icon={<Clock3 className="h-4 w-4" />} label="Focus" value={formatMinutes(selectedDay?.totalDurationMinutes ?? 0)} />
            <StatTile icon={<Layers3 className="h-4 w-4" />} label="Blocks" value={`${selectedDay?.tasks.length ?? 0}`} />
          </div>

          <div className="mt-4 space-y-2">
            {selectedDay?.tasks.length ? (
              selectedDay.tasks.map((task) => {
                const style = moduleStyles[task.module];
                return (
                  <motion.div
                    key={task.blockId}
                    layout
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`rounded-2xl ${style.bg} p-3 ring-1 ${style.ring}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-950">{task.title}</p>
                        <p className={`mt-1 text-xs font-semibold ${style.text}`}>{task.module}</p>
                      </div>
                      <span className="rounded-full bg-white/78 px-2 py-1 text-[0.65rem] font-bold text-slate-600">
                        {task.timeSlot}
                      </span>
                    </div>
                    <p className="mt-2 text-xs font-medium text-slate-500">
                      {task.priority} priority - {formatMinutes(task.durationMinutes)}
                    </p>
                  </motion.div>
                );
              })
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="rounded-2xl border border-dashed border-slate-200 bg-white/58 p-5 text-center text-sm font-semibold text-slate-500"
              >
                No completed blocks on this day.
              </motion.div>
            )}
          </div>

          {topModules.length ? (
            <div className="mt-5">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Module mix</p>
              <div className="mt-2 space-y-2">
                {topModules.map(([module, count]) => (
                  <div key={module} className="flex items-center justify-between gap-2 text-xs font-semibold text-slate-600">
                    <span className="flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${moduleStyles[module].dot}`} />
                      {module}
                    </span>
                    <span>{count}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </aside>
      </div>
    </motion.div>
  );
}

function StatTile({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-3">
      <div className="flex items-center gap-1.5 text-slate-400">{icon}</div>
      <p className="mt-2 text-lg font-semibold text-slate-950">{value}</p>
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
