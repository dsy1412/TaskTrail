"use client";

import { CalendarPlus, ChevronDown, ChevronUp, Clock3, ListPlus, Plus, Save, Sparkles, Zap } from "lucide-react";
import { type Dispatch, FormEvent, type RefObject, type SetStateAction, useMemo, useRef, useState } from "react";
import { TaskCard } from "@/components/TaskCard";
import { durationToMinutes, durationUnitMinutes, formatDuration, type DurationUnit } from "@/lib/duration";
import { moduleTheme } from "@/lib/moduleTheme";
import { MODULES, type ModuleName, type PlannerState, type Priority, type Task } from "@/lib/types";

const priorityOptions: Priority[] = ["High", "Medium", "Low"];

const defaultForm = {
  title: "",
  module: "Project" as ModuleName,
  priority: "Medium" as Priority,
  estimatedDurationMinutes: 60,
  notes: "",
  queued: true,
};

const quickDurations = [
  { label: "Instant", minutes: 0 },
  { label: "15m", minutes: 15 },
  { label: "30m", minutes: 30 },
  { label: "1h", minutes: 60 },
  { label: "2h", minutes: 120 },
  { label: "1d", minutes: durationUnitMinutes.days },
  { label: "1w", minutes: durationUnitMinutes.weeks },
  { label: "1mo", minutes: durationUnitMinutes.months },
];

const durationUnits: Array<{ value: DurationUnit; label: string }> = [
  { value: "minutes", label: "min" },
  { value: "hours", label: "hours" },
  { value: "days", label: "days" },
  { value: "weeks", label: "weeks" },
  { value: "months", label: "months" },
];

const quickTaskPresets: Array<typeof defaultForm> = [
  {
    title: "Deep work block",
    module: "Project",
    priority: "High",
    estimatedDurationMinutes: 90,
    notes: "One focused output, no context switching.",
    queued: true,
  },
  {
    title: "Study review",
    module: "Study",
    priority: "Medium",
    estimatedDurationMinutes: 60,
    notes: "Review notes and extract next actions.",
    queued: true,
  },
  {
    title: "Workout",
    module: "Health",
    priority: "Medium",
    estimatedDurationMinutes: 45,
    notes: "Keep the habit alive.",
    queued: true,
  },
  {
    title: "Career outreach",
    module: "Career",
    priority: "High",
    estimatedDurationMinutes: 40,
    notes: "Send one clear message.",
    queued: true,
  },
  {
    title: "Weekly review",
    module: "Weekly Plan",
    priority: "Medium",
    estimatedDurationMinutes: 30,
    notes: "Compare plan with actual trail.",
    queued: true,
  },
  {
    title: "Monthly direction",
    module: "Monthly Plan",
    priority: "High",
    estimatedDurationMinutes: 60,
    notes: "Choose the next planning theme.",
    queued: true,
  },
];

export function TaskBackpack({
  state,
  onCreateTask,
  onCreateAndScheduleTask,
  onUpdateTask,
  onDeleteTask,
  onScheduleTask,
  onScheduleTaskOnce,
  canEdit,
}: {
  state: PlannerState;
  onCreateTask: (input: typeof defaultForm) => Task;
  onCreateAndScheduleTask: (input: typeof defaultForm) => void;
  onUpdateTask: (taskId: string, patch: Partial<Omit<Task, "id" | "createdAt">>) => void;
  onDeleteTask: (taskId: string) => void;
  onScheduleTask: (taskId: string) => void;
  onScheduleTaskOnce: (taskId: string) => void;
  canEdit: boolean;
}) {
  const [open, setOpen] = useState(true);
  const [mobileMode, setMobileMode] = useState<"quick" | "custom">("quick");
  const [moduleFilter, setModuleFilter] = useState<ModuleName | "All">("All");
  const [form, setForm] = useState(defaultForm);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const titleInputRef = useRef<HTMLInputElement | null>(null);

  const activeTasks = useMemo(
    () => state.tasks.filter((task) => !task.deletedAt && task.queued !== false),
    [state.tasks],
  );
  const visibleTasks = useMemo(
    () => (moduleFilter === "All" ? activeTasks : activeTasks.filter((task) => task.module === moduleFilter)),
    [activeTasks, moduleFilter],
  );

  function submitTask(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    if (!canEdit) return;
    const submittedForm = {
      ...form,
      title: titleInputRef.current?.value ?? form.title,
    };
    if (!submittedForm.title.trim()) {
      titleInputRef.current?.focus();
      return;
    }
    if (editingTaskId) {
      onUpdateTask(editingTaskId, submittedForm);
      setEditingTaskId(null);
    } else if (submittedForm.queued) {
      onCreateTask(submittedForm);
    } else {
      onCreateAndScheduleTask(submittedForm);
    }
    setForm(defaultForm);
    titleInputRef.current?.focus();
  }

  function focusCreateTask() {
    if (!canEdit) return;
    setOpen(true);
    setMobileMode("custom");
    window.setTimeout(() => titleInputRef.current?.focus(), 0);
  }

  function editTask(task: Task) {
    if (!canEdit) return;
    setOpen(true);
    setMobileMode("custom");
    setEditingTaskId(task.id);
    setForm({
      title: task.title,
      module: task.module,
      priority: task.priority,
      estimatedDurationMinutes: task.estimatedDurationMinutes,
      notes: task.notes,
      queued: task.queued ?? true,
    });
  }

  function createAndSchedulePreset(preset: typeof defaultForm) {
    if (!canEdit) return;
    onCreateAndScheduleTask({ ...preset, queued: false });
    setOpen(false);
    setMobileMode("quick");
  }

  return (
    <aside
      data-testid="task-backpack"
      className="fixed inset-x-2 bottom-[calc(env(safe-area-inset-bottom)+0.5rem)] z-40 mx-auto max-w-[112rem] sm:inset-x-5 sm:bottom-[calc(env(safe-area-inset-bottom)+0.75rem)] lg:inset-x-6 xl:inset-x-8"
    >
      <div className="glass-panel overflow-hidden rounded-xl">
        <div className="flex items-center justify-between gap-3 border-b border-slate-800 px-3 py-3 sm:px-4">
          <div>
            <h2 className="text-base font-semibold text-slate-50 sm:hidden">Quick Tasks</h2>
            <h2 className="hidden text-base font-semibold text-slate-50 sm:block">Task Backpack</h2>
            <p className="hidden text-xs font-medium text-slate-400 sm:block">
              Capture, filter, and schedule from one queue.
            </p>
            {!canEdit ? <p className="mt-1 text-xs font-semibold text-amber-700">Read-only preview</p> : null}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Focus task title"
              title="Add task"
              className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-300 px-3 py-2 text-xs font-semibold text-slate-950 shadow-sm transition hover:bg-cyan-200"
              onClick={focusCreateTask}
              disabled={!canEdit}
            >
              <Plus className="h-4 w-4" />
              Add
            </button>
            <button
              type="button"
              aria-label={open ? "Collapse backpack" : "Expand backpack"}
              title={open ? "Collapse" : "Expand"}
              className="rounded-lg border border-slate-700 bg-slate-950 p-2 text-slate-300 shadow-sm transition hover:text-slate-50"
              onClick={() => setOpen((value) => !value)}
            >
              {open ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {open ? (
          <div className="overflow-hidden">
              <div className="fine-scrollbar grid max-h-[48dvh] gap-3 overflow-y-auto p-3 sm:hidden">
                <div className="grid grid-cols-2 rounded-lg border border-slate-700 bg-slate-950 p-1 text-xs font-semibold text-slate-400 shadow-sm">
                  <button
                    type="button"
                      className={`rounded-md px-3 py-2 transition ${
                      mobileMode === "quick" ? "bg-cyan-300 text-slate-950 shadow-sm" : ""
                    }`}
                    onClick={() => setMobileMode("quick")}
                  >
                    Quick
                  </button>
                  <button
                    type="button"
                      className={`rounded-md px-3 py-2 transition ${
                      mobileMode === "custom" ? "bg-cyan-300 text-slate-950 shadow-sm" : ""
                    }`}
                    onClick={() => setMobileMode("custom")}
                  >
                    Custom
                  </button>
                </div>

                {mobileMode === "quick" ? (
                  <div className="grid gap-3">
                    <section className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
                      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-100">
                        <Sparkles className="h-4 w-4 text-slate-400" />
                        Presets
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {quickTaskPresets.map((preset) => (
                          <button
                            key={preset.title}
                            type="button"
                            aria-label={`Add preset ${preset.title}`}
                            className="min-h-20 rounded-lg border border-slate-800 bg-slate-900 p-3 text-left shadow-sm transition active:scale-[0.98]"
                            onClick={() => createAndSchedulePreset(preset)}
                            disabled={!canEdit}
                          >
                            <span className="block text-sm font-semibold text-slate-50">{preset.title}</span>
                            <span className="mt-1 block text-xs font-semibold text-slate-400">
                              {preset.module} - {formatDuration(preset.estimatedDurationMinutes)}
                            </span>
                          </button>
                        ))}
                      </div>
                    </section>

                    <section className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
                      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-100">
                        <ListPlus className="h-4 w-4 text-slate-400" />
                        Existing tasks
                      </div>
                      <div className="grid gap-2">
                        {activeTasks.slice(0, 5).map((task) => (
                          <button
                            key={task.id}
                            type="button"
                            aria-label={`Plan ${task.title} today`}
                            className="flex items-center justify-between gap-3 rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-left shadow-sm transition active:scale-[0.98]"
                            onClick={() => {
                              onScheduleTask(task.id);
                              setOpen(false);
                            }}
                            disabled={!canEdit}
                          >
                            <span className="min-w-0">
                              <span className="block truncate text-sm font-semibold text-slate-50">{task.title}</span>
                              <span className="block text-xs font-semibold text-slate-400">{task.module}</span>
                            </span>
                            <CalendarPlus className="h-4 w-4 shrink-0 text-slate-400" />
                          </button>
                        ))}
                      </div>
                    </section>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    <form className="rounded-lg border border-slate-800 bg-slate-950/60 p-3" onSubmit={submitTask}>
                      <div className="mb-3 flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-slate-50">{editingTaskId ? "Edit task" : "Create task"}</h3>
                        <button
                          type="submit"
                          aria-label={editingTaskId ? "Save task" : "Add task"}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-300 px-3 py-1.5 text-xs font-semibold text-slate-950 transition hover:bg-cyan-200"
                          disabled={!canEdit}
                        >
                          <Save className="h-3.5 w-3.5" />
                          {editingTaskId ? "Save" : form.queued ? "Add" : "Add once"}
                        </button>
                      </div>
                      <MobileTaskFormFields
                        form={form}
                        setForm={setForm}
                        titleInputRef={titleInputRef}
                        disabled={!canEdit}
                        submitLabel={editingTaskId ? "Save task" : form.queued ? "Add task" : "Add once today"}
                      />
                    </form>
                  </div>
                )}
              </div>

              <div className="fine-scrollbar hidden max-h-[62dvh] gap-3 overflow-y-auto p-3 sm:grid sm:max-h-[20rem] sm:gap-4 sm:p-4 lg:grid-cols-[18rem_minmax(0,1fr)]">
                <div className="flex flex-col gap-3">
                  <form className="rounded-lg border border-slate-800 bg-slate-950/60 p-3" onSubmit={submitTask}>
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-slate-50">{editingTaskId ? "Edit task" : "Create task"}</h3>
                      <button
                        type="submit"
                        aria-label={editingTaskId ? "Save task" : "Add task"}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-300 px-3 py-1.5 text-xs font-semibold text-slate-950 transition hover:bg-cyan-200"
                        disabled={!canEdit}
                      >
                        <Save className="h-3.5 w-3.5" />
                        {editingTaskId ? "Save" : form.queued ? "Add" : "Add once"}
                      </button>
                    </div>
                    <MobileTaskFormFields
                      form={form}
                      setForm={setForm}
                      titleInputRef={titleInputRef}
                      disabled={!canEdit}
                      submitLabel={editingTaskId ? "Save task" : form.queued ? "Add task" : "Add once today"}
                    />
                  </form>
                </div>

                <section className="min-w-0 rounded-lg border border-slate-800 bg-slate-950/45 p-3">
                  <div className="mb-3 grid gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(38rem,0.9fr)] xl:items-end">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-50">Task queue</h3>
                      <p className="text-xs font-medium text-slate-400">
                        {visibleTasks.length} shown / {activeTasks.length} total
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 rounded-xl border border-slate-800 bg-slate-950 p-1.5 text-xs font-semibold sm:grid-cols-4 xl:grid-cols-7">
                      <button
                        type="button"
                        className={`grid min-h-10 grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-lg px-3 py-2 text-left transition ${
                          moduleFilter === "All"
                            ? "bg-slate-100 text-slate-950 shadow-sm"
                            : "text-slate-400 hover:bg-slate-900 hover:text-slate-100"
                        }`}
                        onClick={() => setModuleFilter("All")}
                      >
                        <span className="truncate">All</span>
                        <span
                          className={`rounded-md px-1.5 py-0.5 text-[0.68rem] ${
                            moduleFilter === "All" ? "bg-slate-950/10" : "bg-slate-800 text-slate-400"
                          }`}
                        >
                          {activeTasks.length}
                        </span>
                      </button>
                      {MODULES.map((module) => {
                        const count = activeTasks.filter((task) => task.module === module).length;
                        const selected = moduleFilter === module;
                        return (
                          <button
                            key={module}
                            type="button"
                            className={`grid min-h-10 grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-lg px-3 py-2 text-left transition ${
                              selected ? "text-white shadow-sm" : "text-slate-400 hover:bg-slate-900 hover:text-slate-100"
                            }`}
                            style={selected ? { backgroundColor: moduleTheme[module].color } : undefined}
                            onClick={() => setModuleFilter(module)}
                          >
                            <span className="truncate">{module}</span>
                            <span
                              className={`rounded-md px-1.5 py-0.5 text-[0.68rem] ${
                                selected ? "bg-white/20 text-white" : "bg-slate-800 text-slate-400"
                              }`}
                            >
                              {count}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid gap-2 md:grid-cols-2 2xl:grid-cols-3">
                    {visibleTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        disabled={!canEdit}
                        onEdit={canEdit ? () => editTask(task) : undefined}
                        onDelete={canEdit ? () => onDeleteTask(task.id) : undefined}
                        onSchedule={canEdit ? () => onScheduleTask(task.id) : undefined}
                        onScheduleOnce={canEdit ? () => onScheduleTaskOnce(task.id) : undefined}
                      />
                    ))}
                  </div>
                </section>
              </div>
          </div>
        ) : null}
      </div>
    </aside>
  );
}

function MobileTaskFormFields({
  form,
  setForm,
  titleInputRef,
  disabled,
  submitLabel = "Add task",
}: {
  form: typeof defaultForm;
  setForm: Dispatch<SetStateAction<typeof defaultForm>>;
  titleInputRef: RefObject<HTMLInputElement | null>;
  disabled: boolean;
  submitLabel?: string;
}) {
  return (
    <div className="grid gap-2">
      <input
        ref={titleInputRef}
        name="title"
        value={form.title}
        onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
        placeholder="Task title"
        className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-300"
        disabled={disabled}
      />
      <label className="grid gap-1.5 text-xs font-semibold text-slate-400">
        Notes / 备注
        <textarea
          name="notes"
          value={form.notes}
          onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
          placeholder="Add context, next step, or links"
          aria-label="Task notes"
          rows={3}
          className="min-h-20 resize-none rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-normal leading-5 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-300"
          disabled={disabled}
        />
      </label>
      <fieldset className="grid gap-1.5">
        <legend className="text-xs font-semibold text-slate-400">Module</legend>
        <div className="grid grid-cols-2 gap-1.5">
          {MODULES.map((module) => {
            const selected = form.module === module;
            return (
              <button
                key={module}
                type="button"
                aria-pressed={selected}
                className={`rounded-lg border px-2 py-2 text-xs font-semibold transition ${
                  selected
                    ? "border-transparent text-slate-950"
                    : "border-slate-700 bg-slate-950 text-slate-300 hover:border-slate-500 hover:text-slate-50"
                }`}
                style={selected ? { backgroundColor: moduleTheme[module].color } : undefined}
                onClick={() => setForm((current) => ({ ...current, module }))}
                disabled={disabled}
              >
                {module}
              </button>
            );
          })}
        </div>
      </fieldset>
      <div className="grid grid-cols-2 gap-2">
        <select
          value={form.priority}
          onChange={(event) => setForm((current) => ({ ...current, priority: event.target.value as Priority }))}
          className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none"
          disabled={disabled}
        >
          {priorityOptions.map((priority) => (
            <option key={priority}>{priority}</option>
          ))}
        </select>
        <button
          type="button"
          aria-pressed={!form.queued}
          className={`rounded-lg border px-3 py-2 text-sm font-semibold transition ${
            form.queued
              ? "border-slate-700 bg-slate-950 text-slate-300 hover:border-slate-500 hover:text-slate-50"
              : "border-cyan-300 bg-cyan-300 text-slate-950"
          }`}
          onClick={() => setForm((current) => ({ ...current, queued: !current.queued }))}
          disabled={disabled}
        >
          {form.queued ? "Keep in queue" : "One-time"}
        </button>
      </div>
      <DurationField
        value={form.estimatedDurationMinutes}
        onChange={(estimatedDurationMinutes) =>
          setForm((current) => ({
            ...current,
            estimatedDurationMinutes,
          }))
        }
        disabled={disabled}
      />
      <button
        type="submit"
        className="flex items-center justify-center gap-2 rounded-lg bg-cyan-300 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200"
        disabled={disabled}
      >
        <Save className="h-4 w-4" />
        {submitLabel}
      </button>
    </div>
  );
}

function DurationField({
  value,
  onChange,
  disabled,
}: {
  value: number;
  onChange: (minutes: number) => void;
  disabled: boolean;
}) {
  const [unit, setUnit] = useState<DurationUnit>("minutes");
  const customValue = value > 0 ? trimNumber(value / durationUnitMinutes[unit]) : "";

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-2">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
          {value === 0 ? <Zap className="h-3.5 w-3.5 text-cyan-300" /> : <Clock3 className="h-3.5 w-3.5" />}
          {value === 0 ? "Instant capture" : formatDuration(value)}
        </span>
      </div>

      <div className="grid grid-cols-4 gap-1">
        {quickDurations.map((duration) => (
          <button
            key={duration.label}
            type="button"
            className={`rounded-md px-2 py-1.5 text-xs font-semibold transition ${
              value === duration.minutes
                ? "bg-cyan-300 text-slate-950"
                : "bg-slate-900 text-slate-400 hover:text-slate-100"
            }`}
            onClick={() => onChange(duration.minutes)}
            disabled={disabled}
          >
            {duration.label}
          </button>
        ))}
      </div>

      <div className="mt-2 grid grid-cols-[minmax(0,1fr)_7rem] gap-2">
        <input
          inputMode="decimal"
          value={customValue}
          onChange={(event) => onChange(durationToMinutes(Number(event.target.value), unit))}
          placeholder="Custom"
          className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-300"
          disabled={disabled}
        />
        <select
          value={unit}
          onChange={(event) => setUnit(event.target.value as DurationUnit)}
          className="rounded-lg border border-slate-700 bg-slate-950 px-2 py-2 text-sm text-slate-100 outline-none"
          disabled={disabled}
        >
          {durationUnits.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

function trimNumber(value: number) {
  if (!Number.isFinite(value)) return "";
  return Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/\.?0+$/, "");
}
