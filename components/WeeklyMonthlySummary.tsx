"use client";

import { BarChart3, CalendarRange } from "lucide-react";
import { MODULES } from "@/lib/types";
import { summarizeFocusByModule } from "@/lib/focusTrail";
import type { PlannerState } from "@/lib/types";

export function WeeklyMonthlySummary({ state }: { state: PlannerState }) {
  const week = summarizeFocusByModule(state, "week");
  const month = summarizeFocusByModule(state, "month");

  return (
    <aside className="glass-panel rounded-[2rem] p-5">
      <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-300">
        <CalendarRange className="h-4 w-4" />
        Weekly / Monthly
      </div>

      <section>
        <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-50">
          <BarChart3 className="h-4 w-4 text-slate-300" />
          Focus summary
        </div>
        <div className="space-y-2">
          {MODULES.map((module) => {
            const weekDays = week[module] ?? 0;
            const monthDays = month[module] ?? 0;
            const width = Math.min(100, monthDays * 10);
            return (
              <div key={module} className="rounded-lg border border-slate-800 bg-slate-900 p-3">
                <div className="mb-2 flex items-center justify-between gap-2 text-xs font-semibold text-slate-100">
                  <span>{module}</span>
                  <span className="text-slate-400">
                    {weekDays}w / {monthDays}m
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-700">
                  <div className="h-full rounded-full bg-cyan-300 transition-all" style={{ width: `${width}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </aside>
  );
}
