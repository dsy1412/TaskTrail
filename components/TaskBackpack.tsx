"use client";

import { CalendarPlus, ChevronDown, ChevronUp, ListPlus, Plus, Save, Sparkles } from "lucide-react";
import { type Dispatch, FormEvent, type RefObject, type SetStateAction, useMemo, useRef, useState } from "react";
import { TaskCard } from "@/components/TaskCard";
import { VoiceTaskInput } from "@/components/VoiceTaskInput";
import { MODULES, type ModuleName, type ParsedTaskInput, type PlannerState, type Priority, type Task } from "@/lib/types";

const priorityOptions: Priority[] = ["High", "Medium", "Low"];

const defaultForm = {
  title: "",
  module: "Project" as ModuleName,
  priority: "Medium" as Priority,
  estimatedDurationMinutes: 60,
  notes: "",
};

const quickTaskPresets: Array<typeof defaultForm> = [
  {
    title: "Deep work block",
    module: "Project",
    priority: "High",
    estimatedDurationMinutes: 90,
    notes: "One focused output, no context switching.",
  },
  {
    title: "Study review",
    module: "Study",
    priority: "Medium",
    estimatedDurationMinutes: 60,
    notes: "Review notes and extract next actions.",
  },
  {
    title: "Workout",
    module: "Health",
    priority: "Medium",
    estimatedDurationMinutes: 45,
    notes: "Keep the habit alive.",
  },
  {
    title: "Career outreach",
    module: "Career",
    priority: "High",
    estimatedDurationMinutes: 40,
    notes: "Send one clear message.",
  },
  {
    title: "Weekly review",
    module: "Weekly Plan",
    priority: "Medium",
    estimatedDurationMinutes: 30,
    notes: "Compare plan with actual trail.",
  },
  {
    title: "Monthly direction",
    module: "Monthly Plan",
    priority: "High",
    estimatedDurationMinutes: 60,
    notes: "Choose the next planning theme.",
  },
];

export function TaskBackpack({
  state,
  onCreateTask,
  onCreateAndScheduleTask,
  onUpdateTask,
  onDeleteTask,
  onScheduleTask,
  canEdit,
}: {
  state: PlannerState;
  onCreateTask: (input: typeof defaultForm) => Task;
  onCreateAndScheduleTask: (input: typeof defaultForm) => void;
  onUpdateTask: (taskId: string, patch: Partial<Omit<Task, "id" | "createdAt">>) => void;
  onDeleteTask: (taskId: string) => void;
  onScheduleTask: (taskId: string) => void;
  canEdit: boolean;
}) {
  const [open, setOpen] = useState(true);
  const [mobileMode, setMobileMode] = useState<"quick" | "custom">("quick");
  const [form, setForm] = useState(defaultForm);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const titleInputRef = useRef<HTMLInputElement | null>(null);

  const activeTasks = useMemo(() => state.tasks.filter((task) => !task.deletedAt), [state.tasks]);

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
    } else {
      onCreateTask(submittedForm);
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
    });
  }

  function useParsedVoiceTask(task: ParsedTaskInput) {
    if (!canEdit) return;
    setOpen(true);
    setMobileMode("custom");
    setEditingTaskId(null);
    setForm({
      title: task.title,
      module: task.module,
      priority: task.priority,
      estimatedDurationMinutes: task.estimatedDurationMinutes,
      notes: task.notes,
    });
  }

  function createAndSchedulePreset(preset: typeof defaultForm) {
    if (!canEdit) return;
    onCreateAndScheduleTask(preset);
    setOpen(false);
    setMobileMode("quick");
  }

  return (
    <aside
      data-testid="task-backpack"
      className="fixed inset-x-2 bottom-[calc(env(safe-area-inset-bottom)+0.5rem)] z-40 mx-auto max-w-7xl sm:inset-x-3 sm:bottom-[calc(env(safe-area-inset-bottom)+0.75rem)]"
    >
      <div className="glass-panel overflow-hidden rounded-[1.5rem] sm:rounded-[2rem]">
        <div className="flex items-center justify-between gap-3 border-b border-white/70 px-3 py-3 sm:px-4">
          <div>
            <h2 className="text-base font-semibold sm:hidden">Quick Tasks</h2>
            <h2 className="hidden text-base font-semibold sm:block">Task Backpack</h2>
            <p className="hidden text-xs font-medium text-slate-500 sm:block">
              Drag cards into the canvas. Backpack tasks stay here.
            </p>
            {!canEdit ? <p className="mt-1 text-xs font-semibold text-amber-700">Read-only preview</p> : null}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Focus task title"
              title="Add task"
              className="inline-flex items-center gap-1.5 rounded-full bg-slate-950 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-800"
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
              className="rounded-full bg-white p-2 text-slate-600 shadow-sm transition hover:text-slate-950"
              onClick={() => setOpen((value) => !value)}
            >
              {open ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {open ? (
          <div className="overflow-hidden">
              <div className="fine-scrollbar grid max-h-[48dvh] gap-3 overflow-y-auto p-3 sm:hidden">
                <div className="grid grid-cols-2 rounded-full bg-white/62 p-1 text-xs font-semibold text-slate-500 shadow-sm">
                  <button
                    type="button"
                    className={`rounded-full px-3 py-2 transition ${
                      mobileMode === "quick" ? "bg-slate-950 text-white shadow-sm" : ""
                    }`}
                    onClick={() => setMobileMode("quick")}
                  >
                    Quick
                  </button>
                  <button
                    type="button"
                    className={`rounded-full px-3 py-2 transition ${
                      mobileMode === "custom" ? "bg-slate-950 text-white shadow-sm" : ""
                    }`}
                    onClick={() => setMobileMode("custom")}
                  >
                    Custom
                  </button>
                </div>

                {mobileMode === "quick" ? (
                  <div className="grid gap-3">
                    <section className="rounded-2xl border border-white/70 bg-white/56 p-3">
                      <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
                        <Sparkles className="h-4 w-4 text-slate-500" />
                        Presets
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {quickTaskPresets.map((preset) => (
                          <button
                            key={preset.title}
                            type="button"
                            aria-label={`Add preset ${preset.title}`}
                            className="min-h-20 rounded-2xl bg-white/86 p-3 text-left shadow-sm transition active:scale-[0.98]"
                            onClick={() => createAndSchedulePreset(preset)}
                            disabled={!canEdit}
                          >
                            <span className="block text-sm font-semibold text-slate-950">{preset.title}</span>
                            <span className="mt-1 block text-xs font-semibold text-slate-500">
                              {preset.module} - {preset.estimatedDurationMinutes}m
                            </span>
                          </button>
                        ))}
                      </div>
                    </section>

                    <section className="rounded-2xl border border-white/70 bg-white/46 p-3">
                      <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
                        <ListPlus className="h-4 w-4 text-slate-500" />
                        Existing tasks
                      </div>
                      <div className="grid gap-2">
                        {activeTasks.slice(0, 5).map((task) => (
                          <button
                            key={task.id}
                            type="button"
                            aria-label={`Plan ${task.title} today`}
                            className="flex items-center justify-between gap-3 rounded-2xl bg-white/78 px-3 py-2 text-left shadow-sm transition active:scale-[0.98]"
                            onClick={() => {
                              onScheduleTask(task.id);
                              setOpen(false);
                            }}
                            disabled={!canEdit}
                          >
                            <span className="min-w-0">
                              <span className="block truncate text-sm font-semibold text-slate-950">{task.title}</span>
                              <span className="block text-xs font-semibold text-slate-500">{task.module}</span>
                            </span>
                            <CalendarPlus className="h-4 w-4 shrink-0 text-slate-500" />
                          </button>
                        ))}
                      </div>
                    </section>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    <VoiceTaskInput onParsedTask={useParsedVoiceTask} disabled={!canEdit} compact />
                    <form className="rounded-2xl border border-white/70 bg-white/62 p-3" onSubmit={submitTask}>
                      <div className="mb-3 flex items-center justify-between">
                        <h3 className="text-sm font-semibold">{editingTaskId ? "Edit task" : "Create task"}</h3>
                        <button
                          type="submit"
                          aria-label={editingTaskId ? "Save task" : "Add task"}
                          className="inline-flex items-center gap-1.5 rounded-full bg-slate-950 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-800"
                          disabled={!canEdit}
                        >
                          <Save className="h-3.5 w-3.5" />
                          {editingTaskId ? "Save" : "Add"}
                        </button>
                      </div>
                      <MobileTaskFormFields
                        form={form}
                        setForm={setForm}
                        titleInputRef={titleInputRef}
                        disabled={!canEdit}
                      />
                    </form>
                  </div>
                )}
              </div>

              <div className="fine-scrollbar hidden max-h-[62dvh] gap-3 overflow-y-auto p-3 sm:grid sm:max-h-[21rem] sm:gap-4 sm:p-4 lg:grid-cols-[22rem_minmax(0,1fr)]">
                <div className="flex flex-col gap-3">
                  <VoiceTaskInput onParsedTask={useParsedVoiceTask} disabled={!canEdit} />
                  <form className="rounded-2xl border border-white/70 bg-white/62 p-3" onSubmit={submitTask}>
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="text-sm font-semibold">{editingTaskId ? "Edit task" : "Create task"}</h3>
                      <button
                        type="submit"
                        aria-label={editingTaskId ? "Save task" : "Add task"}
                        className="inline-flex items-center gap-1.5 rounded-full bg-slate-950 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-800"
                        disabled={!canEdit}
                      >
                        <Save className="h-3.5 w-3.5" />
                        {editingTaskId ? "Save" : "Add"}
                      </button>
                    </div>
                    <div className="grid gap-2">
                      <input
                        ref={titleInputRef}
                        name="title"
                        value={form.title}
                        onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                        placeholder="Task title"
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-slate-400"
                        disabled={!canEdit}
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <select
                          value={form.module}
                          onChange={(event) => setForm((current) => ({ ...current, module: event.target.value as ModuleName }))}
                          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none"
                          disabled={!canEdit}
                        >
                          {MODULES.map((module) => (
                            <option key={module}>{module}</option>
                          ))}
                        </select>
                        <select
                          value={form.priority}
                          onChange={(event) => setForm((current) => ({ ...current, priority: event.target.value as Priority }))}
                          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none"
                          disabled={!canEdit}
                        >
                          {priorityOptions.map((priority) => (
                            <option key={priority}>{priority}</option>
                          ))}
                        </select>
                      </div>
                      <input
                        type="number"
                        min={15}
                        step={15}
                        value={form.estimatedDurationMinutes}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            estimatedDurationMinutes: Number(event.target.value),
                          }))
                        }
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none"
                        disabled={!canEdit}
                      />
                      <textarea
                        value={form.notes}
                        onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
                        placeholder="Optional notes"
                        className="min-h-16 resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-slate-400"
                        disabled={!canEdit}
                      />
                      <button
                        type="submit"
                        className="flex items-center justify-center gap-2 rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                        disabled={!canEdit}
                      >
                        <Save className="h-4 w-4" />
                        {editingTaskId ? "Save task" : "Add task"}
                      </button>
                    </div>
                  </form>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {MODULES.map((module) => {
                    const tasks = activeTasks.filter((task) => task.module === module);
                    return (
                      <section key={module} className="min-h-32 rounded-2xl border border-white/70 bg-white/46 p-3">
                        <div className="mb-3 flex items-center justify-between">
                          <h3 className="text-sm font-semibold">{module}</h3>
                          <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-slate-500 shadow-sm">
                            {tasks.length}
                          </span>
                        </div>
                        <div className="grid gap-2">
                          {tasks.map((task) => (
                            <TaskCard
                              key={task.id}
                              task={task}
                              disabled={!canEdit}
                              onEdit={canEdit ? () => editTask(task) : undefined}
                              onDelete={canEdit ? () => onDeleteTask(task.id) : undefined}
                              onSchedule={canEdit ? () => onScheduleTask(task.id) : undefined}
                            />
                          ))}
                        </div>
                      </section>
                    );
                  })}
                </div>
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
}: {
  form: typeof defaultForm;
  setForm: Dispatch<SetStateAction<typeof defaultForm>>;
  titleInputRef: RefObject<HTMLInputElement | null>;
  disabled: boolean;
}) {
  return (
    <div className="grid gap-2">
      <input
        ref={titleInputRef}
        name="title"
        value={form.title}
        onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
        placeholder="Task title"
        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-slate-400"
        disabled={disabled}
      />
      <div className="grid grid-cols-2 gap-2">
        <select
          value={form.module}
          onChange={(event) => setForm((current) => ({ ...current, module: event.target.value as ModuleName }))}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none"
          disabled={disabled}
        >
          {MODULES.map((module) => (
            <option key={module}>{module}</option>
          ))}
        </select>
        <select
          value={form.priority}
          onChange={(event) => setForm((current) => ({ ...current, priority: event.target.value as Priority }))}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none"
          disabled={disabled}
        >
          {priorityOptions.map((priority) => (
            <option key={priority}>{priority}</option>
          ))}
        </select>
      </div>
      <input
        type="number"
        min={15}
        step={15}
        value={form.estimatedDurationMinutes}
        onChange={(event) =>
          setForm((current) => ({
            ...current,
            estimatedDurationMinutes: Number(event.target.value),
          }))
        }
        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none"
        disabled={disabled}
      />
      <button
        type="submit"
        className="flex items-center justify-center gap-2 rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
        disabled={disabled}
      >
        <Save className="h-4 w-4" />
        Add task
      </button>
    </div>
  );
}
