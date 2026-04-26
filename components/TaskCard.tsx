"use client";

import { useDraggable } from "@dnd-kit/core";
import { motion } from "framer-motion";
import { CalendarPlus, Clock, GripVertical, Pencil, Trash2 } from "lucide-react";
import type { CSSProperties } from "react";
import type { ScheduleBlock, Task } from "@/lib/types";

const moduleTone: Record<Task["module"], string> = {
  Study: "bg-sky-50 text-sky-700 ring-sky-100",
  Project: "bg-indigo-50 text-indigo-700 ring-indigo-100",
  Health: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  Career: "bg-rose-50 text-rose-700 ring-rose-100",
  "Weekly Plan": "bg-amber-50 text-amber-700 ring-amber-100",
  "Monthly Plan": "bg-teal-50 text-teal-700 ring-teal-100",
};

export function TaskCardPreview({ task, block }: { task: Task; block?: ScheduleBlock }) {
  return (
    <article className="rounded-2xl border border-white/70 bg-white/90 p-3 shadow-glass backdrop-blur-xl">
      <TaskCardBody task={task} block={block} />
    </article>
  );
}

export function TaskCard({
  task,
  block,
  variant = "backpack",
  style,
  onDelete,
  onEdit,
  onSchedule,
}: {
  task: Task;
  block?: ScheduleBlock;
  variant?: "backpack" | "scheduled";
  style?: CSSProperties;
  onDelete?: () => void;
  onEdit?: () => void;
  onSchedule?: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: block ? `block:${block.id}` : `task:${task.id}`,
    data: { taskId: task.id, blockId: block?.id },
  });

  const dragStyle: CSSProperties = {
    ...style,
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
      className={`group touch-none cursor-grab active:cursor-grabbing ${variant === "scheduled" ? "absolute" : "relative"} rounded-2xl border border-white/70 bg-white/82 p-3 shadow-soft backdrop-blur-xl`}
    >
      <div className="flex items-start gap-2">
        <button
          type="button"
          aria-label="Drag task"
          title="Drag"
          suppressHydrationWarning
          tabIndex={-1}
          className="mt-0.5 rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <div className="min-w-0 flex-1 select-none">
          <TaskCardBody task={task} block={block} />
          {onSchedule ? (
            <button
              type="button"
              aria-label={`Schedule ${task.title} today`}
              className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-slate-950 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-800"
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
            className="rounded-full bg-white p-1.5 text-slate-500 shadow-sm transition hover:text-slate-950"
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
            className="rounded-full bg-white p-1.5 text-slate-500 shadow-sm transition hover:text-rose-600"
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
        <h3 className="line-clamp-2 text-sm font-semibold leading-5 text-slate-950">{task.title}</h3>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-[0.68rem] font-semibold ring-1 ${moduleTone[task.module]}`}
        >
          {task.module}
        </span>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2 text-[0.72rem] font-medium text-slate-500">
        <span className="rounded-full bg-slate-100 px-2 py-0.5">{task.priority}</span>
        <span className="flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5">
          <Clock className="h-3 w-3" />
          {block?.durationMinutes ?? task.estimatedDurationMinutes}m
        </span>
      </div>
      {task.notes ? <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-500">{task.notes}</p> : null}
    </>
  );
}
