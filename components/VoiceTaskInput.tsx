"use client";

import { Mic, MicOff, Wand2 } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { parseVoiceTask, speechRecognitionLanguage, type VoiceLanguage } from "@/lib/voiceParser";
import type { ParsedTaskInput } from "@/lib/types";

type RecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
};

export function VoiceTaskInput({
  onParsedTask,
  disabled = false,
  compact = false,
}: {
  onParsedTask: (task: ParsedTaskInput) => void;
  disabled?: boolean;
  compact?: boolean;
}) {
  const [language, setLanguage] = useState<VoiceLanguage>("auto");
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [message, setMessage] = useState("");
  const recognitionRef = useRef<RecognitionLike | null>(null);

  const isSupported = useMemo(() => {
    if (typeof window === "undefined") return false;
    return Boolean((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
  }, []);

  function startListening() {
    if (disabled) return;
    if (!isSupported) {
      setMessage("SpeechRecognition is not available in this browser. You can still paste text and parse it.");
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition() as RecognitionLike;
    recognition.lang = speechRecognitionLanguage(language);
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (event) => {
      const spoken = event.results[0]?.[0]?.transcript ?? "";
      setTranscript(spoken);
      onParsedTask(parseVoiceTask(spoken));
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = (event) => {
      setListening(false);
      setMessage(voiceErrorMessage(event.error));
    };
    recognitionRef.current = recognition;
    setMessage("");
    setListening(true);

    try {
      recognition.start();
    } catch {
      setListening(false);
      setMessage("Voice capture could not start. Try again, or paste text below.");
    }
  }

  function stopListening() {
    recognitionRef.current?.stop();
    setListening(false);
  }

  function parseTypedText() {
    if (disabled) return;
    if (!transcript.trim()) return;
    onParsedTask(parseVoiceTask(transcript));
  }

  return (
    <div className={`rounded-2xl border border-white/70 bg-white/62 ${compact ? "p-2.5" : "p-3"}`}>
      <div className={`flex gap-3 sm:flex-row sm:items-center sm:justify-between ${compact ? "items-center" : "flex-col"}`}>
        <div className="grid grid-cols-3 rounded-full bg-slate-100 p-1 text-xs font-semibold text-slate-500">
          {[
            ["auto", "Auto"],
            ["en-US", "English"],
            ["zh-CN", "中文"],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={`rounded-full px-3 py-1.5 transition ${
                language === value ? "bg-white text-slate-950 shadow-sm" : ""
              }`}
              onClick={() => setLanguage(value as VoiceLanguage)}
              disabled={disabled}
            >
              {label}
            </button>
          ))}
        </div>

        <button
          type="button"
          aria-label={listening ? "Stop voice input" : "Start voice input"}
          title={listening ? "Stop voice input" : "Start voice input"}
          className={`${compact ? "shrink-0" : "self-start sm:self-auto"} rounded-full p-2.5 shadow-sm transition ${
            listening ? "bg-rose-500 text-white" : "bg-slate-950 text-white hover:bg-slate-800"
          }`}
          onClick={listening ? stopListening : startListening}
          disabled={disabled}
        >
          {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
        </button>
      </div>

      <div className={`${compact ? "mt-2" : "mt-3"} flex gap-2`}>
        <input
          value={transcript}
          onChange={(event) => setTranscript(event.target.value)}
          placeholder={compact ? "Say or paste a task..." : "Say or paste: Tomorrow afternoon, project code, two hours..."}
          className="min-w-0 flex-1 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm outline-none transition focus:border-slate-400"
          disabled={disabled}
        />
        <button
          type="button"
          aria-label="Parse voice text"
          title="Parse voice text"
          className="rounded-full bg-white p-2.5 text-slate-700 shadow-sm transition hover:text-slate-950"
          onClick={parseTypedText}
          disabled={disabled}
        >
          <Wand2 className="h-4 w-4" />
        </button>
      </div>

      {message ? <p role="status" className="mt-2 text-xs font-medium text-slate-500">{message}</p> : null}
    </div>
  );
}

function voiceErrorMessage(error?: string) {
  if (error === "not-allowed" || error === "service-not-allowed") {
    return "Microphone permission is blocked. Allow microphone access in the browser, then try again.";
  }

  if (error === "no-speech") {
    return "No speech was detected. Try again, or paste the text below.";
  }

  if (error === "audio-capture") {
    return "No microphone was detected. You can still paste text and parse it.";
  }

  if (error === "network") {
    return "Speech service is unavailable. Paste text below or try again later.";
  }

  return "Voice capture stopped. Check microphone permission and try again.";
}
