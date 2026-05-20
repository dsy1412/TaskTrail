"use client";

import { Calendar, ChevronLeft, ChevronRight, Clock3, Columns3, LocateFixed, Trash2 } from "lucide-react";
import type { RefObject } from "react";
import { TimeGrid } from "@/components/TimeGrid";
import { formatFriendlyDate, TIME_SLOTS } from "@/lib/date";
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
  onDeleteBlock: (blockId: string) => void;
  canEdit: boolean;
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

  const blocksBySlot = new Map<string, typeof blocks>();
  blocks.forEach((item) => {
    blocksBySlot.set(item.block.timeSlot, [...(blocksBySlot.get(item.block.timeSlot) ?? []), item]);
  });

  return (
    <div data-testid="mobile-day-agenda" className="grid gap-2">
      {TIME_SLOTS.map((slot) => {
        const slotBlocks = blocksBySlot.get(slot) ?? [];
        return (
          <div key={slot} className="grid grid-cols-[3.75rem_minmax(0,1fr)] gap-2">
            <div className="pt-3 text-right text-xs font-semibold text-slate-400">{slot}</div>
            <div className="min-h-14 border-l border-slate-200/80 pl-3">
              {slotBlocks.length ? (
                <div className="grid gap-2">
                  {slotBlocks.map(({ block, task }) => (
                    <article
                      key={block.id}
                      data-testid="mobile-agenda-task"
                      className="rounded-2xl border border-white/70 bg-white/82 p-3 shadow-soft"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="line-clamp-2 text-sm font-semibold leading-5 text-slate-950">
                            {task.title}
                          </h3>
                          <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                            <Clock3 className="h-3.5 w-3.5" />
                            {task.estimatedDurationMinutes}m - {task.module}
                          </p>
                        </div>
                        {canEdit ? (
                          <button
                            type="button"
                            aria-label={`Delete ${task.title} from schedule`}
                            title="Delete from schedule"
                            className="rounded-full bg-white p-2 text-slate-500 shadow-sm transition hover:text-rose-600"
                            onClick={() => onDeleteBlock(block.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        ) : null}
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="h-full rounded-2xl border border-dashed border-slate-200/80 bg-white/32" />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
