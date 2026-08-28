"use client";

import { BookOpenText, Plus, Trash2, Volume2 } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import type { LexiconEntry, PlannerState } from "@/lib/types";

type LexiconInput = {
  word: string;
};

const emptyInput: LexiconInput = {
  word: "",
};

const localIpa: Record<string, string> = {
  acoustic: "/əˈkuːstɪk/",
  algorithm: "/ˈælɡərɪðəm/",
  analysis: "/əˈnæləsɪs/",
  analytics: "/ˌænəˈlɪtɪks/",
  artificial: "/ˌɑːrtɪˈfɪʃəl/",
  attention: "/əˈtɛnʃən/",
  cache: "/kæʃ/",
  classification: "/ˌklæsɪfɪˈkeɪʃən/",
  convolution: "/ˌkɑːnvəˈluːʃən/",
  covariance: "/koʊˈvɛriəns/",
  data: "/ˈdeɪtə/",
  database: "/ˈdeɪtəbeɪs/",
  diffusion: "/dɪˈfjuːʒən/",
  distribution: "/ˌdɪstrɪˈbjuːʃən/",
  embedding: "/ɪmˈbɛdɪŋ/",
  estimation: "/ˌɛstɪˈmeɪʃən/",
  foundation: "/faʊnˈdeɪʃən/",
  generative: "/ˈdʒɛnərətɪv/",
  gradient: "/ˈɡreɪdiənt/",
  homography: "/hoʊˈmɑːɡrəfi/",
  inference: "/ˈɪnfərəns/",
  intelligence: "/ɪnˈtɛlɪdʒəns/",
  language: "/ˈlæŋɡwɪdʒ/",
  latent: "/ˈleɪtənt/",
  likelihood: "/ˈlaɪklihʊd/",
  matrix: "/ˈmeɪtrɪks/",
  model: "/ˈmɑːdəl/",
  morphing: "/ˈmɔːrfɪŋ/",
  multimodal: "/ˌmʌltiˈmoʊdəl/",
  network: "/ˈnɛtwɜːrk/",
  neural: "/ˈnʊrəl/",
  perception: "/pərˈsɛpʃən/",
  physical: "/ˈfɪzɪkəl/",
  poisson: "/ˈpwɑːsɑːn/",
  posterior: "/pɑːˈstɪriər/",
  prior: "/ˈpraɪər/",
  probability: "/ˌprɑːbəˈbɪləti/",
  query: "/ˈkwɪri/",
  regression: "/rɪˈɡrɛʃən/",
  sampling: "/ˈsæmplɪŋ/",
  transformer: "/trænsˈfɔːrmər/",
  variable: "/ˈvɛriəbəl/",
  vector: "/ˈvɛktər/",
  vision: "/ˈvɪʒən/",
};

export function LexiconPage({
  state,
  onCreateEntry,
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
  onDeleteEntry: (entryId: string) => void;
  canEdit: boolean;
}) {
  const [draft, setDraft] = useState<LexiconInput>(emptyInput);
  const [voiceName, setVoiceName] = useState("");
  const [isLookingUp, setIsLookingUp] = useState(false);
  const { voices, speak, supported } = useSpeech();

  useEffect(() => {
    const preferred = voices.find((voice) => voice.lang.toLowerCase().startsWith("en-us")) ?? voices.find((voice) => voice.lang.toLowerCase().startsWith("en"));
    if (preferred && !voiceName) setVoiceName(preferred.name);
  }, [voiceName, voices]);

  const entries = useMemo(() => {
    return state.lexiconEntries
      .filter((entry) => !entry.deletedAt)
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
  }, [state.lexiconEntries]);

  function updateDraft(field: keyof LexiconInput, value: string) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft.word.trim() || !canEdit) return;
    const word = draft.word.trim();
    setIsLookingUp(true);
    speakText(word, 0.9);
    const ipa = await lookupIpa(word);
    onCreateEntry({ word, ipa });
    setDraft(emptyInput);
    setIsLookingUp(false);
  }

  function speakText(text: string, rate: number) {
    speak(text, { rate, voiceName });
  }

  return (
    <section data-testid="lexicon-view" className="mx-auto grid w-full max-w-4xl gap-4">
      <form onSubmit={handleSubmit} className="glass-panel rounded-xl p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-400">
              <BookOpenText className="h-4 w-4" />
              Professional words
            </div>
            <h2 className="mt-1 text-2xl font-semibold tracking-normal text-slate-50">Lexicon</h2>
          </div>
          <div className="flex flex-1 flex-col gap-2 sm:flex-row lg:max-w-2xl">
            <input
              aria-label="Word"
              value={draft.word}
              onChange={(event) => updateDraft("word", event.target.value)}
              placeholder="posterior"
              className="min-h-12 flex-1 rounded-lg border border-slate-700 bg-slate-950 px-4 text-lg font-semibold text-slate-50 outline-none transition placeholder:text-slate-500 focus:border-cyan-300"
            />
            <button
              type="submit"
              aria-label="Add word"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-cyan-300 px-5 text-sm font-semibold text-slate-950 shadow-sm transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={!canEdit || !draft.word.trim() || isLookingUp}
            >
              <Plus className="h-4 w-4" />
              {isLookingUp ? "Adding" : "Add"}
            </button>
          </div>
        </div>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <select
            aria-label="English voice"
            value={voiceName}
            onChange={(event) => setVoiceName(event.target.value)}
            disabled={!supported || !voices.length}
            className="min-w-0 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-semibold text-slate-100 outline-none transition focus:border-cyan-300 disabled:opacity-60 sm:max-w-md"
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
          <span className="text-sm font-semibold text-slate-400">{entries.length} words</span>
        </div>
      </form>

      <div className="grid gap-3">
        {entries.length ? (
          entries.map((entry) => (
            <WordCard
              key={entry.id}
              entry={entry}
              canEdit={canEdit}
              onSpeak={speakText}
              onDelete={() => onDeleteEntry(entry.id)}
            />
          ))
        ) : (
          <div className="glass-panel rounded-xl border-dashed p-8 text-center text-sm font-semibold text-slate-400">
            No words yet.
          </div>
        )}
      </div>
    </section>
  );
}

function WordCard({
  entry,
  canEdit,
  onSpeak,
  onDelete,
}: {
  entry: LexiconEntry;
  canEdit: boolean;
  onSpeak: (text: string, rate: number) => void;
  onDelete: () => void;
}) {
  return (
    <article data-testid="lexicon-word-card" className="glass-panel rounded-xl p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-2xl font-semibold text-slate-50">{entry.word}</h3>
            {entry.ipa ? <span className="rounded-md bg-slate-800 px-2 py-1 text-sm font-semibold text-slate-200">{entry.ipa}</span> : null}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <SpeakButton label="Speak word" onClick={() => onSpeak(entry.word, 0.95)} />
          <SpeakButton label="Slow word" onClick={() => onSpeak(entry.word, 0.68)} />
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

    </article>
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

async function lookupIpa(word: string) {
  const normalized = word.trim().toLowerCase();
  if (!normalized) return "";
  const local = localIpa[normalized];
  if (local) return local;

  try {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 1200);
    const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(normalized)}`, {
      signal: controller.signal,
    });
    window.clearTimeout(timer);
    if (!response.ok) return "";
    const entries = (await response.json()) as DictionaryEntry[];
    return entries
      .flatMap((entry) => [entry.phonetic, ...(entry.phonetics ?? []).map((phonetic) => phonetic.text)])
      .find((text): text is string => Boolean(text?.trim())) ?? "";
  } catch {
    return "";
  }
}

type DictionaryEntry = {
  phonetic?: string;
  phonetics?: Array<{ text?: string }>;
};
