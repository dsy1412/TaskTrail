"use client";

import { BookOpenText, Plus, RotateCcw, Trash2, Volume2 } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { getLocalLexiconEnrichment } from "@/lib/lexiconEnrichment";
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
  albedo: "/ælˈbiːdoʊ/",
  brdf: "/ˌbiː ɑːr diː ˈɛf/",
  cache: "/kæʃ/",
  classification: "/ˌklæsɪfɪˈkeɪʃən/",
  convolution: "/ˌkɑːnvəˈluːʃən/",
  covariance: "/koʊˈvɛriəns/",
  data: "/ˈdeɪtə/",
  database: "/ˈdeɪtəbeɪs/",
  diffusion: "/dɪˈfjuːʒən/",
  diffuse: "/dɪˈfjuːs/",
  distribution: "/ˌdɪstrɪˈbjuːʃən/",
  embedding: "/ɪmˈbɛdɪŋ/",
  estimation: "/ˌɛstɪˈmeɪʃən/",
  foundation: "/faʊnˈdeɪʃən/",
  framing: "/ˈfreɪmɪŋ/",
  generative: "/ˈdʒɛnərətɪv/",
  gradient: "/ˈɡreɪdiənt/",
  homography: "/hoʊˈmɑːɡrəfi/",
  "homogeneous coordinates": "/ˌhoʊməˈdʒiːniəs koʊˈɔːrdənəts/",
  illumination: "/ɪˌluːmɪˈneɪʃən/",
  inference: "/ˈɪnfərəns/",
  intelligence: "/ɪnˈtɛlɪdʒəns/",
  irradiance: "/ɪˈreɪdiəns/",
  language: "/ˈlæŋɡwɪdʒ/",
  lambertian: "/læmˈbɜːrtiən/",
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
  projection: "/prəˈdʒɛkʃən/",
  query: "/ˈkwɪri/",
  radiance: "/ˈreɪdiəns/",
  reflectance: "/rɪˈflɛktəns/",
  regression: "/rɪˈɡrɛʃən/",
  sampling: "/ˈsæmplɪŋ/",
  shading: "/ˈʃeɪdɪŋ/",
  specular: "/ˈspɛkjələr/",
  "surface normal": "/ˈsɜːrfɪs ˈnɔːrməl/",
  transformer: "/trænsˈfɔːrmər/",
  variable: "/ˈvɛriəbəl/",
  vector: "/ˈvɛktər/",
  vision: "/ˈvɪʒən/",
};

export function LexiconPage({
  state,
  onCreateEntry,
  onDeleteEntry,
  onRestoreEntry,
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
    exampleTranslation?: string;
    related?: string[];
  }) => LexiconEntry | undefined;
  onDeleteEntry: (entryId: string) => void;
  onRestoreEntry: (entryId: string) => void;
  canEdit: boolean;
}) {
  const [draft, setDraft] = useState<LexiconInput>(emptyInput);
  const [voiceName, setVoiceName] = useState("");
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [showTrash, setShowTrash] = useState(false);
  const { voices, speak, supported } = useSpeech();

  useEffect(() => {
    const preferred = voices.find((voice) => voice.lang.toLowerCase().startsWith("en-us")) ?? voices.find((voice) => voice.lang.toLowerCase().startsWith("en"));
    if (preferred && !voiceName) setVoiceName(preferred.name);
  }, [voiceName, voices]);

  const activeEntries = useMemo(() => {
    return state.lexiconEntries
      .filter((entry) => !entry.deletedAt)
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
  }, [state.lexiconEntries]);

  const deletedEntries = useMemo(() => {
    return state.lexiconEntries
      .filter((entry) => entry.deletedAt)
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
  }, [state.lexiconEntries]);

  const visibleEntries = showTrash ? deletedEntries : activeEntries;

  function updateDraft(field: keyof LexiconInput, value: string) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft.word.trim() || !canEdit) return;
    const text = draft.word.trim();
    setIsLookingUp(true);
    speakText(text, 0.9);
    const entryInput = await buildEntryInput(text);
    onCreateEntry(entryInput);
    setDraft(emptyInput);
    setIsLookingUp(false);
  }

  function speakText(text: string, rate: number) {
    speak(text, { rate, voiceName });
  }

  return (
    <section data-testid="lexicon-view" className="mx-auto grid w-full max-w-7xl gap-3">
      <form onSubmit={handleSubmit} className="glass-panel rounded-xl p-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-400">
              <BookOpenText className="h-4 w-4" />
              Professional words
            </div>
            <h2 className="mt-1 text-xl font-semibold tracking-normal text-slate-50">Lexicon</h2>
          </div>
          <div className="flex flex-1 flex-col gap-2 sm:flex-row lg:max-w-2xl">
            <input
              aria-label="Word or sentence"
              value={draft.word}
              onChange={(event) => updateDraft("word", event.target.value)}
              placeholder="word or sentence"
              className="min-h-10 flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 text-base font-semibold text-slate-50 outline-none transition placeholder:text-slate-500 focus:border-cyan-300"
            />
            <button
              type="submit"
              aria-label="Add word"
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-cyan-300 px-4 text-sm font-semibold text-slate-950 shadow-sm transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-60"
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
            className="min-w-0 rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-sm font-semibold text-slate-100 outline-none transition focus:border-cyan-300 disabled:opacity-60 sm:max-w-md"
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
          <div className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-950 p-1">
            <button
              type="button"
              aria-label="Active words"
              className={`rounded-md px-3 py-1.5 text-xs font-bold transition ${
                !showTrash ? "bg-slate-100 text-slate-950" : "text-slate-400 hover:text-slate-100"
              }`}
              onClick={() => setShowTrash(false)}
            >
              Active {activeEntries.length}
            </button>
            <button
              type="button"
              aria-label="Trash words"
              className={`rounded-md px-3 py-1.5 text-xs font-bold transition ${
                showTrash ? "bg-slate-100 text-slate-950" : "text-slate-400 hover:text-slate-100"
              }`}
              onClick={() => setShowTrash(true)}
            >
              Trash {deletedEntries.length}
            </button>
          </div>
        </div>
      </form>

      <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
        {visibleEntries.length ? (
          visibleEntries.map((entry) => (
            <WordCard
              key={entry.id}
              entry={entry}
              mode={showTrash ? "trash" : "active"}
              canEdit={canEdit}
              onSpeak={speakText}
              onDelete={() => onDeleteEntry(entry.id)}
              onRestore={() => onRestoreEntry(entry.id)}
            />
          ))
        ) : (
          <div className="glass-panel rounded-xl border-dashed p-8 text-center text-sm font-semibold text-slate-400">
            {showTrash ? "Trash is empty." : "No words yet."}
          </div>
        )}
      </div>
    </section>
  );
}

function WordCard({
  entry,
  mode,
  canEdit,
  onSpeak,
  onDelete,
  onRestore,
}: {
  entry: LexiconEntry;
  mode: "active" | "trash";
  canEdit: boolean;
  onSpeak: (text: string, rate: number) => void;
  onDelete: () => void;
  onRestore: () => void;
}) {
  return (
    <article data-testid="lexicon-word-card" className="glass-panel rounded-xl p-3">
      <div className="flex flex-col gap-2">
        <div className="min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="break-words text-lg font-semibold leading-tight text-slate-50">{entry.word}</h3>
              {entry.ipa ? <p className="mt-1 text-xs font-semibold text-slate-300">{entry.ipa}</p> : null}
            </div>
            <div className="flex shrink-0 gap-1.5">
              <SpeakButton label="Speak word" onClick={() => onSpeak(entry.word, 0.95)} />
              {mode === "trash" ? (
                <button
                  type="button"
                  aria-label={`Restore ${entry.word}`}
                  title="Restore"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-emerald-400/60 bg-slate-950 text-emerald-200 transition hover:border-emerald-300 hover:text-emerald-100 disabled:opacity-60"
                  onClick={onRestore}
                  disabled={!canEdit}
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
              ) : (
                <button
                  type="button"
                  aria-label={`Move ${entry.word} to trash`}
                  title="Move to trash"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700 bg-slate-950 text-slate-400 transition hover:border-rose-400 hover:text-rose-200 disabled:opacity-60"
                  onClick={onDelete}
                  disabled={!canEdit}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
          <WordNotes entry={entry} />
        </div>
      </div>

    </article>
  );
}

function WordNotes({ entry }: { entry: LexiconEntry }) {
  const notes = [
    entry.meaning ? { label: "Meaning", text: entry.meaning } : null,
    entry.phonics ? { label: "Read", text: entry.phonics } : null,
    entry.example ? { label: "Example", text: entry.example } : null,
    entry.exampleTranslation ? { label: "Translate", text: entry.exampleTranslation } : null,
  ].filter((note): note is { label: string; text: string } => Boolean(note));

  if (!notes.length) return null;

  return (
    <div className="mt-2 grid gap-1.5 text-xs leading-snug">
      {notes.map((note) => (
        <p key={note.label} className="text-slate-300">
          <span className="mr-1.5 font-bold uppercase tracking-normal text-slate-500">{note.label}</span>
          {note.text}
        </p>
      ))}
    </div>
  );
}

function SpeakButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-300 text-slate-950 shadow-sm transition hover:bg-cyan-200"
      onClick={onClick}
    >
      <Volume2 className="h-4 w-4" />
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

type LexiconLookupResponse = {
  ipa?: string;
  meaning?: string;
  example?: string;
  related?: string[];
};

async function buildEntryInput(text: string) {
  const local = getLocalLexiconEnrichment(text);
  if (local) {
    return {
      word: text,
      ...local,
    };
  }

  if (isSentence(text)) {
    return {
      word: text,
      ipa: "",
      phonics: "Sentence: tap play to hear the full line.",
      fieldContext: "Saved sentence",
      meaning: sentenceMeaning(text),
      exampleTranslation: sentenceTranslation(text),
    };
  }

  return {
    word: text,
    ...(await lookupDictionaryWord(text)),
  };
}

async function lookupDictionaryWord(word: string) {
  const normalized = word.trim().toLowerCase();
  const fallbackIpa = localIpa[normalized] ?? "";
  if (!normalized) return {};

  try {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 1800);
    const response = await fetch(`/api/lexicon-lookup?term=${encodeURIComponent(normalized)}`, {
      signal: controller.signal,
      cache: "no-store",
    });
    window.clearTimeout(timer);
    if (!response.ok) return { ipa: fallbackIpa };
    const lookup = (await response.json()) as LexiconLookupResponse;

    return {
      ipa: lookup.ipa?.trim() || fallbackIpa,
      meaning: lookup.meaning?.trim() ?? "",
      example: lookup.example?.trim() ?? "",
      related: lookup.related?.slice(0, 8) ?? [],
    };
  } catch {
    return { ipa: fallbackIpa };
  }
}

function isSentence(text: string) {
  const words = text.trim().split(/\s+/).filter(Boolean);
  return words.length >= 4 || /[.!?]$/.test(text.trim());
}

function sentenceMeaning(text: string) {
  const normalized = normalizedSentence(text);
  if (normalized.includes("course framing as geometrical analytical and computational machine perception")) {
    return "framing 在这里是课程定位/理解框架，不是画框。";
  }
  if (normalized.includes("solar panel") && normalized.includes("square meter") && normalized.includes("receive")) {
    return "这是在用直觉解释 irradiance：每单位面积接收到多少光能。";
  }
  if (normalized.includes("watts measure how much energy is transferred per second")) {
    return "这是在解释 watt 的物理意义：每秒传递多少能量。";
  }
  return "";
}

function sentenceTranslation(text: string) {
  const normalized = normalizedSentence(text);
  if (normalized.includes("course framing as geometrical analytical and computational machine perception")) {
    return "Canvas 课程主页确认了这门课的定位：它从几何、分析和计算三个角度来理解 machine perception。";
  }
  if (normalized.includes("solar panel") && normalized.includes("square meter") && normalized.includes("receive")) {
    return "如果我把太阳能板放在这里，每平方米会接收到多少光能？";
  }
  if (normalized.includes("watts measure how much energy is transferred per second")) {
    return "瓦特衡量的是每秒传递多少能量。";
  }
  return "";
}

function normalizedSentence(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}
