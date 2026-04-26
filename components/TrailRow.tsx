"use client";

import { motion } from "framer-motion";
import { getRangeDates } from "@/lib/date";
import type { FocusTrailSegment } from "@/lib/types";

const moduleDot: Record<FocusTrailSegment["module"], string> = {
  Study: "bg-sky-500",
  Project: "bg-indigo-500",
  Health: "bg-emerald-500",
  Career: "bg-rose-500",
  "Weekly Plan": "bg-amber-500",
  "Monthly Plan": "bg-teal-500",
};

export function TrailRow({
  segment,
  range,
}: {
  segment: FocusTrailSegment;
  range: "day" | "week" | "month";
}) {
  const dates = getRangeDates(range);
  const active = new Set(segment.activeDates);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid gap-4 rounded-2xl border border-white/70 bg-white/62 p-4 md:grid-cols-[12rem_minmax(0,1fr)_7rem]"
    >
      <div className="min-w-0">
        <h3 className="truncate text-sm font-semibold text-slate-950">{segment.label}</h3>
        <p className="mt-1 text-xs font-medium text-slate-500">{segment.module}</p>
      </div>

      <div
        className="grid items-center gap-1"
        style={{ gridTemplateColumns: `repeat(${dates.length}, minmax(${range === "month" ? "0.6rem" : "1.25rem"}, 1fr))` }}
      >
        {dates.map((date, index) => {
          const isActive = active.has(date);
          const hasPrevious = index > 0 && active.has(dates[index - 1]) && isActive;
          return (
            <div key={date} className="relative flex h-8 items-center justify-center">
              {hasPrevious ? <span className={`absolute right-1/2 h-1 w-full ${moduleDot[segment.module]} opacity-35`} /> : null}
              <span
                title={date}
                className={`relative z-10 h-3 w-3 rounded-full ring-4 ring-white transition ${
                  isActive ? moduleDot[segment.module] : "bg-slate-200"
                }`}
              />
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-start md:justify-end">
        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm">
          {segment.streakLength}-day streak
        </span>
      </div>
    </motion.div>
  );
}
