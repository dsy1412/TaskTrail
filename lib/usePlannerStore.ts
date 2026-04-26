"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { todayIsoDate } from "@/lib/date";
import {
  createEvent,
  createSeedState,
  loadPlannerState,
  makeScheduleBlock,
  makeTask,
  savePlannerState,
  timestamp,
} from "@/lib/storage";
import type { ModuleName, PlannerState, Priority, Task } from "@/lib/types";

export function usePlannerStore() {
  const [state, setState] = useState<PlannerState>(() => createSeedState());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setState(loadPlannerState());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) savePlannerState(state);
  }, [hydrated, state]);

  const tasksById = useMemo(() => new Map(state.tasks.map((task) => [task.id, task])), [state.tasks]);

  const createTask = useCallback(
    (input: {
      title: string;
      module: ModuleName;
      priority: Priority;
      estimatedDurationMinutes: number;
      notes?: string;
    }) => {
      const task = makeTask(input);
      setState((current) => ({
        ...current,
        tasks: [...current.tasks, task],
        events: [...current.events, createEvent("TASK_CREATED", { task }, task.id)],
      }));
      return task;
    },
    [],
  );

  const updateTask = useCallback((taskId: string, patch: Partial<Omit<Task, "id" | "createdAt">>) => {
    setState((current) => {
      const previous = current.tasks.find((task) => task.id === taskId);
      if (!previous) return current;
      const updated = { ...previous, ...patch };
      return {
        ...current,
        tasks: current.tasks.map((task) => (task.id === taskId ? updated : task)),
        events: [
          ...current.events,
          createEvent("TASK_UPDATED", { before: previous, after: updated }, taskId),
        ],
      };
    });
  }, []);

  const deleteTask = useCallback((taskId: string) => {
    const deletedAt = timestamp();
    setState((current) => ({
      ...current,
      tasks: current.tasks.map((task) => (task.id === taskId ? { ...task, deletedAt } : task)),
      scheduleBlocks: current.scheduleBlocks.map((block) =>
        block.taskId === taskId && !block.deletedAt ? { ...block, deletedAt, updatedAt: deletedAt } : block,
      ),
      events: [
        ...current.events,
        createEvent("TASK_DELETED", { scope: "task", deletedAt }, taskId),
      ],
    }));
  }, []);

  const scheduleTask = useCallback(
    (taskId: string, input: { date?: string; timeSlot: string; columnIndex: number }) => {
      const task = tasksById.get(taskId);
      if (!task) return;
      const block = makeScheduleBlock(task, {
        date: input.date ?? todayIsoDate(),
        timeSlot: input.timeSlot,
        columnIndex: input.columnIndex,
      });
      setState((current) => ({
        ...current,
        scheduleBlocks: [...current.scheduleBlocks, block],
        events: [
          ...current.events,
          createEvent("TASK_SCHEDULED", { block }, task.id, block.id),
        ],
      }));
    },
    [tasksById],
  );

  const moveScheduleBlock = useCallback((blockId: string, input: { timeSlot: string; columnIndex: number }) => {
    const updatedAt = timestamp();
    setState((current) => {
      const previous = current.scheduleBlocks.find((block) => block.id === blockId);
      if (!previous) return current;
      const updated = {
        ...previous,
        timeSlot: input.timeSlot,
        columnIndex: input.columnIndex,
        updatedAt,
      };
      return {
        ...current,
        scheduleBlocks: current.scheduleBlocks.map((block) => (block.id === blockId ? updated : block)),
        events: [
          ...current.events,
          createEvent("TASK_MOVED", { before: previous, after: updated }, previous.taskId, blockId),
        ],
      };
    });
  }, []);

  const deleteScheduleBlock = useCallback((blockId: string) => {
    const deletedAt = timestamp();
    setState((current) => {
      const block = current.scheduleBlocks.find((candidate) => candidate.id === blockId);
      if (!block) return current;
      return {
        ...current,
        scheduleBlocks: current.scheduleBlocks.map((candidate) =>
          candidate.id === blockId ? { ...candidate, deletedAt, updatedAt: deletedAt } : candidate,
        ),
        events: [
          ...current.events,
          createEvent("TASK_DELETED", { scope: "scheduleBlock", deletedAt }, block.taskId, blockId),
        ],
      };
    });
  }, []);

  return {
    state,
    hydrated,
    tasksById,
    createTask,
    updateTask,
    deleteTask,
    scheduleTask,
    moveScheduleBlock,
    deleteScheduleBlock,
  };
}
