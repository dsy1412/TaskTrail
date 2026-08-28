import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions, isAllowedPlannerEmail } from "@/lib/auth";

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
  if (!term || term.length > 120) {
    return NextResponse.json({ error: "Invalid term" }, { status: 400 });
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2500);
    const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(term)}`, {
      signal: controller.signal,
      cache: "no-store",
    });
    clearTimeout(timer);

    if (!response.ok) {
      return NextResponse.json({ ipa: "", meaning: "", example: "", related: [] });
    }

    const entries = (await response.json()) as DictionaryEntry[];
    const ipa = entries
      .flatMap((entry) => [entry.phonetic, ...(entry.phonetics ?? []).map((phonetic) => phonetic.text)])
      .find((text): text is string => Boolean(text?.trim())) ?? "";
    const definition = entries
      .flatMap((entry) => entry.meanings ?? [])
      .flatMap((meaning) => meaning.definitions ?? [])
      .find((candidate) => Boolean(candidate.definition?.trim()));

    return NextResponse.json({
      ipa,
      meaning: definition?.definition?.trim() ?? "",
      example: definition?.example?.trim() ?? "",
      related: definition?.synonyms?.slice(0, 8) ?? [],
    });
  } catch {
    return NextResponse.json({ ipa: "", meaning: "", example: "", related: [] });
  }
}

type DictionaryEntry = {
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
