"use client";

import { Calendar, ChevronLeft, ChevronRight, Columns3, LocateFixed } from "lucide-react";
import type { RefObject } from "react";
import { TimeGrid } from "@/components/TimeGrid";
import { formatFriendlyDate } from "@/lib/date";
import type { PlannerState, Task } from "@/lib/types";

export function TodayCanvas({
  state,
  tasksById,
  date,
  columnCount,
  canvasRef,
  onPreviousDay,
  onNextDay,
  onToday,
  onDeleteBlock,
}: {
  state: PlannerState;
  tasksById: Map<string, Task>;
  date: string;
  columnCount: number;
  canvasRef: RefObject<HTMLDivElement | null>;
  onPreviousDay: () => void;
  onNextDay: () => void;
  onToday: () => void;
  onDeleteBlock: (blockId: string) => void;
}) {
  return (
    <section className="glass-panel overflow-hidden rounded-[1.6rem] sm:rounded-[2rem]">
      <div className="flex flex-col gap-3 border-b border-white/70 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-500">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span data-testid="selected-date-label" data-date={date}>
                {formatFriendlyDate(date)}
              </span>
            </div>
            <div className="flex items-center gap-1 rounded-full bg-white/70 p-1 shadow-sm">
              <button
                type="button"
                aria-label="Previous day"
                title="Previous day"
                className="rounded-full p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-950"
                onClick={onPreviousDay}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label="Go to today"
                title="Today"
                className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
                onClick={onToday}
              >
                <LocateFixed className="h-3.5 w-3.5" />
                Today
              </button>
              <button
                type="button"
                aria-label="Next day"
                title="Next day"
                className="rounded-full p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-950"
                onClick={onNextDay}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
          <h2 className="mt-1 text-xl font-semibold tracking-normal sm:text-2xl">Today Canvas</h2>
        </div>
        <div
          data-testid="column-count-label"
          className="flex items-center gap-2 rounded-full bg-white/72 px-3 py-2 text-xs font-semibold text-slate-500 shadow-sm"
        >
          <Columns3 className="h-4 w-4" />
          {columnCount}/4 priority columns
        </div>
      </div>

      <div className="fine-scrollbar overflow-x-auto p-3 sm:p-4">
        <TimeGrid
          state={state}
          tasksById={tasksById}
          date={date}
          columnCount={columnCount}
          canvasRef={canvasRef}
          onDeleteBlock={onDeleteBlock}
        />
      </div>
    </section>
  );
}
