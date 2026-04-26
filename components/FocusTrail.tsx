"use client";

import { motion } from "framer-motion";
import { Activity, Database, GitBranch } from "lucide-react";
import { useMemo, useState } from "react";
import { MonthActivityCalendar } from "@/components/MonthActivityCalendar";
import { TrailRow } from "@/components/TrailRow";
import { WeeklyMonthlySummary } from "@/components/WeeklyMonthlySummary";
import { deriveFocusTrail } from "@/lib/focusTrail";
import type { PlannerState } from "@/lib/types";

export function FocusTrail({ state }: { state: PlannerState }) {
  const [range, setRange] = useState<"day" | "week" | "month">("week");
  const segments = useMemo(() => deriveFocusTrail(state, range), [state, range]);

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
      <section className="glass-panel rounded-[2rem] p-5">
        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
              <GitBranch className="h-4 w-4" />
              Event-sourced activity
            </div>
            <h2 className="mt-1 text-2xl font-semibold tracking-normal">Focus Trail</h2>
          </div>
          <div className="grid grid-cols-3 rounded-full bg-white/72 p-1 text-xs font-semibold text-slate-500 shadow-sm">
            {(["day", "week", "month"] as const).map((option) => (
              <button
                key={option}
                type="button"
                data-testid={`focus-range-${option}`}
                className={`rounded-full px-3 py-2 capitalize transition ${
                  range === option ? "bg-slate-950 text-white" : ""
                }`}
                onClick={() => setRange(option)}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        {range === "month" ? <MonthActivityCalendar state={state} /> : null}

        <div className={range === "month" ? "mt-5 grid gap-3" : "grid gap-3"}>
          {range === "month" && segments.length ? (
            <div className="flex items-center justify-between px-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
              <span>Streak trails</span>
              <span>{segments.length} segments</span>
            </div>
          ) : null}
          {segments.length ? (
            segments.map((segment) => <TrailRow key={segment.id} segment={segment} range={range} />)
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white/42 p-8 text-center">
              <Activity className="mx-auto h-7 w-7 text-slate-400" />
              <p className="mt-3 text-sm font-semibold text-slate-600">No active trail in this range yet.</p>
            </div>
          )}
        </div>
      </section>

      <div className="grid gap-5">
        <WeeklyMonthlySummary state={state} />
        <section className="glass-panel rounded-[2rem] p-5">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-500">
            <Database className="h-4 w-4" />
            Event log
          </div>
          <div className="fine-scrollbar max-h-80 space-y-2 overflow-y-auto pr-1">
            {state.events
              .slice()
              .reverse()
              .slice(0, 12)
              .map((event) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl bg-white/62 p-3"
                >
                  <p className="text-xs font-semibold text-slate-950">{event.type}</p>
                  <p className="mt-1 text-[0.7rem] font-medium text-slate-500">
                    {new Date(event.createdAt).toLocaleString()}
                  </p>
                </motion.div>
              ))}
          </div>
        </section>
      </div>
    </div>
  );
}
