"use client";

import {
  DndContext,
  DragCancelEvent,
  DragEndEvent,
  DragMoveEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { CalendarDays, Route, Sparkles } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { TaskBackpack } from "@/components/TaskBackpack";
import { TaskCardPreview } from "@/components/TaskCard";
import { TodayCanvas } from "@/components/TodayCanvas";
import { FocusTrail } from "@/components/FocusTrail";
import { WeeklyMonthlySummary } from "@/components/WeeklyMonthlySummary";
import { addDaysIso, TIME_SLOTS, todayIsoDate } from "@/lib/date";
import { getScheduledColumnCount, getVisibleColumnCount } from "@/lib/columns";
import { usePlannerStore } from "@/lib/usePlannerStore";

const MAX_COLUMNS = 4;

export function PlannerApp() {
  const planner = usePlannerStore();
  const [hasMounted, setHasMounted] = useState(false);
  const [view, setView] = useState<"today" | "trail">("today");
  const [draftColumnCount, setDraftColumnCount] = useState(1);
  const [selectedDate, setSelectedDate] = useState(todayIsoDate());
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const scheduledMaxColumn = useMemo(() => {
    return getScheduledColumnCount(planner.state.scheduleBlocks, selectedDate);
  }, [planner.state.scheduleBlocks, selectedDate]);

  const visibleColumns = getVisibleColumnCount({
    scheduledColumnCount: scheduledMaxColumn,
    draftColumnCount,
    isDragging: Boolean(activeDragId),
    maxColumns: MAX_COLUMNS,
  });

  const activeDragPreview = useMemo(() => {
    if (!activeDragId) return null;

    if (activeDragId.startsWith("task:")) {
      const task = planner.tasksById.get(activeDragId.replace("task:", ""));
      return task ? <TaskCardPreview task={task} /> : null;
    }

    if (activeDragId.startsWith("block:")) {
      const block = planner.state.scheduleBlocks.find(
        (candidate) => candidate.id === activeDragId.replace("block:", ""),
      );
      const task = block ? planner.tasksById.get(block.taskId) : null;
      return task && block ? <TaskCardPreview task={task} block={block} /> : null;
    }

    return null;
  }, [activeDragId, planner.state.scheduleBlocks, planner.tasksById]);

  function quickScheduleTask(taskId: string) {
    const occupied = new Set(
      planner.state.scheduleBlocks
        .filter((block) => !block.deletedAt && block.date === selectedDate && block.columnIndex === 0)
        .map((block) => block.timeSlot),
    );
    const timeSlot = TIME_SLOTS.find((slot) => !occupied.has(slot)) ?? TIME_SLOTS[0];
    planner.scheduleTask(taskId, {
      date: selectedDate,
      timeSlot,
      columnIndex: 0,
    });
    setView("today");
  }

  function changeSelectedDate(days: number) {
    setSelectedDate((date) => addDaysIso(date, days));
    setDraftColumnCount(1);
  }

  function returnToToday() {
    setSelectedDate(todayIsoDate());
    setDraftColumnCount(1);
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveDragId(String(event.active.id));
    setDraftColumnCount(scheduledMaxColumn);
  }

  function handleDragMove(event: DragMoveEvent) {
    const rect = canvasRef.current?.getBoundingClientRect();
    const translated = event.active.rect.current.translated;
    if (!rect || !translated || visibleColumns >= MAX_COLUMNS) return;

    const centerX = translated.left + translated.width / 2;
    const nearRightEdge = centerX > rect.right - 72 && centerX < rect.right + 120;
    if (nearRightEdge) setDraftColumnCount((count) => Math.min(MAX_COLUMNS, Math.max(count + 1, scheduledMaxColumn)));
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveDragId(null);
    setDraftColumnCount(1);
    const rect = canvasRef.current?.getBoundingClientRect();
    const translated = event.active.rect.current.translated;
    if (!rect || !translated) return;

    const centerX = translated.left + translated.width / 2;
    const centerY = translated.top + translated.height / 2;
    const insideCanvas =
      centerX >= rect.left && centerX <= rect.right && centerY >= rect.top && centerY <= rect.bottom;
    if (!insideCanvas) return;

    const { timeSlot, columnIndex } = snapToGrid(centerX, centerY, rect, visibleColumns);
    const activeId = String(event.active.id);

    if (activeId.startsWith("task:")) {
      planner.scheduleTask(activeId.replace("task:", ""), {
        date: selectedDate,
        timeSlot,
        columnIndex,
      });
    }

    if (activeId.startsWith("block:")) {
      planner.moveScheduleBlock(activeId.replace("block:", ""), { timeSlot, columnIndex });
    }
  }

  function handleDragCancel(_event: DragCancelEvent) {
    setActiveDragId(null);
    setDraftColumnCount(1);
  }

  if (!hasMounted) {
    return (
      <main className="min-h-screen px-3 pb-[18rem] pt-4 text-ink sm:px-6 sm:pb-[25rem] lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-5">
          <header className="flex flex-col gap-4 rounded-[2rem] px-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                <Sparkles className="h-4 w-4" />
                Modular planning MVP
              </div>
              <h1 className="mt-2 text-4xl font-semibold tracking-normal sm:text-5xl">TaskTrail</h1>
            </div>
            <div className="glass-panel rounded-full px-4 py-2 text-sm font-semibold text-slate-500">
              Loading workspace
            </div>
          </header>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-3 pb-[18rem] pt-4 text-ink sm:px-6 sm:pb-[25rem] lg:px-8">
      <DndContext
        id="tasktrail-planner-dnd"
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragMove={handleDragMove}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="mx-auto flex max-w-7xl flex-col gap-5">
          <header className="flex flex-col gap-4 rounded-[2rem] px-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                <Sparkles className="h-4 w-4" />
                Modular planning MVP
              </div>
              <h1 className="mt-2 text-4xl font-semibold tracking-normal sm:text-5xl">TaskTrail</h1>
            </div>

            <div className="glass-panel grid grid-cols-2 rounded-full p-1">
              <button
                type="button"
                className={`flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                  view === "today" ? "bg-white shadow-soft" : "text-slate-500"
                }`}
                onClick={() => setView("today")}
              >
                <CalendarDays className="h-4 w-4" />
                Today
              </button>
              <button
                type="button"
                className={`flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                  view === "trail" ? "bg-white shadow-soft" : "text-slate-500"
                }`}
                onClick={() => setView("trail")}
              >
                <Route className="h-4 w-4" />
                Focus Trail
              </button>
            </div>
          </header>

          {view === "today" ? (
            <section
              data-testid="today-view"
              className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]"
            >
                <TodayCanvas
                  state={planner.state}
                  tasksById={planner.tasksById}
                  date={selectedDate}
                  columnCount={visibleColumns}
                  canvasRef={canvasRef}
                  onPreviousDay={() => changeSelectedDate(-1)}
                  onNextDay={() => changeSelectedDate(1)}
                  onToday={returnToToday}
                  onDeleteBlock={planner.deleteScheduleBlock}
                />
                <WeeklyMonthlySummary state={planner.state} />
            </section>
          ) : (
            <section data-testid="trail-view">
                <FocusTrail state={planner.state} />
            </section>
          )}
        </div>

        <TaskBackpack
          state={planner.state}
          onCreateTask={planner.createTask}
          onUpdateTask={planner.updateTask}
          onDeleteTask={planner.deleteTask}
          onScheduleTask={quickScheduleTask}
        />
        <DragOverlay dropAnimation={null} zIndex={100}>
          {activeDragPreview ? <div className="w-80 max-w-[80vw]">{activeDragPreview}</div> : null}
        </DragOverlay>
      </DndContext>
    </main>
  );
}

function snapToGrid(clientX: number, clientY: number, rect: DOMRect, columnCount: number) {
  const slotHeight = rect.height / TIME_SLOTS.length;
  const rowIndex = Math.min(TIME_SLOTS.length - 1, Math.max(0, Math.round((clientY - rect.top) / slotHeight)));
  const columnIndex = Math.min(
    columnCount - 1,
    Math.max(0, Math.floor(((clientX - rect.left) / rect.width) * columnCount)),
  );
  return {
    timeSlot: TIME_SLOTS[rowIndex],
    columnIndex,
  };
}
