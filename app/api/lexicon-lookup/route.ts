import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions, isAllowedPlannerEmail } from "@/lib/auth";
import {
  cleanTranslatedText,
  containsChineseText,
  extractDatamuseMetadata,
  extractDictionaryMetadata,
  isSentenceInput,
  mergeLexicalMetadata,
  trimForTranslation,
  type DatamuseEntry,
  type DictionaryApiEntry,
} from "@/lib/lexiconLookup";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;

  if (!email) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  if (!isAllowedPlannerEmail(email)) {
    return NextResponse.json({ error: "This account is not allowed to use TaskTrail" }, { status: 403 });
  }

  const url = new URL(request.url);
  const term = url.searchParams.get("term")?.trim() ?? "";
  if (!term || term.length > 480) {
    return NextResponse.json({ error: "Invalid term" }, { status: 400 });
  }

  const sentence = isSentenceInput(term);
  const words = term.split(/\s+/).filter(Boolean);
  const [dictionaryEntries, datamuseEntries] = await Promise.all([
    words.length === 1
      ? fetchJson<DictionaryApiEntry[]>(
          `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(term)}`,
          1800,
        )
      : Promise.resolve(undefined),
    sentence
      ? Promise.resolve(undefined)
      : fetchJson<DatamuseEntry[]>(datamuseUrl(term), 2200),
  ]);

  const lexical = mergeLexicalMetadata(
    extractDictionaryMetadata(dictionaryEntries),
    extractDatamuseMetadata(datamuseEntries),
  );
  const meaningSource = trimForTranslation(lexical.meaning || term);
  const [meaningTranslation, exampleTranslation] = await Promise.all([
    translateToChinese(meaningSource),
    lexical.example ? translateToChinese(trimForTranslation(lexical.example)) : Promise.resolve(""),
  ]);
  const translated = containsChineseText(meaningTranslation) || containsChineseText(exampleTranslation);

  return NextResponse.json({
    ipa: lexical.ipa,
    phonics: sentence ? "Sentence: tap play to hear the full line." : "",
    fieldContext: sentence ? "Saved sentence" : "Online dictionary and translation",
    meaning: sentence ? "" : meaningTranslation || lexical.meaning,
    example: lexical.example,
    exampleTranslation: sentence ? meaningTranslation : exampleTranslation,
    related: lexical.related,
    warning: translated ? "" : "Chinese translation is temporarily unavailable. Try completing this card again.",
  });
}

function datamuseUrl(term: string) {
  const params = new URLSearchParams({
    sp: term,
    qe: "sp",
    md: "dr",
    ipa: "1",
    max: "1",
  });
  return `https://api.datamuse.com/words?${params.toString()}`;
}

async function translateToChinese(text: string) {
  if (!text) return "";
  const params = new URLSearchParams({ q: text, langpair: "en|zh-CN" });
  const payload = await fetchJson<MyMemoryResponse>(
    `https://api.mymemory.translated.net/get?${params.toString()}`,
    3500,
  );
  const translated = cleanTranslatedText(payload?.responseData?.translatedText ?? "");
  if ((payload?.responseStatus ?? 500) >= 400 || /^MYMEMORY WARNING/i.test(translated)) return "";
  return translated;
}

async function fetchJson<T>(url: string, timeoutMs: number): Promise<T | undefined> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      cache: "no-store",
      headers: { "User-Agent": "TaskTrail lexicon lookup" },
    });
    if (!response.ok) return undefined;
    return (await response.json()) as T;
  } catch {
    return undefined;
  } finally {
    clearTimeout(timer);
  }
}

type MyMemoryResponse = {
  responseStatus?: number;
  responseData?: { translatedText?: string };
};
