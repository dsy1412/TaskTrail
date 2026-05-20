"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { todayIsoDate } from "@/lib/date";
import { isPlannerState } from "@/lib/plannerStateSchema";
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

export type PlannerSyncStatus = "readonly" | "loading" | "local" | "saving" | "synced" | "error";

export function usePlannerStore({
  canEdit = true,
  syncToCloud = false,
}: {
  canEdit?: boolean;
  syncToCloud?: boolean;
} = {}) {
  const [state, setState] = useState<PlannerState>(() => createSeedState());
  const [hydrated, setHydrated] = useState(false);
  const [syncStatus, setSyncStatus] = useState<PlannerSyncStatus>(canEdit ? "loading" : "readonly");
  const loadGeneration = useRef(0);

  useEffect(() => {
    const generation = loadGeneration.current + 1;
    loadGeneration.current = generation;

    if (!canEdit) {
      setState(createSeedState());
      setHydrated(true);
      setSyncStatus("readonly");
      return;
    }

    if (!syncToCloud) {
      setState(loadPlannerState());
      setHydrated(true);
      setSyncStatus("local");
      return;
    }

    setHydrated(false);
    setSyncStatus("loading");

    fetch("/api/planner-state", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error(`Planner state request failed with ${response.status}`);
        return (await response.json()) as { state?: unknown };
      })
      .then((body) => {
        if (loadGeneration.current !== generation) return;
        setState(isPlannerState(body.state) ? body.state : createSeedState());
        setHydrated(true);
        setSyncStatus("synced");
      })
      .catch(() => {
        if (loadGeneration.current !== generation) return;
        setState(loadPlannerState());
        setHydrated(true);
        setSyncStatus("error");
      });
  }, [canEdit, syncToCloud]);

  useEffect(() => {
    if (!hydrated || !canEdit) return;

    if (!syncToCloud) {
      savePlannerState(state);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setSyncStatus("saving");
      fetch("/api/planner-state", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state }),
        signal: controller.signal,
      })
        .then((response) => {
          if (!response.ok) throw new Error(`Planner state save failed with ${response.status}`);
          setSyncStatus("synced");
        })
        .catch((error) => {
          if (error?.name === "AbortError") return;
          savePlannerState(state);
          setSyncStatus("error");
        });
    }, 450);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [canEdit, hydrated, state, syncToCloud]);

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
      if (!canEdit) return task;
      setState((current) => ({
        ...current,
        tasks: [...current.tasks, task],
        events: [...current.events, createEvent("TASK_CREATED", { task }, task.id)],
      }));
      return task;
    },
    [canEdit],
  );

  const createTaskAndSchedule = useCallback(
    (
      input: {
        title: string;
        module: ModuleName;
        priority: Priority;
        estimatedDurationMinutes: number;
        notes?: string;
      },
      scheduleInput: { date?: string; timeSlot: string; columnIndex: number },
    ) => {
      const task = makeTask(input);
      const block = makeScheduleBlock(task, {
        date: scheduleInput.date ?? todayIsoDate(),
        timeSlot: scheduleInput.timeSlot,
        columnIndex: scheduleInput.columnIndex,
      });
      if (!canEdit) return task;
      setState((current) => ({
        ...current,
        tasks: [...current.tasks, task],
        scheduleBlocks: [...current.scheduleBlocks, block],
        events: [
          ...current.events,
          createEvent("TASK_CREATED", { task }, task.id),
          createEvent("TASK_SCHEDULED", { block }, task.id, block.id),
        ],
      }));
      return task;
    },
    [canEdit],
  );

  const updateTask = useCallback((taskId: string, patch: Partial<Omit<Task, "id" | "createdAt">>) => {
    if (!canEdit) return;
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
  }, [canEdit]);

  const deleteTask = useCallback((taskId: string) => {
    if (!canEdit) return;
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
  }, [canEdit]);

  const scheduleTask = useCallback(
    (taskId: string, input: { date?: string; timeSlot: string; columnIndex: number }) => {
      if (!canEdit) return;
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
    [canEdit, tasksById],
  );

  const moveScheduleBlock = useCallback((blockId: string, input: { timeSlot: string; columnIndex: number }) => {
    if (!canEdit) return;
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
  }, [canEdit]);

  const deleteScheduleBlock = useCallback((blockId: string) => {
    if (!canEdit) return;
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
  }, [canEdit]);

  return {
    state,
    hydrated,
    syncStatus,
    tasksById,
    createTask,
    createTaskAndSchedule,
    updateTask,
    deleteTask,
    scheduleTask,
    moveScheduleBlock,
    deleteScheduleBlock,
  };
}
