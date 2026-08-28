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
import {
  AlertTriangle,
  BookOpenText,
  CalendarDays,
  CalendarRange,
  Cloud,
  GraduationCap,
  LockKeyhole,
  LogIn,
  LogOut,
  RefreshCcw,
  Sparkles,
} from "lucide-react";
import { signIn, signOut, useSession } from "next-auth/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { DegreePlanContent } from "@/components/DegreePlanPage";
import { TaskBackpack } from "@/components/TaskBackpack";
import { TaskCardPreview } from "@/components/TaskCard";
import { TodayCanvas } from "@/components/TodayCanvas";
import { InstallAppButton } from "@/components/InstallAppButton";
import { LexiconPage } from "@/components/LexiconPage";
import { PlanningCalendar } from "@/components/PlanningCalendar";
import { VibeJournal } from "@/components/VibeJournal";
import { WeeklyMonthlySummary } from "@/components/WeeklyMonthlySummary";
import { addDaysIso, TIME_SLOTS, todayIsoDate } from "@/lib/date";
import { getScheduledColumnCount, getVisibleColumnCount } from "@/lib/columns";
import { isCloudSyncUnavailable, type PlannerSyncStatus, usePlannerStore } from "@/lib/usePlannerStore";

const MAX_COLUMNS = 4;

export function PlannerApp() {
  const { data: session, status: authStatus } = useSession();
  const canEdit = authStatus === "authenticated";
  const planner = usePlannerStore({ canEdit, syncToCloud: canEdit });
  const [hasMounted, setHasMounted] = useState(false);
  const [view, setView] = useState<"today" | "calendar" | "lexicon" | "degree">("today");
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

  function quickScheduleTask(taskId: string, date = selectedDate) {
    if (!canEdit) return;
    planner.scheduleTask(taskId, getNextOpenScheduleSlot(date));
    selectDate(date);
    setView("today");
  }

  function quickScheduleTaskOnce(taskId: string, date = selectedDate) {
    if (!canEdit) return;
    planner.scheduleTaskOnce(taskId, getNextOpenScheduleSlot(date));
    selectDate(date);
    setView("today");
  }

  function quickCreateAndScheduleTask(input: {
    title: string;
    module: Parameters<typeof planner.createTask>[0]["module"];
    priority: Parameters<typeof planner.createTask>[0]["priority"];
    estimatedDurationMinutes: number;
    notes?: string;
    queued?: boolean;
  }) {
    if (!canEdit) return;
    planner.createTaskAndSchedule(input, getNextOpenScheduleSlot());
    setView("today");
  }

  function getNextOpenScheduleSlot(date = selectedDate) {
    const occupied = new Set(
      planner.state.scheduleBlocks
        .filter((block) => !block.deletedAt && block.date === date && block.columnIndex === 0)
        .map((block) => block.timeSlot),
    );
    const timeSlot = TIME_SLOTS.find((slot) => !occupied.has(slot)) ?? TIME_SLOTS[0];
    return {
      date,
      timeSlot,
      columnIndex: 0,
    };
  }

  function changeSelectedDate(days: number) {
    setSelectedDate((date) => addDaysIso(date, days));
    setDraftColumnCount(1);
  }

  function selectDate(date: string) {
    setSelectedDate(date);
    setDraftColumnCount(1);
  }

  function returnToToday() {
    setSelectedDate(todayIsoDate());
    setDraftColumnCount(1);
  }

  function handleDragStart(event: DragStartEvent) {
    if (!canEdit) return;
    setActiveDragId(String(event.active.id));
    setDraftColumnCount(scheduledMaxColumn);
  }

  function handleDragMove(event: DragMoveEvent) {
    if (!canEdit) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    const translated = event.active.rect.current.translated;
    if (!rect || !translated || visibleColumns >= MAX_COLUMNS) return;

    const centerX = translated.left + translated.width / 2;
    const nearRightEdge = centerX > rect.right - 72 && centerX < rect.right + 120;
    if (nearRightEdge) setDraftColumnCount((count) => Math.min(MAX_COLUMNS, Math.max(count + 1, scheduledMaxColumn)));
  }

  function handleDragEnd(event: DragEndEvent) {
    if (!canEdit) return;
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
    if (!canEdit) return;
    setActiveDragId(null);
    setDraftColumnCount(1);
  }

  if (!hasMounted || authStatus === "loading") {
    return <PrivateAccessScreen mode="checking" />;
  }

  if (!canEdit) {
    return <PrivateAccessScreen mode="sign-in" />;
  }

  return (
    <main
      className={`min-h-screen px-3 pt-3 text-ink sm:px-5 lg:px-6 xl:px-8 ${
        view === "today" || view === "calendar" ? "pb-[calc(48dvh+2rem)] sm:pb-[24rem]" : "pb-6"
      }`}
    >
      <DndContext
        id="tasktrail-planner-dnd"
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragMove={handleDragMove}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="mx-auto flex w-full max-w-[112rem] flex-col gap-4">
          <header className="grid gap-3 px-1 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:items-start">
            <div className="min-w-0 lg:col-start-1 lg:row-start-1">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-400">
                <Sparkles className="h-4 w-4" />
                Modular planning MVP
              </div>
              <h1 className="mt-1 text-3xl font-semibold tracking-normal text-slate-50 sm:text-4xl">TaskTrail</h1>
            </div>

            <div className="flex flex-wrap justify-end gap-2 justify-self-end lg:col-start-3 lg:row-start-1">
              <InstallAppButton />
              <AuthControls
                authStatus={authStatus}
                email={session?.user?.email}
                syncStatus={planner.syncStatus}
                onRefreshSync={planner.refreshPlannerState}
              />
            </div>
            <div className="glass-panel grid w-full grid-cols-2 rounded-xl p-1 sm:w-auto sm:grid-cols-4 lg:col-start-2 lg:row-start-1 lg:justify-self-center">
              <button
                type="button"
                className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition sm:px-4 ${
                  view === "today" ? "bg-cyan-300 text-slate-950 shadow-soft" : "text-slate-400 hover:text-slate-100"
                }`}
                onClick={() => setView("today")}
              >
                <CalendarDays className="h-4 w-4" />
                Today
              </button>
              <button
                type="button"
                className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition sm:px-4 ${
                  view === "calendar" ? "bg-cyan-300 text-slate-950 shadow-soft" : "text-slate-400 hover:text-slate-100"
                }`}
                onClick={() => setView("calendar")}
              >
                <CalendarRange className="h-4 w-4" />
                Calendar
              </button>
              <button
                type="button"
                className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition sm:px-4 ${
                  view === "lexicon" ? "bg-cyan-300 text-slate-950 shadow-soft" : "text-slate-400 hover:text-slate-100"
                }`}
                onClick={() => setView("lexicon")}
              >
                <BookOpenText className="h-4 w-4" />
                Lexicon
              </button>
              <button
                type="button"
                className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition sm:px-4 ${
                  view === "degree" ? "bg-cyan-300 text-slate-950 shadow-soft" : "text-slate-400 hover:text-slate-100"
                }`}
                onClick={() => setView("degree")}
              >
                <GraduationCap className="h-4 w-4" />
                Degree
              </button>
            </div>
          </header>

          {isCloudSyncUnavailable(planner.syncStatus) ? (
            <SyncNotice status={planner.syncStatus} detail={planner.syncError} />
          ) : null}

          {view === "today" ? (
            <section
              data-testid="today-view"
               className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]"
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
                  onSelectDate={selectDate}
                  onDeleteBlock={planner.deleteScheduleBlock}
                  canEdit={canEdit}
                />
                <div className="grid gap-4">
                  <VibeJournal
                    state={planner.state}
                    date={selectedDate}
                    onCreateEntry={planner.createJournalEntry}
                    onDeleteEntry={planner.deleteJournalEntry}
                    canEdit={canEdit}
                  />
                  <WeeklyMonthlySummary state={planner.state} />
                </div>
            </section>
          ) : null}

          {view === "calendar" ? (
            <PlanningCalendar
              state={planner.state}
              tasksById={planner.tasksById}
              selectedDate={selectedDate}
              onSelectDate={selectDate}
              onOpenDay={() => setView("today")}
            />
          ) : null}

          {view === "degree" ? <DegreePlanContent /> : null}
          {view === "lexicon" ? (
            <LexiconPage
              state={planner.state}
              onCreateEntry={planner.createLexiconEntry}
              onUpdateEntry={planner.updateLexiconEntry}
              onDeleteEntry={planner.deleteLexiconEntry}
              canEdit={canEdit}
            />
          ) : null}

        </div>

        {view === "today" || view === "calendar" ? (
          <TaskBackpack
            state={planner.state}
            onCreateTask={planner.createTask}
            onCreateAndScheduleTask={quickCreateAndScheduleTask}
            onUpdateTask={planner.updateTask}
            onHideTask={planner.hideTask}
            onRestoreTask={planner.restoreTask}
            onScheduleTask={quickScheduleTask}
            onScheduleTaskOnce={quickScheduleTaskOnce}
            selectedDate={selectedDate}
            onSelectDate={selectDate}
            canEdit={canEdit}
          />
        ) : null}
        <DragOverlay dropAnimation={null} zIndex={100}>
          {activeDragPreview ? <div className="w-80 max-w-[80vw]">{activeDragPreview}</div> : null}
        </DragOverlay>
      </DndContext>
    </main>
  );
}

function PrivateAccessScreen({ mode }: { mode: "checking" | "sign-in" }) {
  const isChecking = mode === "checking";

  return (
    <main className="grid min-h-screen place-items-center px-4 py-8 text-ink">
      <section className="glass-panel w-full max-w-md rounded-[2rem] p-6 shadow-soft sm:p-8">
        <div className="mb-5 inline-flex rounded-full bg-white p-3 text-slate-700 shadow-sm">
          {isChecking ? <Cloud className="h-5 w-5" /> : <LockKeyhole className="h-5 w-5" />}
        </div>
        <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
          <Sparkles className="h-4 w-4" />
          Private planner
        </div>
        <h1 className="mt-2 text-3xl font-semibold tracking-normal sm:text-4xl">TaskTrail</h1>
        <p className="mt-3 text-sm font-medium leading-6 text-slate-600">
          {isChecking
            ? "Checking your signed-in account."
            : "Sign in with your approved Google account to open your daily tasks and planning trail."}
        </p>
        <button
          type="button"
          aria-label="Sign in with Google"
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-slate-950 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-wait disabled:bg-slate-500"
          onClick={() => void signIn("google")}
          disabled={isChecking}
        >
          <LogIn className="h-4 w-4" />
          {isChecking ? "Checking" : "Sign in with Google"}
        </button>
      </section>
    </main>
  );
}

function AuthControls({
  authStatus,
  email,
  syncStatus,
  onRefreshSync,
}: {
  authStatus: "authenticated" | "loading" | "unauthenticated";
  email?: string | null;
  syncStatus: PlannerSyncStatus;
  onRefreshSync?: () => void | Promise<void>;
}) {
  if (authStatus === "loading") {
    return (
      <div className="glass-panel inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold text-slate-400">
        <Cloud className="h-4 w-4" />
        <span className="hidden sm:inline">Checking sign-in</span>
        <span className="sm:hidden">Checking</span>
      </div>
    );
  }

  if (authStatus !== "authenticated") {
    return (
      <button
        type="button"
        aria-label="Sign in with Google"
        className="inline-flex shrink-0 items-center justify-center gap-2 justify-self-end rounded-lg bg-cyan-300 px-3 py-2 text-sm font-semibold text-slate-950 shadow-sm transition hover:bg-cyan-200 sm:px-4"
        onClick={() => void signIn("google")}
      >
        <LogIn className="h-4 w-4" />
        <span className="sm:hidden">Google</span>
        <span className="hidden sm:inline">Sign in with Google</span>
      </button>
    );
  }

  return (
    <div className="glass-panel flex max-w-full flex-wrap items-center justify-end gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-slate-400">
      {syncStatus === "error" ? <AlertTriangle className="h-4 w-4 text-amber-300" /> : <Cloud className="h-4 w-4" />}
      <span className="hidden max-w-[11rem] truncate sm:inline">{email}</span>
      <span>{syncLabel(syncStatus)}</span>
      <button
        type="button"
        aria-label="Refresh sync"
        title="Refresh sync"
        className="rounded-md border border-slate-700 bg-slate-950 p-1.5 text-slate-300 shadow-sm transition hover:text-slate-50 disabled:cursor-wait disabled:opacity-60"
        onClick={() => void onRefreshSync?.()}
        disabled={syncStatus === "loading" || syncStatus === "saving"}
      >
        <RefreshCcw className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        aria-label="Sign out"
        title="Sign out"
        className="rounded-md border border-slate-700 bg-slate-950 p-1.5 text-slate-300 shadow-sm transition hover:text-slate-50"
        onClick={() => void signOut()}
      >
        <LogOut className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function syncLabel(status: PlannerSyncStatus) {
  if (status === "saving") return "Saving";
  if (status === "synced") return "Synced";
  if (status === "loading") return "Loading";
  if (status === "temporary") return "No cloud sync";
  if (status === "error") return "Local backup";
  return "Editable";
}

function SyncNotice({ status, detail }: { status: PlannerSyncStatus; detail?: string | null }) {
  const copy =
    status === "temporary"
      ? "Cross-device sync is off because production storage is using temporary server memory. Set KV or Upstash Redis in Vercel before relying on phone sync."
      : "Cloud sync failed, so this browser is using a local backup. Changes made here will not appear on your phone until the cloud storage/API error is fixed.";

  return (
    <div
      data-testid="sync-notice"
      className="rounded-xl border border-amber-400/35 bg-amber-400/10 px-4 py-3 text-sm font-semibold leading-6 text-amber-100"
    >
      {copy}
      {detail ? <div className="mt-2 text-xs text-amber-200/85">Storage detail: {detail}</div> : null}
    </div>
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
