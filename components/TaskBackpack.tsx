"use client";

import { ChevronDown, ChevronUp, Plus, Save } from "lucide-react";
import { FormEvent, useMemo, useRef, useState } from "react";
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

export function TaskBackpack({
  state,
  onCreateTask,
  onUpdateTask,
  onDeleteTask,
  onScheduleTask,
  canEdit,
}: {
  state: PlannerState;
  onCreateTask: (input: typeof defaultForm) => Task;
  onUpdateTask: (taskId: string, patch: Partial<Omit<Task, "id" | "createdAt">>) => void;
  onDeleteTask: (taskId: string) => void;
  onScheduleTask: (taskId: string) => void;
  canEdit: boolean;
}) {
  const [open, setOpen] = useState(true);
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
    window.setTimeout(() => titleInputRef.current?.focus(), 0);
  }

  function editTask(task: Task) {
    if (!canEdit) return;
    setOpen(true);
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
    setEditingTaskId(null);
    setForm({
      title: task.title,
      module: task.module,
      priority: task.priority,
      estimatedDurationMinutes: task.estimatedDurationMinutes,
      notes: task.notes,
    });
  }

  return (
    <aside
      data-testid="task-backpack"
      className="fixed inset-x-2 bottom-2 z-40 mx-auto max-w-7xl sm:inset-x-3 sm:bottom-3"
    >
      <div className="glass-panel overflow-hidden rounded-[1.5rem] sm:rounded-[2rem]">
        <div className="flex items-center justify-between gap-3 border-b border-white/70 px-3 py-3 sm:px-4">
          <div>
            <h2 className="text-base font-semibold">Task Backpack</h2>
            <p className="text-xs font-medium text-slate-500">Drag cards into the canvas. Backpack tasks stay here.</p>
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
              <div className="fine-scrollbar grid max-h-[58vh] gap-3 overflow-y-auto p-3 sm:max-h-[21rem] sm:gap-4 sm:p-4 lg:grid-cols-[22rem_minmax(0,1fr)]">
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
