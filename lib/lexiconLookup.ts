export type LexicalMetadata = {
  ipa: string;
  meaning: string;
  example: string;
  related: string[];
};

export type DictionaryApiEntry = {
  phonetic?: string;
  phonetics?: Array<{ text?: string }>;
  meanings?: Array<{
    definitions?: Array<{
      definition?: string;
      example?: string;
      synonyms?: string[];
    }>;
  }>;
};

export type DatamuseEntry = {
  word?: string;
  defs?: string[];
  tags?: string[];
};

const emptyMetadata: LexicalMetadata = {
  ipa: "",
  meaning: "",
  example: "",
  related: [],
};

export function extractDictionaryMetadata(entries: DictionaryApiEntry[] | undefined): LexicalMetadata {
  if (!entries?.length) return emptyMetadata;

  const ipa = entries
    .flatMap((entry) => [entry.phonetic, ...(entry.phonetics ?? []).map((phonetic) => phonetic.text)])
    .find((text): text is string => Boolean(text?.trim())) ?? "";
  const definition = entries
    .flatMap((entry) => entry.meanings ?? [])
    .flatMap((meaning) => meaning.definitions ?? [])
    .find((candidate) => Boolean(candidate.definition?.trim()));

  return {
    ipa: formatIpa(ipa),
    meaning: definition?.definition?.trim() ?? "",
    example: definition?.example?.trim() ?? "",
    related: definition?.synonyms?.map((word) => word.trim()).filter(Boolean).slice(0, 8) ?? [],
  };
}

export function extractDatamuseMetadata(entries: DatamuseEntry[] | undefined): LexicalMetadata {
  const entry = entries?.[0];
  if (!entry) return emptyMetadata;

  const ipa = entry.tags
    ?.find((tag) => tag.startsWith("ipa_pron:"))
    ?.slice("ipa_pron:".length)
    .trim() ?? "";
  const meaning = entry.defs?.find(Boolean)?.replace(/^[^\t]+\t/, "").trim() ?? "";

  return {
    ipa: formatIpa(ipa),
    meaning,
    example: "",
    related: [],
  };
}

export function mergeLexicalMetadata(primary: LexicalMetadata, fallback: LexicalMetadata): LexicalMetadata {
  return {
    ipa: primary.ipa || fallback.ipa,
    meaning: primary.meaning || fallback.meaning,
    example: primary.example || fallback.example,
    related: primary.related.length ? primary.related : fallback.related,
  };
}

export function cleanTranslatedText(value: string) {
  return value
    .replace(/&quot;/gi, '"')
    .replace(/&#0*39;|&apos;/gi, "'")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#(\d+);/g, (_match, code: string) => String.fromCodePoint(Number(code)))
    .trim();
}

export function containsChineseText(value: string) {
  return /[\u3400-\u9fff]/.test(value);
}

export function isSentenceInput(value: string) {
  const words = value.trim().split(/\s+/).filter(Boolean);
  return words.length >= 4 || /[.!?]$/.test(value.trim());
}

export function trimForTranslation(value: string, maxLength = 420) {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) return normalized;
  const shortened = normalized.slice(0, maxLength);
  const sentenceEnd = Math.max(shortened.lastIndexOf("."), shortened.lastIndexOf(";"));
  return `${(sentenceEnd >= maxLength / 2 ? shortened.slice(0, sentenceEnd + 1) : shortened).trim()}...`;
}

function formatIpa(value: string) {
  const normalized = value.trim().replace(/^\/+|\/+$/g, "");
  return normalized ? `/${normalized}/` : "";
}
