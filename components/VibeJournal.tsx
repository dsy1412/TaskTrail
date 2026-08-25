"use client";

import { Activity, Eye, HeartPulse, Music2, Save, Tags, Trash2 } from "lucide-react";
import { FormEvent, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import type { JournalEntry, PlannerState } from "@/lib/types";

const defaultForm = {
  song: "",
  sight: "",
  feeling: "",
  note: "",
  pulse: 3,
  tags: "",
};

const pulseWords = ["still", "soft", "alive", "bright", "electric"];

export function VibeJournal({
  state,
  date,
  onCreateEntry,
  onDeleteEntry,
  canEdit,
}: {
  state: PlannerState;
  date: string;
  onCreateEntry: (input: {
    date: string;
    song?: string;
    sight?: string;
    feeling?: string;
    note?: string;
    pulse?: number;
    tags?: string[];
  }) => JournalEntry;
  onDeleteEntry: (entryId: string) => void;
  canEdit: boolean;
}) {
  const [form, setForm] = useState(defaultForm);
  const noteRef = useRef<HTMLTextAreaElement | null>(null);

  const entries = useMemo(
    () =>
      state.journalEntries
        .filter((entry) => !entry.deletedAt && entry.date === date)
        .sort((left, right) => right.createdAt.localeCompare(left.createdAt)),
    [date, state.journalEntries],
  );

  const signal = useMemo(() => buildDailySignal(entries), [entries]);

  function submitEntry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canEdit) return;

    const tags = form.tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
    const hasEntry = [form.song, form.sight, form.feeling, form.note, ...tags].some((value) => value.trim());
    if (!hasEntry) {
      noteRef.current?.focus();
      return;
    }

    onCreateEntry({
      date,
      song: form.song,
      sight: form.sight,
      feeling: form.feeling,
      note: form.note,
      pulse: form.pulse,
      tags,
    });
    setForm(defaultForm);
    noteRef.current?.focus();
  }

  return (
    <aside data-testid="vibe-journal" className="glass-panel overflow-hidden rounded-[1.6rem] sm:rounded-[2rem]">
      <div className="border-b border-slate-800 p-4 sm:p-5">
        <div className="mb-2 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-300">
            <HeartPulse className="h-4 w-4 text-rose-300" />
            Vibe Journal
          </div>
          <div className="rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1 text-xs font-semibold text-slate-400">
            {entries.length} today
          </div>
        </div>
        <div className="grid gap-2 rounded-lg border border-slate-800 bg-slate-950/55 p-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
            <Activity className="h-3.5 w-3.5 text-amber-300" />
            Daily signal
          </div>
          <p className="line-clamp-2 min-h-10 text-sm font-semibold leading-5 text-slate-100">{signal}</p>
        </div>
      </div>

      <div className="grid gap-3 p-4 sm:p-5">
        <form className="grid gap-2 rounded-lg border border-slate-800 bg-slate-950/55 p-3" onSubmit={submitEntry}>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
            <JournalField
              icon={<Music2 className="h-3.5 w-3.5 text-cyan-300" />}
              label="Song"
              value={form.song}
              placeholder="Song / artist"
              onChange={(song) => setForm((current) => ({ ...current, song }))}
              disabled={!canEdit}
            />
            <JournalField
              icon={<Eye className="h-3.5 w-3.5 text-emerald-300" />}
              label="Sight"
              value={form.sight}
              placeholder="What you saw"
              onChange={(sight) => setForm((current) => ({ ...current, sight }))}
              disabled={!canEdit}
            />
          </div>

          <label className="grid gap-1.5 text-xs font-semibold text-slate-400">
            Felt
            <input
              value={form.feeling}
              onChange={(event) => setForm((current) => ({ ...current, feeling: event.target.value }))}
              placeholder="A quiet ache, a tiny light"
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-normal text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-rose-300"
              disabled={!canEdit}
            />
          </label>

          <label className="grid gap-1.5 text-xs font-semibold text-slate-400">
            Heart-skip line
            <textarea
              ref={noteRef}
              value={form.note}
              onChange={(event) => setForm((current) => ({ ...current, note: event.target.value }))}
              placeholder="The sentence that catches the moment"
              aria-label="Journal note"
              rows={4}
              className="min-h-24 resize-none rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-normal leading-5 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-rose-300"
              disabled={!canEdit}
            />
          </label>

          <div className="grid gap-2 rounded-lg border border-slate-800 bg-slate-950/80 p-3">
            <div className="flex items-center justify-between gap-3">
              <label htmlFor="journal-pulse" className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
                <HeartPulse className="h-3.5 w-3.5 text-rose-300" />
                Pulse
              </label>
              <span className="rounded-md bg-slate-800 px-2 py-1 text-xs font-semibold text-slate-300">
                {pulseWords[form.pulse - 1]} / {form.pulse}
              </span>
            </div>
            <input
              id="journal-pulse"
              type="range"
              min={1}
              max={5}
              value={form.pulse}
              onChange={(event) => setForm((current) => ({ ...current, pulse: Number(event.target.value) }))}
              className="h-2 w-full accent-rose-300"
              disabled={!canEdit}
            />
          </div>

          <label className="grid gap-1.5 text-xs font-semibold text-slate-400">
            <span className="flex items-center gap-1.5">
              <Tags className="h-3.5 w-3.5 text-amber-300" />
              Tags
            </span>
            <input
              value={form.tags}
              onChange={(event) => setForm((current) => ({ ...current, tags: event.target.value }))}
              placeholder="rain, campus, courage"
              aria-label="Journal tags"
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-normal text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-amber-300"
              disabled={!canEdit}
            />
          </label>

          <button
            type="submit"
            aria-label="Save journal entry"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-rose-300 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-rose-200"
            disabled={!canEdit}
          >
            <Save className="h-4 w-4" />
            Save moment
          </button>
        </form>

        <div className="fine-scrollbar grid max-h-[28rem] gap-2 overflow-y-auto pr-1">
          {entries.map((entry) => (
            <JournalEntryCard key={entry.id} entry={entry} onDeleteEntry={onDeleteEntry} canEdit={canEdit} />
          ))}
          {!entries.length ? (
            <div className="rounded-lg border border-dashed border-slate-700 bg-slate-950/40 p-5 text-center text-sm font-semibold text-slate-400">
              No moments on this date.
            </div>
          ) : null}
        </div>
      </div>
    </aside>
  );
}

function JournalField({
  icon,
  label,
  value,
  placeholder,
  onChange,
  disabled,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
  disabled: boolean;
}) {
  return (
    <label className="grid gap-1.5 text-xs font-semibold text-slate-400">
      <span className="flex items-center gap-1.5">
        {icon}
        {label}
      </span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-normal text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-300"
        disabled={disabled}
      />
    </label>
  );
}

function JournalEntryCard({
  entry,
  onDeleteEntry,
  canEdit,
}: {
  entry: JournalEntry;
  onDeleteEntry: (entryId: string) => void;
  canEdit: boolean;
}) {
  return (
    <article className="rounded-lg border border-slate-800 bg-slate-900 p-3 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5 text-[0.68rem] font-bold uppercase text-slate-500">
            <span>{new Date(entry.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
            <span className="rounded-md bg-rose-300/15 px-1.5 py-0.5 text-rose-200">
              {pulseWords[entry.pulse - 1] ?? "alive"}
            </span>
          </div>
          <p className="mt-2 text-sm font-semibold leading-5 text-slate-50">{entry.note || entry.feeling || "Untitled moment"}</p>
        </div>
        {canEdit ? (
          <button
            type="button"
            aria-label="Delete journal entry"
            title="Delete"
            className="rounded-md border border-slate-700 bg-slate-950 p-2 text-slate-300 shadow-sm transition hover:text-rose-300"
            onClick={() => onDeleteEntry(entry.id)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>

      <div className="mt-3 grid gap-1.5 text-xs font-medium leading-5 text-slate-400">
        {entry.song ? <p className="line-clamp-1">Song: {entry.song}</p> : null}
        {entry.sight ? <p className="line-clamp-1">Sight: {entry.sight}</p> : null}
        {entry.feeling ? <p className="line-clamp-1">Felt: {entry.feeling}</p> : null}
      </div>

      {entry.tags.length ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {entry.tags.map((tag) => (
            <span key={tag} className="rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-[0.68rem] font-semibold text-slate-400">
              {tag}
            </span>
          ))}
        </div>
      ) : null}
    </article>
  );
}

function buildDailySignal(entries: JournalEntry[]) {
  if (!entries.length) return "song -> sight -> feeling -> one slower heartbeat";

  const newest = entries[0];
  const parts = [newest.song, newest.sight, newest.feeling].filter(Boolean);
  if (parts.length) return parts.join(" -> ");
  if (newest.note) return newest.note;
  return `${pulseWords[newest.pulse - 1] ?? "alive"} pulse`;
}
