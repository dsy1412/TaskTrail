"use client";

import { Calendar, ChevronLeft, ChevronRight, Clock3, Columns3, LocateFixed, Trash2 } from "lucide-react";
import type { RefObject } from "react";
import { TimeGrid } from "@/components/TimeGrid";
import { formatFriendlyDate, formatTimeRange } from "@/lib/date";
import { formatDuration } from "@/lib/duration";
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
  onSelectDate,
  onDeleteBlock,
  canEdit,
}: {
  state: PlannerState;
  tasksById: Map<string, Task>;
  date: string;
  columnCount: number;
  canvasRef: RefObject<HTMLDivElement | null>;
  onPreviousDay: () => void;
  onNextDay: () => void;
  onToday: () => void;
  onSelectDate: (date: string) => void;
  onDeleteBlock: (blockId: string) => void;
  canEdit: boolean;
}) {
  return (
    <section className="glass-panel overflow-hidden rounded-[1.6rem] sm:rounded-[2rem]">
      <div className="flex flex-col gap-3 border-b border-slate-800 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-300">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span data-testid="selected-date-label" data-date={date}>
                {formatFriendlyDate(date)}
              </span>
            </div>
            <div className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-950 p-1 shadow-sm">
              <button
                type="button"
                aria-label="Previous day"
                title="Previous day"
                className="rounded-md p-1.5 text-slate-300 transition hover:bg-slate-800 hover:text-slate-50"
                onClick={onPreviousDay}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label="Go to today"
                title="Today"
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-slate-300 transition hover:bg-slate-800 hover:text-slate-50"
                onClick={onToday}
              >
                <LocateFixed className="h-3.5 w-3.5" />
                Today
              </button>
              <button
                type="button"
                aria-label="Next day"
                title="Next day"
                className="rounded-md p-1.5 text-slate-300 transition hover:bg-slate-800 hover:text-slate-50"
                onClick={onNextDay}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            <label className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-semibold text-slate-300 shadow-sm transition focus-within:border-cyan-300 focus-within:text-slate-50">
              <Calendar className="h-3.5 w-3.5" />
              <input
                type="date"
                aria-label="Jump to date"
                value={date}
                onChange={(event) => {
                  if (event.target.value) onSelectDate(event.target.value);
                }}
                className="min-w-[7.5rem] bg-transparent text-slate-100 outline-none [color-scheme:dark]"
              />
            </label>
          </div>
          <h2 className="mt-1 text-xl font-semibold tracking-normal text-slate-50 sm:text-2xl">Today Canvas</h2>
        </div>
        <div
          data-testid="column-count-label"
          className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-semibold text-slate-300 shadow-sm"
        >
          <Columns3 className="h-4 w-4" />
          {columnCount}/4 priority columns
        </div>
      </div>

      <div className="fine-scrollbar overflow-x-auto p-3 sm:p-4">
        <div className="sm:hidden">
          <MobileDayAgenda
            state={state}
            tasksById={tasksById}
            date={date}
            onDeleteBlock={onDeleteBlock}
            canEdit={canEdit}
          />
        </div>
        <div className="hidden sm:block">
          <TimeGrid
            state={state}
            tasksById={tasksById}
            date={date}
            columnCount={columnCount}
            canvasRef={canvasRef}
            onDeleteBlock={onDeleteBlock}
            canEdit={canEdit}
          />
        </div>
      </div>
    </section>
  );
}

function MobileDayAgenda({
  state,
  tasksById,
  date,
  onDeleteBlock,
  canEdit,
}: {
  state: PlannerState;
  tasksById: Map<string, Task>;
  date: string;
  onDeleteBlock: (blockId: string) => void;
  canEdit: boolean;
}) {
  const blocks = state.scheduleBlocks
    .filter((block) => !block.deletedAt && block.date === date)
    .map((block) => ({ block, task: tasksById.get(block.taskId) }))
    .filter((item): item is { block: NonNullable<typeof item.block>; task: Task } => Boolean(item.task && !item.task.deletedAt))
    .sort((left, right) => left.block.timeSlot.localeCompare(right.block.timeSlot));

  return (
    <div data-testid="mobile-day-agenda" className="grid gap-2">
      {blocks.length ? (
        blocks.map(({ block, task }) => (
          <div key={block.id} className="grid grid-cols-[5.25rem_minmax(0,1fr)] gap-2">
            <div className="pt-3 text-right text-xs font-semibold leading-5 text-slate-400">
              {formatTimeRange(block.timeSlot, block.durationMinutes)}
            </div>
            <article
              data-testid="mobile-agenda-task"
              className="rounded-lg border border-slate-800 bg-slate-900 p-3 shadow-soft"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="line-clamp-2 text-sm font-semibold leading-5 text-slate-50">
                    {task.title}
                  </h3>
                  <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-slate-400">
                    <Clock3 className="h-3.5 w-3.5" />
                    {formatDuration(task.estimatedDurationMinutes)} - {task.module}
                  </p>
                  {task.notes ? <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-400">{task.notes}</p> : null}
                </div>
                {canEdit ? (
                  <button
                    type="button"
                    aria-label={`Delete ${task.title} from schedule`}
                    title="Delete from schedule"
                    className="rounded-md border border-slate-700 bg-slate-950 p-2 text-slate-300 shadow-sm transition hover:text-rose-300"
                    onClick={() => onDeleteBlock(block.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                ) : null}
              </div>
            </article>
          </div>
        ))
      ) : (
        <div className="rounded-lg border border-dashed border-slate-700 bg-slate-950/40 p-6 text-center text-sm font-semibold text-slate-400">
          No planned blocks on this day yet.
        </div>
      )}
    </div>
  );
}
