"use client";

import { useDroppable } from "@dnd-kit/core";
import type { RefObject } from "react";
import { PriorityColumn } from "@/components/PriorityColumn";
import { TaskCard } from "@/components/TaskCard";
import { TIME_SLOTS } from "@/lib/date";
import type { PlannerState, ScheduleBlock, Task } from "@/lib/types";

const SLOT_HEIGHT = 76;

export function TimeGrid({
  state,
  tasksById,
  date,
  columnCount,
  canvasRef,
  onDeleteBlock,
  canEdit,
}: {
  state: PlannerState;
  tasksById: Map<string, Task>;
  date: string;
  columnCount: number;
  canvasRef: RefObject<HTMLDivElement | null>;
  onDeleteBlock: (blockId: string) => void;
  canEdit: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: "today-canvas" });
  const blocks = state.scheduleBlocks.filter((block) => !block.deletedAt && block.date === date);

  function setRefs(node: HTMLDivElement | null) {
    setNodeRef(node);
    canvasRef.current = node;
  }

  return (
    <div className="grid min-w-[40rem] grid-cols-[3.75rem_minmax(0,1fr)] sm:min-w-[52rem] sm:grid-cols-[4.5rem_minmax(0,1fr)]">
      <div className="pt-10">
        {TIME_SLOTS.map((slot) => (
          <div key={slot} className="flex items-start justify-end pr-3 text-xs font-semibold text-slate-400" style={{ height: SLOT_HEIGHT }}>
            {slot}
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-[1.6rem] border border-white/70 bg-white/44">
        <div className="grid" style={{ gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))` }}>
          {Array.from({ length: columnCount }, (_, index) => (
            <PriorityColumn key={index} index={index} />
          ))}
        </div>

        <div
          ref={setRefs}
          className={`relative transition ${isOver ? "bg-white/60" : "bg-white/20"}`}
          style={{ height: TIME_SLOTS.length * SLOT_HEIGHT }}
        >
          {TIME_SLOTS.map((slot, index) => (
            <div
              key={slot}
              className="absolute left-0 right-0 border-t border-slate-200/72"
              style={{ top: index * SLOT_HEIGHT }}
            />
          ))}
          {Array.from({ length: columnCount - 1 }, (_, index) => (
            <div
              key={index}
              className="absolute bottom-0 top-0 border-l border-slate-200/72"
              style={{ left: `${((index + 1) / columnCount) * 100}%` }}
            />
          ))}

          {blocks.map((block) => {
            const task = tasksById.get(block.taskId);
            if (!task || task.deletedAt) return null;
            return (
              <ScheduledBlockCard
                key={block.id}
                block={block}
                task={task}
                columnCount={columnCount}
                onDelete={() => onDeleteBlock(block.id)}
                canEdit={canEdit}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ScheduledBlockCard({
  block,
  task,
  columnCount,
  onDelete,
  canEdit,
}: {
  block: ScheduleBlock;
  task: Task;
  columnCount: number;
  onDelete: () => void;
  canEdit: boolean;
}) {
  const rowIndex = Math.max(0, TIME_SLOTS.indexOf(block.timeSlot));
  const columnWidth = 100 / columnCount;
  const top = rowIndex * SLOT_HEIGHT + 8;
  const height = Math.max(58, (block.durationMinutes / 60) * SLOT_HEIGHT - 10);

  return (
    <TaskCard
      task={task}
      block={block}
      variant="scheduled"
      disabled={!canEdit}
      onDelete={canEdit ? onDelete : undefined}
      style={{
        top,
        left: `calc(${block.columnIndex * columnWidth}% + 0.45rem)`,
        width: `calc(${columnWidth}% - 0.9rem)`,
        height,
      }}
    />
  );
}
