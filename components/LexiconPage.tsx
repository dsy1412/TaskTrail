"use client";

import { BookOpenText, Brain, Link2, Plus, Search, Trash2, Volume2 } from "lucide-react";
import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react";
import type { LexiconEntry, PlannerState } from "@/lib/types";

type LexiconInput = {
  word: string;
  ipa: string;
  phonics: string;
  fieldContext: string;
  meaning: string;
  association: string;
  example: string;
  relatedText: string;
};

const emptyInput: LexiconInput = {
  word: "",
  ipa: "",
  phonics: "",
  fieldContext: "",
  meaning: "",
  association: "",
  example: "",
  relatedText: "",
};

export function LexiconPage({
  state,
  onCreateEntry,
  onUpdateEntry,
  onDeleteEntry,
  canEdit,
}: {
  state: PlannerState;
  onCreateEntry: (input: {
    word: string;
    ipa?: string;
    phonics?: string;
    fieldContext?: string;
    meaning?: string;
    association?: string;
    example?: string;
    related?: string[];
  }) => LexiconEntry | undefined;
  onUpdateEntry: (entryId: string, patch: Partial<Omit<LexiconEntry, "id" | "createdAt">>) => void;
  onDeleteEntry: (entryId: string) => void;
  canEdit: boolean;
}) {
  const [draft, setDraft] = useState<LexiconInput>(emptyInput);
  const [query, setQuery] = useState("");
  const [voiceName, setVoiceName] = useState("");
  const { voices, speak, supported } = useSpeech();

  useEffect(() => {
    const preferred = voices.find((voice) => voice.lang.toLowerCase().startsWith("en-us")) ?? voices.find((voice) => voice.lang.toLowerCase().startsWith("en"));
    if (preferred && !voiceName) setVoiceName(preferred.name);
  }, [voiceName, voices]);

  const entries = useMemo(() => {
    const visible = state.lexiconEntries
      .filter((entry) => !entry.deletedAt)
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return visible;
    return visible.filter((entry) =>
      [entry.word, entry.ipa, entry.phonics, entry.fieldContext, entry.meaning, entry.association, entry.example, ...entry.related]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [query, state.lexiconEntries]);

  const totalReviews = entries.reduce((sum, entry) => sum + entry.reviewCount, 0);
  const conceptCount = new Set(entries.flatMap((entry) => [entry.fieldContext, ...entry.related].filter(Boolean))).size;

  function updateDraft(field: keyof LexiconInput, value: string) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft.word.trim() || !canEdit) return;
    onCreateEntry({
      word: draft.word,
      ipa: draft.ipa,
      phonics: draft.phonics,
      fieldContext: draft.fieldContext,
      meaning: draft.meaning,
      association: draft.association,
      example: draft.example,
      related: splitRelated(draft.relatedText),
    });
    setDraft(emptyInput);
  }

  function speakText(text: string, rate: number) {
    speak(text, { rate, voiceName });
  }

  return (
    <section data-testid="lexicon-view" className="grid gap-4 xl:grid-cols-[24rem_minmax(0,1fr)]">
      <form onSubmit={handleSubmit} className="glass-panel rounded-xl p-4">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-400">
              <BookOpenText className="h-4 w-4" />
              Professional words
            </div>
            <h2 className="mt-1 text-2xl font-semibold tracking-normal text-slate-50">Lexicon</h2>
          </div>
          <button
            type="submit"
            aria-label="Add word"
            className="inline-flex items-center gap-2 rounded-lg bg-cyan-300 px-3 py-2 text-sm font-semibold text-slate-950 shadow-sm transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={!canEdit || !draft.word.trim()}
          >
            <Plus className="h-4 w-4" />
            Add
          </button>
        </div>

        <div className="grid gap-3">
          <label className="grid gap-1.5 text-sm font-semibold text-slate-300">
            Word
            <input
              value={draft.word}
              onChange={(event) => updateDraft("word", event.target.value)}
              placeholder="posterior"
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-50 outline-none transition placeholder:text-slate-500 focus:border-cyan-300"
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1.5 text-sm font-semibold text-slate-300">
              IPA / 音标
              <input
                value={draft.ipa}
                onChange={(event) => updateDraft("ipa", event.target.value)}
                placeholder="/pɑːˈstɪriər/"
                className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-50 outline-none transition placeholder:text-slate-500 focus:border-cyan-300"
              />
            </label>
            <label className="grid gap-1.5 text-sm font-semibold text-slate-300">
              Phonics pattern / 拼读规律
              <input
                value={draft.phonics}
                onChange={(event) => updateDraft("phonics", event.target.value)}
                placeholder="post + erior, stress on -te-"
                className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-50 outline-none transition placeholder:text-slate-500 focus:border-cyan-300"
              />
            </label>
          </div>
          <label className="grid gap-1.5 text-sm font-semibold text-slate-300">
            Field context
            <input
              value={draft.fieldContext}
              onChange={(event) => updateDraft("fieldContext", event.target.value)}
              placeholder="ML, vision, database"
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-50 outline-none transition placeholder:text-slate-500 focus:border-cyan-300"
            />
          </label>
          <label className="grid gap-1.5 text-sm font-semibold text-slate-300">
            Chinese meaning
            <textarea
              value={draft.meaning}
              onChange={(event) => updateDraft("meaning", event.target.value)}
              placeholder="用自己的话解释这个词"
              rows={3}
              className="resize-none rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-50 outline-none transition placeholder:text-slate-500 focus:border-cyan-300"
            />
          </label>
          <label className="grid gap-1.5 text-sm font-semibold text-slate-300">
            Association
            <textarea
              value={draft.association}
              onChange={(event) => updateDraft("association", event.target.value)}
              placeholder="词根、相似词、课程画面、论文场景"
              rows={3}
              className="resize-none rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-50 outline-none transition placeholder:text-slate-500 focus:border-cyan-300"
            />
          </label>
          <label className="grid gap-1.5 text-sm font-semibold text-slate-300">
            Example
            <textarea
              value={draft.example}
              onChange={(event) => updateDraft("example", event.target.value)}
              placeholder="The posterior changes after observing data."
              rows={3}
              className="resize-none rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-50 outline-none transition placeholder:text-slate-500 focus:border-cyan-300"
            />
          </label>
          <label className="grid gap-1.5 text-sm font-semibold text-slate-300">
            Related words
            <input
              value={draft.relatedText}
              onChange={(event) => updateDraft("relatedText", event.target.value)}
              placeholder="prior, likelihood, inference"
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-50 outline-none transition placeholder:text-slate-500 focus:border-cyan-300"
            />
          </label>
        </div>
      </form>

      <div className="grid gap-4">
        <div className="glass-panel rounded-xl p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="grid grid-cols-3 gap-2">
              <Summary label="Words" value={`${entries.length}`} />
              <Summary label="Concepts" value={`${conceptCount}`} />
              <Summary label="Reviews" value={`${totalReviews}`} />
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <label className="relative block min-w-0 sm:w-72">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  aria-label="Search lexicon"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search words or concepts"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 py-2 pl-9 pr-3 text-sm font-semibold text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-300"
                />
              </label>
              <select
                aria-label="English voice"
                value={voiceName}
                onChange={(event) => setVoiceName(event.target.value)}
                disabled={!supported || !voices.length}
                className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-semibold text-slate-100 outline-none transition focus:border-cyan-300 disabled:opacity-60"
              >
                {voices.length ? (
                  voices.map((voice) => (
                    <option key={voice.name} value={voice.name}>
                      {voice.name}
                    </option>
                  ))
                ) : (
                  <option value="">System English</option>
                )}
              </select>
            </div>
          </div>
        </div>

        <div className="grid gap-3">
          {entries.length ? (
            entries.map((entry) => (
              <WordCard
                key={entry.id}
                entry={entry}
                canEdit={canEdit}
                onSpeak={speakText}
                onReview={() => onUpdateEntry(entry.id, { reviewCount: entry.reviewCount + 1 })}
                onDelete={() => onDeleteEntry(entry.id)}
              />
            ))
          ) : (
            <div className="glass-panel rounded-xl border-dashed p-8 text-center text-sm font-semibold text-slate-400">
              No words yet.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function WordCard({
  entry,
  canEdit,
  onSpeak,
  onReview,
  onDelete,
}: {
  entry: LexiconEntry;
  canEdit: boolean;
  onSpeak: (text: string, rate: number) => void;
  onReview: () => void;
  onDelete: () => void;
}) {
  return (
    <article data-testid="lexicon-word-card" className="glass-panel rounded-xl p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-2xl font-semibold text-slate-50">{entry.word}</h3>
            {entry.fieldContext ? (
              <span className="rounded-md bg-cyan-300/15 px-2 py-1 text-xs font-bold text-cyan-200">
                {entry.fieldContext}
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-xs font-semibold text-slate-500">Reviewed {entry.reviewCount}</p>
          {entry.ipa || entry.phonics ? (
            <div className="mt-2 flex flex-wrap gap-2 text-sm font-semibold">
              {entry.ipa ? <span className="rounded-md bg-slate-800 px-2 py-1 text-slate-200">{entry.ipa}</span> : null}
              {entry.phonics ? (
                <span className="rounded-md bg-emerald-400/12 px-2 py-1 text-emerald-200">{entry.phonics}</span>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2">
          <SpeakButton label="Speak word" onClick={() => onSpeak(entry.word, 0.95)} />
          <SpeakButton label="Slow word" onClick={() => onSpeak(entry.word, 0.68)} />
          {entry.example ? <SpeakButton label="Speak example" onClick={() => onSpeak(entry.example, 0.82)} /> : null}
          <button
            type="button"
            aria-label={`Mark ${entry.word} reviewed`}
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-bold text-slate-200 transition hover:border-cyan-300 hover:text-cyan-100 disabled:opacity-60"
            onClick={onReview}
            disabled={!canEdit}
          >
            Review
          </button>
          <button
            type="button"
            aria-label={`Delete ${entry.word}`}
            title="Delete"
            className="rounded-lg border border-slate-700 bg-slate-950 p-2 text-slate-400 transition hover:border-rose-400 hover:text-rose-200 disabled:opacity-60"
            onClick={onDelete}
            disabled={!canEdit}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <TextBlock icon={<Brain className="h-4 w-4" />} label="Meaning" value={entry.meaning} />
        <TextBlock icon={<Link2 className="h-4 w-4" />} label="Association" value={entry.association} />
      </div>

      {entry.example ? (
        <div className="mt-3 rounded-lg border border-slate-800 bg-slate-950/70 p-3">
          <p className="text-xs font-bold uppercase text-slate-500">Example</p>
          <p className="mt-1 text-sm font-semibold leading-6 text-slate-200">{entry.example}</p>
        </div>
      ) : null}

      {entry.related.length ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {entry.related.map((item) => (
            <span key={item} className="rounded-md bg-slate-800 px-2 py-1 text-xs font-bold text-slate-300">
              {item}
            </span>
          ))}
        </div>
      ) : null}
    </article>
  );
}

function TextBlock({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
      <p className="flex items-center gap-2 text-xs font-bold uppercase text-slate-500">
        {icon}
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold leading-6 text-slate-200">{value || "Not set"}</p>
    </div>
  );
}

function SpeakButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-300 px-3 py-2 text-xs font-bold text-slate-950 shadow-sm transition hover:bg-cyan-200"
      onClick={onClick}
    >
      <Volume2 className="h-4 w-4" />
      {label.replace("Speak ", "").replace("Slow ", "Slow ")}
    </button>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2">
      <p className="text-lg font-semibold text-slate-50">{value}</p>
      <p className="text-[0.65rem] font-bold uppercase text-slate-500">{label}</p>
    </div>
  );
}

function splitRelated(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function useSpeech() {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const supported = typeof window !== "undefined" && "speechSynthesis" in window;

  useEffect(() => {
    if (!supported) return;

    function refreshVoices() {
      setVoices(window.speechSynthesis.getVoices().filter((voice) => voice.lang.toLowerCase().startsWith("en")));
    }

    refreshVoices();
    window.speechSynthesis.addEventListener("voiceschanged", refreshVoices);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", refreshVoices);
  }, [supported]);

  function speak(text: string, options: { rate: number; voiceName?: string }) {
    if (!supported || !text.trim()) return;
    const utterance = new SpeechSynthesisUtterance(text.trim());
    utterance.lang = "en-US";
    utterance.rate = options.rate;
    utterance.pitch = 1;
    const selectedVoice = voices.find((voice) => voice.name === options.voiceName) ?? voices[0];
    if (selectedVoice) utterance.voice = selectedVoice;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }

  return { voices, speak, supported };
}
