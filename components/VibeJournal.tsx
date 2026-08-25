"use client";

import { ChevronDown, ChevronUp, Eye, HeartPulse, Music2, Save, SlidersHorizontal, Tags, Trash2, Type, Wand2 } from "lucide-react";
import { FormEvent, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import type { JournalEntry, JournalFontStyle, PlannerState } from "@/lib/types";

const defaultForm = {
  draft: "",
  song: "",
  sight: "",
  feeling: "",
  pulse: 3,
  tags: "",
  fontStyle: "clean" as JournalFontStyle,
};

const pulseWords = ["still", "soft", "alive", "bright", "electric"];

const fontOptions: Array<{ value: JournalFontStyle; label: string; className: string }> = [
  { value: "clean", label: "Clean", className: "font-sans" },
  { value: "serif", label: "Serif", className: "font-serif" },
  { value: "mono", label: "Mono", className: "font-mono" },
];

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
    fontStyle?: JournalFontStyle;
  }) => JournalEntry;
  onDeleteEntry: (entryId: string) => void;
  canEdit: boolean;
}) {
  const [form, setForm] = useState(defaultForm);
  const [showDetails, setShowDetails] = useState(false);
  const noteRef = useRef<HTMLTextAreaElement | null>(null);

  const entries = useMemo(
    () =>
      state.journalEntries
        .filter((entry) => !entry.deletedAt && entry.date === date)
        .sort((left, right) => right.createdAt.localeCompare(left.createdAt)),
    [date, state.journalEntries],
  );

  const signal = useMemo(() => buildDailySignal(entries), [entries]);
  const selectedFont = fontOptions.find((option) => option.value === form.fontStyle) ?? fontOptions[0];

  function submitEntry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canEdit) return;

    const tags = parseTags(form.tags);
    const note = normalizeNote(form.draft);
    const hasEntry = [form.song, form.sight, form.feeling, note, ...tags].some((value) => value.trim());
    if (!hasEntry) {
      noteRef.current?.focus();
      return;
    }

    onCreateEntry({
      date,
      song: cleanLine(form.song),
      sight: cleanLine(form.sight),
      feeling: cleanLine(form.feeling),
      note,
      pulse: form.pulse,
      tags,
      fontStyle: form.fontStyle,
    });
    setForm(defaultForm);
    setShowDetails(false);
    noteRef.current?.focus();
  }

  function autoFormat() {
    setForm((current) => {
      const formatted = formatDraft(current.draft);
      return {
        ...current,
        draft: formatted.note || normalizeNote(current.draft),
        song: formatted.song || current.song,
        sight: formatted.sight || current.sight,
        feeling: formatted.feeling || current.feeling,
        tags: formatted.tags || current.tags,
      };
    });
    setShowDetails(true);
  }

  return (
    <aside data-testid="vibe-journal" className="glass-panel overflow-hidden rounded-xl">
      <div className="border-b border-slate-800 p-3 sm:p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
              <HeartPulse className="h-4 w-4 text-rose-300" />
              Vibe Journal
            </div>
            <p className="mt-1 line-clamp-1 text-xs font-semibold text-slate-500">{signal}</p>
          </div>
          <div className="rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1 text-xs font-semibold text-slate-400">
            {entries.length} today
          </div>
        </div>
      </div>

      <div className="grid gap-3 p-3 sm:p-4">
        <form className="grid gap-3 rounded-lg border border-slate-800 bg-slate-950/45 p-3" onSubmit={submitEntry}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="inline-grid grid-cols-3 gap-1 rounded-lg border border-slate-800 bg-slate-950 p-1 text-[0.68rem] font-bold">
              {fontOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  aria-label={`Use ${option.label} journal font`}
                  className={`rounded-md px-2 py-1 transition ${
                    form.fontStyle === option.value ? "bg-rose-300 text-slate-950" : "text-slate-400 hover:text-slate-100"
                  }`}
                  onClick={() => setForm((current) => ({ ...current, fontStyle: option.value }))}
                  disabled={!canEdit}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:border-rose-300 hover:text-rose-200"
                onClick={autoFormat}
                disabled={!canEdit}
              >
                <Wand2 className="h-3.5 w-3.5" />
                Auto format
              </button>
              <button
                type="button"
                aria-label={showDetails ? "Hide journal details" : "Show journal details"}
                className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:text-slate-50"
                onClick={() => setShowDetails((value) => !value)}
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                Details
                {showDetails ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>

          <label className="grid gap-1.5 text-xs font-semibold text-slate-400">
            <span className="flex items-center gap-1.5">
              <Type className="h-3.5 w-3.5 text-rose-300" />
              Moment
            </span>
            <textarea
              ref={noteRef}
              value={form.draft}
              onChange={(event) => setForm((current) => ({ ...current, draft: event.target.value }))}
              placeholder="Write freely, or try: song -> sight -> feeling -> one line"
              aria-label="Journal note"
              rows={4}
              className={`min-h-28 resize-none rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm leading-6 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-rose-300 ${selectedFont.className}`}
              disabled={!canEdit}
            />
          </label>

          {showDetails ? (
            <div className="grid gap-2 rounded-lg border border-slate-800 bg-slate-950/70 p-3">
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
            </div>
          ) : null}

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

        <div className="fine-scrollbar grid max-h-[22rem] gap-2 overflow-y-auto pr-1">
          {entries.map((entry) => (
            <JournalEntryCard key={entry.id} entry={entry} onDeleteEntry={onDeleteEntry} canEdit={canEdit} />
          ))}
          {!entries.length ? (
            <div className="rounded-lg border border-dashed border-slate-700 bg-slate-950/40 p-4 text-center text-sm font-semibold text-slate-400">
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
  const entryFont = fontOptions.find((option) => option.value === (entry.fontStyle ?? "clean")) ?? fontOptions[0];

  return (
    <article className="rounded-lg border border-slate-800 bg-slate-900 p-3 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5 text-[0.68rem] font-bold uppercase text-slate-500">
            <span>{new Date(entry.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
            <span className="rounded-md bg-rose-300/15 px-1.5 py-0.5 text-rose-200">
              {pulseWords[entry.pulse - 1] ?? "alive"}
            </span>
            <span className="rounded-md bg-slate-800 px-1.5 py-0.5 text-slate-400">{entryFont.label}</span>
          </div>
          <p className={`mt-2 whitespace-pre-line text-sm font-semibold leading-6 text-slate-50 ${entryFont.className}`}>
            {entry.note || entry.feeling || "Untitled moment"}
          </p>
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
  if (!entries.length) return "one line, one signal";

  const newest = entries[0];
  const parts = [newest.song, newest.sight, newest.feeling].filter(Boolean);
  if (parts.length) return parts.join(" -> ");
  if (newest.note) return newest.note;
  return `${pulseWords[newest.pulse - 1] ?? "alive"} pulse`;
}

function formatDraft(draft: string) {
  const text = normalizeArrows(draft);
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const output = { song: "", sight: "", feeling: "", note: "", tags: "" };

  lines.forEach((line) => {
    const match = line.match(/^(song|music|sight|seen|feeling|felt|note|line|tags?)\s*[:=-]\s*(.+)$/i);
    if (!match) return;
    const key = match[1].toLowerCase();
    const value = cleanLine(match[2]);
    if (key === "song" || key === "music") output.song = value;
    if (key === "sight" || key === "seen") output.sight = value;
    if (key === "feeling" || key === "felt") output.feeling = value;
    if (key === "note" || key === "line") output.note = value;
    if (key.startsWith("tag")) output.tags = value;
  });

  if (!output.note) {
    const arrowParts = text.split("->").map(cleanLine).filter(Boolean);
    if (arrowParts.length >= 3) {
      output.song ||= arrowParts[0];
      output.sight ||= arrowParts[1];
      output.feeling ||= arrowParts[2];
      output.note = arrowParts.slice(3).join("\n") || arrowParts[2];
    } else {
      output.note = normalizeNote(text);
    }
  }

  return output;
}

function normalizeNote(value: string) {
  const text = normalizeArrows(value)
    .split(/\r?\n/)
    .map((line) => cleanLine(line))
    .filter(Boolean)
    .join("\n");

  return text
    .split("\n")
    .map((line) => {
      if (!line) return line;
      const capitalized = line.charAt(0).toUpperCase() + line.slice(1);
      return /[.!?]$/.test(capitalized) ? capitalized : `${capitalized}.`;
    })
    .join("\n");
}

function normalizeArrows(value: string) {
  return value.replace(/[→⇒]/g, "->").replace(/\s*->\s*/g, " -> ");
}

function cleanLine(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function parseTags(value: string) {
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}
