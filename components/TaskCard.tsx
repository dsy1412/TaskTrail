"use client";

import { useDraggable } from "@dnd-kit/core";
import { motion } from "framer-motion";
import { CalendarPlus, Clock, GripVertical, Pencil, Trash2 } from "lucide-react";
import type { CSSProperties } from "react";
import { formatDuration } from "@/lib/duration";
import { moduleTheme } from "@/lib/moduleTheme";
import type { ScheduleBlock, Task } from "@/lib/types";

export function TaskCardPreview({ task, block }: { task: Task; block?: ScheduleBlock }) {
  return (
    <article className="rounded-lg border border-slate-700 bg-slate-900 p-3 shadow-glass">
      <TaskCardBody task={task} block={block} />
    </article>
  );
}

export function TaskCard({
  task,
  block,
  variant = "backpack",
  style,
  disabled = false,
  onDelete,
  onEdit,
  onSchedule,
}: {
  task: Task;
  block?: ScheduleBlock;
  variant?: "backpack" | "scheduled";
  style?: CSSProperties;
  disabled?: boolean;
  onDelete?: () => void;
  onEdit?: () => void;
  onSchedule?: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: block ? `block:${block.id}` : `task:${task.id}`,
    data: { taskId: task.id, blockId: block?.id },
    disabled,
  });

  const dragStyle: CSSProperties = {
    ...style,
    borderLeftColor: moduleTheme[task.module].color,
    borderLeftWidth: 4,
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : style?.transform,
    zIndex: isDragging ? 50 : style?.zIndex,
    opacity: isDragging ? 0.62 : 1,
  };

  return (
    <motion.article
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={dragStyle}
      layout
      initial={false}
      animate={{ opacity: isDragging ? 0.62 : 1, scale: 1 }}
      transition={{ duration: 0.18 }}
      data-testid={block ? "scheduled-task-card" : "backpack-task-card"}
      suppressHydrationWarning
      className={`group touch-none ${disabled ? "cursor-default" : "cursor-grab active:cursor-grabbing"} ${variant === "scheduled" ? "absolute" : "relative"} rounded-lg border border-slate-800 bg-slate-900 p-3 shadow-sm`}
    >
      <div className="flex items-start gap-2">
        {!disabled ? (
          <button
            type="button"
            aria-label="Drag task"
            title="Drag"
            suppressHydrationWarning
            tabIndex={-1}
            className="mt-0.5 rounded-md p-1 text-slate-500 transition hover:bg-slate-800 hover:text-slate-200"
          >
            <GripVertical className="h-4 w-4" />
          </button>
        ) : null}
        <div className="min-w-0 flex-1 select-none">
          <TaskCardBody task={task} block={block} />
          {onSchedule ? (
            <button
              type="button"
              aria-label={`Schedule ${task.title} today`}
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-cyan-300 px-3 py-1.5 text-xs font-semibold text-slate-950 transition hover:bg-cyan-200"
              onPointerDown={(event) => event.stopPropagation()}
              onClick={(event) => {
                event.stopPropagation();
                onSchedule();
              }}
            >
              <CalendarPlus className="h-3.5 w-3.5" />
              Today
            </button>
          ) : null}
        </div>
      </div>

      <div className="absolute bottom-2 right-2 flex gap-1 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100">
        {onEdit ? (
          <button
            type="button"
            aria-label="Edit task"
            title="Edit"
            className="rounded-md border border-slate-700 bg-slate-950 p-1.5 text-slate-400 shadow-sm transition hover:text-slate-100"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => {
              event.stopPropagation();
              onEdit();
            }}
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
        ) : null}
        {onDelete ? (
          <button
            type="button"
            aria-label="Delete task"
            title="Delete"
            className="rounded-md border border-slate-700 bg-slate-950 p-1.5 text-slate-400 shadow-sm transition hover:text-rose-300"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => {
              event.stopPropagation();
              onDelete();
            }}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>
    </motion.article>
  );
}

function TaskCardBody({ task, block }: { task: Task; block?: ScheduleBlock }) {
  return (
    <>
      <div className="flex items-start justify-between gap-2">
        <h3 className="line-clamp-2 text-sm font-semibold leading-5 text-slate-50">{task.title}</h3>
        <span
          className="shrink-0 rounded-md px-2 py-0.5 text-[0.68rem] font-bold text-white"
          style={{ backgroundColor: moduleTheme[task.module].color }}
        >
          {task.module}
        </span>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2 text-[0.72rem] font-medium text-slate-400">
        <span className="rounded-md bg-slate-800 px-2 py-0.5">{task.priority}</span>
        <span className="flex items-center gap-1 rounded-md bg-slate-800 px-2 py-0.5">
          <Clock className="h-3 w-3" />
          {formatDuration(block?.durationMinutes ?? task.estimatedDurationMinutes)}
        </span>
      </div>
      {task.notes ? <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-400">{task.notes}</p> : null}
    </>
  );
}
