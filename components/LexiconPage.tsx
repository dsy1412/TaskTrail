"use client";

import { BookOpenText, Plus, RotateCcw, Sparkles, Trash2, Volume2 } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { getLocalLexiconEnrichment } from "@/lib/lexiconEnrichment";
import { containsChineseText, isSentenceInput } from "@/lib/lexiconLookup";
import type { LexiconEntry, PlannerState } from "@/lib/types";

type LexiconInput = {
  word: string;
};

type LexiconEntryInput = {
  word: string;
  ipa?: string;
  phonics?: string;
  fieldContext?: string;
  meaning?: string;
  association?: string;
  example?: string;
  exampleTranslation?: string;
  related?: string[];
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
  onUpdateEntry,
  onDeleteEntry,
  onRestoreEntry,
  canEdit,
}: {
  state: PlannerState;
  onCreateEntry: (input: LexiconEntryInput) => LexiconEntry | undefined;
  onUpdateEntry: (entryId: string, patch: Partial<Omit<LexiconEntry, "id" | "createdAt">>) => void;
  onDeleteEntry: (entryId: string) => void;
  onRestoreEntry: (entryId: string) => void;
  canEdit: boolean;
}) {
  const [draft, setDraft] = useState<LexiconInput>(emptyInput);
  const [voiceName, setVoiceName] = useState("");
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [repairingEntryId, setRepairingEntryId] = useState("");
  const [batchProgress, setBatchProgress] = useState<{ completed: number; total: number; failed: number } | null>(null);
  const [lookupMessage, setLookupMessage] = useState("");
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
  const incompleteEntries = useMemo(
    () => activeEntries.filter(entryNeedsEnrichment),
    [activeEntries],
  );

  function updateDraft(field: keyof LexiconInput, value: string) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft.word.trim() || !canEdit) return;
    const text = draft.word.trim();
    setIsLookingUp(true);
    setLookupMessage("");
    speakText(text, 0.9);
    try {
      const result = await buildEntryInput(text);
      onCreateEntry(result.input);
      setDraft(emptyInput);
      setLookupMessage(result.warning ?? "Added with online notes and translation.");
    } catch {
      setLookupMessage("Online lookup failed. Please try again.");
    } finally {
      setIsLookingUp(false);
    }
  }

  async function completeEntry(entry: LexiconEntry, quiet = false) {
    setRepairingEntryId(entry.id);
    if (!quiet) setLookupMessage("");
    try {
      const result = await buildEntryInput(entry.word);
      const patch = missingEnrichmentPatch(entry, result.input);
      if (Object.keys(patch).length) onUpdateEntry(entry.id, patch);
      const completed = !entryNeedsEnrichment({ ...entry, ...patch });
      if (!quiet) {
        setLookupMessage(
          completed
            ? `Completed notes for ${entry.word}.`
            : result.warning ?? `Some notes for ${entry.word} are still missing. Try again later.`,
        );
      }
      return completed;
    } catch {
      if (!quiet) setLookupMessage(`Could not complete ${entry.word}. Try again later.`);
      return false;
    } finally {
      setRepairingEntryId("");
    }
  }

  async function completeMissingEntries() {
    const targets = [...incompleteEntries];
    if (!targets.length || batchProgress) return;
    setLookupMessage("");
    let failed = 0;
    setBatchProgress({ completed: 0, total: targets.length, failed: 0 });
    try {
      for (let index = 0; index < targets.length; index += 1) {
        const completed = await completeEntry(targets[index], true);
        if (!completed) failed += 1;
        setBatchProgress({ completed: index + 1, total: targets.length, failed });
      }
      const successful = targets.length - failed;
      setLookupMessage(
        failed
          ? `Completed ${successful} cards; ${failed} still need notes and can be retried later.`
          : `Completed all ${targets.length} missing cards.`,
      );
    } catch {
      setLookupMessage("Some cards could not be completed. Please try again.");
    } finally {
      setBatchProgress(null);
    }
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
          <div className="flex flex-wrap items-center justify-end gap-2">
            {!showTrash && incompleteEntries.length ? (
              <button
                type="button"
                aria-label="Complete all missing lexicon notes"
                className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-cyan-300/60 bg-cyan-300/10 px-3 text-xs font-bold text-cyan-100 transition hover:border-cyan-200 hover:bg-cyan-300/15 disabled:opacity-60"
                onClick={completeMissingEntries}
                disabled={!canEdit || Boolean(batchProgress)}
              >
                <Sparkles className="h-4 w-4" />
                {batchProgress
                  ? `Completing ${batchProgress.completed}/${batchProgress.total}`
                  : `Complete all ${incompleteEntries.length}`}
              </button>
            ) : null}
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
        </div>
        {lookupMessage ? <p className="mt-2 text-xs font-semibold text-slate-400" role="status">{lookupMessage}</p> : null}
      </form>

      <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
        {visibleEntries.length ? (
          visibleEntries.map((entry) => (
            <WordCard
              key={entry.id}
              entry={entry}
              mode={showTrash ? "trash" : "active"}
              canEdit={canEdit}
              needsEnrichment={entryNeedsEnrichment(entry)}
              isRepairing={repairingEntryId === entry.id}
              onSpeak={speakText}
              onComplete={() => completeEntry(entry)}
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
  needsEnrichment,
  isRepairing,
  onSpeak,
  onComplete,
  onDelete,
  onRestore,
}: {
  entry: LexiconEntry;
  mode: "active" | "trash";
  canEdit: boolean;
  needsEnrichment: boolean;
  isRepairing: boolean;
  onSpeak: (text: string, rate: number) => void;
  onComplete: () => void;
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
              {mode === "active" && needsEnrichment ? (
                <button
                  type="button"
                  aria-label={`Complete notes for ${entry.word}`}
                  title="Complete notes"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-cyan-300/60 bg-slate-950 text-cyan-200 transition hover:border-cyan-200 hover:text-cyan-100 disabled:opacity-60"
                  onClick={onComplete}
                  disabled={!canEdit || isRepairing}
                >
                  <Sparkles className={`h-4 w-4 ${isRepairing ? "animate-pulse" : ""}`} />
                </button>
              ) : null}
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
  phonics?: string;
  fieldContext?: string;
  meaning?: string;
  example?: string;
  exampleTranslation?: string;
  related?: string[];
  warning?: string;
};

async function buildEntryInput(text: string) {
  const local = getLocalLexiconEnrichment(text);
  if (local) {
    return {
      input: { word: text, ...local },
    };
  }

  return lookupLexiconText(text);
}

async function lookupLexiconText(text: string): Promise<{ input: LexiconEntryInput; warning?: string }> {
  const normalized = text.trim().toLowerCase();
  const fallbackIpa = localIpa[normalized] ?? "";
  const sentence = isSentenceInput(text);
  const fallback: LexiconEntryInput = {
    word: text,
    ipa: fallbackIpa,
    phonics: sentence ? "Sentence: tap play to hear the full line." : "",
    fieldContext: sentence ? "Saved sentence" : "",
    meaning: sentenceMeaning(text),
    exampleTranslation: sentenceTranslation(text),
  };
  if (!normalized) return { input: fallback };

  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(`/api/lexicon-lookup?term=${encodeURIComponent(normalized)}`, {
      signal: controller.signal,
      cache: "no-store",
    });
    if (!response.ok) {
      return { input: fallback, warning: "Online lookup failed. The card was saved and can be completed later." };
    }
    const lookup = (await response.json()) as LexiconLookupResponse;

    return {
      input: {
        word: text,
        ipa: lookup.ipa?.trim() || fallback.ipa,
        phonics: lookup.phonics?.trim() || fallback.phonics,
        fieldContext: lookup.fieldContext?.trim() || fallback.fieldContext,
        meaning: lookup.meaning?.trim() || fallback.meaning,
        example: lookup.example?.trim() ?? "",
        exampleTranslation: lookup.exampleTranslation?.trim() || fallback.exampleTranslation,
        related: lookup.related?.slice(0, 8) ?? [],
      },
      warning: lookup.warning?.trim() || undefined,
    };
  } catch {
    return { input: fallback, warning: "Online lookup timed out. The card was saved and can be completed later." };
  } finally {
    window.clearTimeout(timer);
  }
}

function entryNeedsEnrichment(entry: LexiconEntry) {
  const needsChinese = !containsChineseText(entry.meaning) && !containsChineseText(entry.exampleTranslation);
  const needsIpa = !isSentenceInput(entry.word) && !entry.ipa.trim();
  const needsExampleTranslation = Boolean(entry.example.trim()) && !containsChineseText(entry.exampleTranslation);
  return needsChinese || needsIpa || needsExampleTranslation;
}

function missingEnrichmentPatch(entry: LexiconEntry, input: LexiconEntryInput) {
  const patch: Partial<Omit<LexiconEntry, "id" | "createdAt">> = {};
  if (!entry.ipa && input.ipa) patch.ipa = input.ipa;
  if (!entry.phonics && input.phonics) patch.phonics = input.phonics;
  if (!entry.fieldContext && input.fieldContext) patch.fieldContext = input.fieldContext;
  if ((!entry.meaning || !containsChineseText(entry.meaning)) && input.meaning) patch.meaning = input.meaning;
  if (!entry.association && input.association) patch.association = input.association;
  if (!entry.example && input.example) patch.example = input.example;
  if ((!entry.exampleTranslation || !containsChineseText(entry.exampleTranslation)) && input.exampleTranslation) {
    patch.exampleTranslation = input.exampleTranslation;
  }
  if (!entry.related.length && input.related?.length) patch.related = input.related;
  return patch;
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
