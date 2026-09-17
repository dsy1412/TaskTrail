import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions, isAllowedPlannerEmail } from "@/lib/auth";
import {
  aggregateJobs,
  JOB_SOURCE_DEFINITIONS,
  parseSimplifyHtml,
  parseZapplyMarkdown,
  type AggregatedJobsResponse,
  type JobSourceSummary,
} from "@/lib/jobSources";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  if (!isAllowedPlannerEmail(email)) {
    return NextResponse.json({ error: "This account is not allowed to use TaskTrail" }, { status: 403 });
  }

  const forceRefresh = new URL(request.url).searchParams.get("refresh") === "1";
  const results = await Promise.allSettled(
    JOB_SOURCE_DEFINITIONS.map(async (source) => {
      const response = await fetch(source.rawUrl, {
        headers: { Accept: "text/plain", "User-Agent": "TaskTrail job aggregator" },
        ...(forceRefresh ? { cache: "no-store" as const } : { next: { revalidate: 600 } }),
      });
      if (!response.ok) throw new Error(`GitHub returned ${response.status}`);
      const content = await response.text();
      const jobs =
        source.format === "html"
          ? parseSimplifyHtml(content, source.id)
          : parseZapplyMarkdown(content, source.id);
      return { source, jobs };
    }),
  );

  const groups = results.flatMap((result) => (result.status === "fulfilled" ? [result.value.jobs] : []));
  const sources: JobSourceSummary[] = results.map((result, index) => {
    const source = JOB_SOURCE_DEFINITIONS[index];
    return result.status === "fulfilled"
      ? { id: source.id, label: source.label, repoUrl: source.repoUrl, count: result.value.jobs.length }
      : { id: source.id, label: source.label, repoUrl: source.repoUrl, count: 0, error: safeError(result.reason) };
  });

  if (!groups.length) {
    return NextResponse.json({ error: "All GitHub job sources are unavailable", sources }, { status: 502 });
  }

  const body: AggregatedJobsResponse = {
    jobs: aggregateJobs(groups),
    sources,
    fetchedAt: new Date().toISOString(),
  };
  return NextResponse.json(body, {
    headers: { "Cache-Control": forceRefresh ? "no-store" : "private, max-age=300" },
  });
}

function safeError(error: unknown) {
  return error instanceof Error ? error.message.slice(0, 160) : "Unknown source error";
}
