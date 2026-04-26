"use client";

import { BarChart3, CalendarRange } from "lucide-react";
import { MODULES } from "@/lib/types";
import { summarizeFocusByModule } from "@/lib/focusTrail";
import type { PlannerState } from "@/lib/types";

export function WeeklyMonthlySummary({ state }: { state: PlannerState }) {
  const week = summarizeFocusByModule(state, "week");
  const month = summarizeFocusByModule(state, "month");
  const weeklyGoals = state.tasks.filter((task) => !task.deletedAt && task.module === "Weekly Plan");
  const monthlyGoals = state.tasks.filter((task) => !task.deletedAt && task.module === "Monthly Plan");

  return (
    <aside className="glass-panel rounded-[2rem] p-5">
      <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-500">
        <CalendarRange className="h-4 w-4" />
        Weekly / Monthly
      </div>

      <div className="space-y-4">
        <section>
          <h3 className="text-sm font-semibold">Goal cards</h3>
          <div className="mt-2 grid gap-2">
            {[...weeklyGoals, ...monthlyGoals].slice(0, 5).map((goal) => (
              <div key={goal.id} className="rounded-2xl bg-white/70 p-3 shadow-sm">
                <p className="text-sm font-semibold">{goal.title}</p>
                <p className="mt-1 text-xs font-medium text-slate-500">{goal.module}</p>
              </div>
            ))}
            {!weeklyGoals.length && !monthlyGoals.length ? (
              <p className="rounded-2xl bg-white/56 p-3 text-sm font-medium text-slate-500">
                Add Weekly Plan or Monthly Plan cards from the Backpack.
              </p>
            ) : null}
          </div>
        </section>

        <section>
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
            <BarChart3 className="h-4 w-4 text-slate-500" />
            Focus summary
          </div>
          <div className="space-y-2">
            {MODULES.map((module) => {
              const weekDays = week[module] ?? 0;
              const monthDays = month[module] ?? 0;
              const width = Math.min(100, monthDays * 10);
              return (
                <div key={module} className="rounded-2xl bg-white/58 p-3">
                  <div className="mb-2 flex items-center justify-between gap-2 text-xs font-semibold">
                    <span>{module}</span>
                    <span className="text-slate-500">
                      {weekDays}w / {monthDays}m
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                    <div className="h-full rounded-full bg-slate-950 transition-all" style={{ width: `${width}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </aside>
  );
}
