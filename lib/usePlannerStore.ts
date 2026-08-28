"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { todayIsoDate } from "@/lib/date";
import { isPlannerState } from "@/lib/plannerStateSchema";
import {
  createEvent,
  createSeedState,
  loadPlannerState,
  makeJournalEntry,
  makeLexiconEntry,
  makeScheduleBlock,
  makeTask,
  savePlannerState,
  timestamp,
  withDefaultSchedules,
} from "@/lib/storage";
import type { JournalEntry, LexiconEntry, ModuleName, PlannerState, Priority, Task } from "@/lib/types";

export type PlannerSyncStatus = "readonly" | "loading" | "local" | "saving" | "synced" | "temporary" | "error";

type PlannerStateResponse = {
  detail?: string;
  error?: string;
  state?: unknown;
  persisted?: boolean;
  storage?: {
    durable?: boolean;
  };
};

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
  const [syncError, setSyncError] = useState<string | null>(null);
  const loadGeneration = useRef(0);

  const loadPlannerStateFromSource = useCallback(async (generation?: number) => {
    if (!canEdit) {
      setState(createSeedState());
      setHydrated(true);
      setSyncStatus("readonly");
      setSyncError(null);
      return;
    }

    if (!syncToCloud) {
      setState(loadPlannerState());
      setHydrated(true);
      setSyncStatus("local");
      setSyncError(null);
      return;
    }

    setHydrated(false);
    setSyncStatus("loading");

    try {
      const response = await fetch(`/api/planner-state?refresh=${Date.now()}`, { cache: "no-store" });
      const body = (await response.json()) as PlannerStateResponse;
      if (!response.ok) throw new Error(body.detail ?? body.error ?? `Planner state request failed with ${response.status}`);

      if (generation && loadGeneration.current !== generation) return;
      if (body.storage?.durable === false) {
        setState(loadPlannerState());
        setHydrated(true);
        setSyncStatus("temporary");
        setSyncError(null);
        return;
      }

      const sourceState = body.persisted === false ? loadPlannerState() : body.state;
      setState(isPlannerState(sourceState) ? withDefaultSchedules(sourceState) : createSeedState());
      setHydrated(true);
      setSyncStatus("synced");
      setSyncError(null);
    } catch (error) {
      if (generation && loadGeneration.current !== generation) return;
      setState(loadPlannerState());
      setHydrated(true);
      setSyncStatus("error");
      setSyncError(error instanceof Error ? error.message : "Planner storage request failed");
    }
  }, [canEdit, syncToCloud]);

  useEffect(() => {
    const generation = loadGeneration.current + 1;
    loadGeneration.current = generation;
    void loadPlannerStateFromSource(generation);
  }, [loadPlannerStateFromSource]);

  const refreshPlannerState = useCallback(async () => {
    await loadPlannerStateFromSource();
  }, [loadPlannerStateFromSource]);

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
        .then(async (response) => {
          const body = (await response.json()) as PlannerStateResponse;
          if (!response.ok) throw new Error(body.detail ?? body.error ?? `Planner state save failed with ${response.status}`);
          if (body.storage?.durable === false) {
            savePlannerState(state);
            setSyncStatus("temporary");
            setSyncError(null);
            return;
          }
          setSyncStatus("synced");
          setSyncError(null);
        })
        .catch((error) => {
          if (error?.name === "AbortError") return;
          savePlannerState(state);
          setSyncStatus("error");
          setSyncError(error instanceof Error ? error.message : "Planner storage save failed");
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
      queued?: boolean;
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
        queued?: boolean;
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

  const hideTask = useCallback((taskId: string) => {
    if (!canEdit) return;
    const hiddenAt = timestamp();
    setState((current) => {
      const previous = current.tasks.find((task) => task.id === taskId);
      if (!previous) return current;
      const updated = { ...previous, hiddenAt };
      return {
        ...current,
        tasks: current.tasks.map((task) => (task.id === taskId ? updated : task)),
        events: [
          ...current.events,
          createEvent("TASK_UPDATED", { before: previous, after: updated, scope: "backpack", hiddenAt }, taskId),
        ],
      };
    });
  }, [canEdit]);

  const restoreTask = useCallback((taskId: string) => {
    if (!canEdit) return;
    setState((current) => {
      const previous = current.tasks.find((task) => task.id === taskId);
      if (!previous) return current;
      const updated = { ...previous, hiddenAt: undefined };
      return {
        ...current,
        tasks: current.tasks.map((task) => (task.id === taskId ? updated : task)),
        events: [
          ...current.events,
          createEvent("TASK_UPDATED", { before: previous, after: updated, scope: "backpack", restored: true }, taskId),
        ],
      };
    });
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

  const scheduleTaskOnce = useCallback(
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
        tasks: current.tasks.map((candidate) => (candidate.id === taskId ? { ...candidate, queued: false } : candidate)),
        scheduleBlocks: [...current.scheduleBlocks, block],
        events: [
          ...current.events,
          createEvent("TASK_UPDATED", { before: task, after: { ...task, queued: false }, scope: "queue" }, task.id),
          createEvent("TASK_SCHEDULED", { block, once: true }, task.id, block.id),
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

  const createJournalEntry = useCallback(
    (input: {
      date: string;
      song?: string;
      sight?: string;
      feeling?: string;
      note?: string;
      pulse?: number;
      tags?: string[];
      fontStyle?: JournalEntry["fontStyle"];
    }) => {
      const entry = makeJournalEntry(input);
      if (!canEdit) return entry;
      setState((current) => ({
        ...current,
        journalEntries: [...current.journalEntries, entry],
        events: [...current.events, createEvent("JOURNAL_CREATED", { entry })],
      }));
      return entry;
    },
    [canEdit],
  );

  const createLexiconEntry = useCallback(
    (input: {
      word: string;
      ipa?: string;
      phonics?: string;
      fieldContext?: string;
      meaning?: string;
      association?: string;
      example?: string;
      exampleTranslation?: string;
      related?: string[];
    }) => {
      const entry = makeLexiconEntry(input);
      if (!canEdit) return entry;
      setState((current) => ({
        ...current,
        lexiconEntries: [...current.lexiconEntries, entry],
        events: [...current.events, createEvent("LEXICON_CREATED", { entry })],
      }));
      return entry;
    },
    [canEdit],
  );

  const updateLexiconEntry = useCallback((entryId: string, patch: Partial<Omit<LexiconEntry, "id" | "createdAt">>) => {
    if (!canEdit) return;
    setState((current) => {
      const previous = current.lexiconEntries.find((entry) => entry.id === entryId);
      if (!previous) return current;
      const updated: LexiconEntry = { ...previous, ...patch, updatedAt: timestamp() };
      return {
        ...current,
        lexiconEntries: current.lexiconEntries.map((entry) => (entry.id === entryId ? updated : entry)),
        events: [...current.events, createEvent("LEXICON_UPDATED", { before: previous, after: updated })],
      };
    });
  }, [canEdit]);

  const deleteLexiconEntry = useCallback((entryId: string) => {
    if (!canEdit) return;
    const deletedAt = timestamp();
    setState((current) => {
      const entry = current.lexiconEntries.find((candidate) => candidate.id === entryId);
      if (!entry) return current;
      const deletedEntry: LexiconEntry = { ...entry, deletedAt, updatedAt: deletedAt };
      return {
        ...current,
        lexiconEntries: current.lexiconEntries.map((candidate) =>
          candidate.id === entryId ? deletedEntry : candidate,
        ),
        events: [...current.events, createEvent("LEXICON_DELETED", { entry: deletedEntry })],
      };
    });
  }, [canEdit]);

  const restoreLexiconEntry = useCallback((entryId: string) => {
    if (!canEdit) return;
    const restoredAt = timestamp();
    setState((current) => {
      const entry = current.lexiconEntries.find((candidate) => candidate.id === entryId);
      if (!entry) return current;
      const restoredEntry: LexiconEntry = { ...entry, deletedAt: undefined, updatedAt: restoredAt };
      return {
        ...current,
        lexiconEntries: current.lexiconEntries.map((candidate) =>
          candidate.id === entryId ? restoredEntry : candidate,
        ),
        events: [...current.events, createEvent("LEXICON_UPDATED", { before: entry, after: restoredEntry })],
      };
    });
  }, [canEdit]);

  const deleteJournalEntry = useCallback((entryId: string) => {
    if (!canEdit) return;
    const deletedAt = timestamp();
    setState((current) => {
      const entry = current.journalEntries.find((candidate) => candidate.id === entryId);
      if (!entry) return current;
      const deletedEntry: JournalEntry = { ...entry, deletedAt, updatedAt: deletedAt };
      return {
        ...current,
        journalEntries: current.journalEntries.map((candidate) =>
          candidate.id === entryId ? deletedEntry : candidate,
        ),
        events: [...current.events, createEvent("JOURNAL_DELETED", { entry: deletedEntry })],
      };
    });
  }, [canEdit]);

  return {
    state,
    hydrated,
    syncStatus,
    syncError,
    refreshPlannerState,
    tasksById,
    createTask,
    createTaskAndSchedule,
    updateTask,
    deleteTask,
    hideTask,
    restoreTask,
    scheduleTask,
    scheduleTaskOnce,
    moveScheduleBlock,
    deleteScheduleBlock,
    createJournalEntry,
    deleteJournalEntry,
    createLexiconEntry,
    updateLexiconEntry,
    deleteLexiconEntry,
    restoreLexiconEntry,
  };
}

export function isCloudSyncUnavailable(status: PlannerSyncStatus) {
  return status === "temporary" || status === "error";
}
