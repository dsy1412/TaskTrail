export const JOB_SOURCE_DEFINITIONS = [
  {
    id: "zapplyjobs/New-Grad-Jobs-2027",
    label: "Zapply New Grad 2027",
    repoUrl: "https://github.com/zapplyjobs/New-Grad-Jobs-2027",
    rawUrl: "https://raw.githubusercontent.com/zapplyjobs/New-Grad-Jobs-2027/main/README.md",
    format: "markdown" as const,
  },
  {
    id: "SimplifyJobs/New-Grad-Positions",
    label: "Simplify New Grad",
    repoUrl: "https://github.com/SimplifyJobs/New-Grad-Positions",
    rawUrl: "https://raw.githubusercontent.com/SimplifyJobs/New-Grad-Positions/dev/README.md",
    format: "html" as const,
  },
  {
    id: "zapplyjobs/New-Grad-Data-Science-Jobs-2027",
    label: "Zapply Data Science 2027",
    repoUrl: "https://github.com/zapplyjobs/New-Grad-Data-Science-Jobs-2027",
    rawUrl: "https://raw.githubusercontent.com/zapplyjobs/New-Grad-Data-Science-Jobs-2027/main/README.md",
    format: "markdown" as const,
  },
] as const;

export type JobSourceId = (typeof JOB_SOURCE_DEFINITIONS)[number]["id"];
export type AggregatedJobKind = "Internship" | "New Grad" | "Other";

export interface AggregatedJob {
  id: string;
  company: string;
  role: string;
  location: string;
  url: string;
  category: string;
  posted: string;
  sponsorship: boolean;
  kind: AggregatedJobKind;
  sources: JobSourceId[];
}

export interface JobSourceSummary {
  id: JobSourceId;
  label: string;
  repoUrl: string;
  count: number;
  error?: string;
}

export interface AggregatedJobsResponse {
  jobs: AggregatedJob[];
  sources: JobSourceSummary[];
  fetchedAt: string;
}

type ParsedJob = Omit<AggregatedJob, "id">;

export function parseZapplyMarkdown(markdown: string, source: JobSourceId): ParsedJob[] {
  const jobs: ParsedJob[] = [];
  let category = "Other";

  for (const rawLine of markdown.split(/\r?\n/)) {
    const summary = rawLine.match(/<summary>.*?<strong>(.*?)<\/strong>.*?<\/summary>/i);
    if (summary) {
      category = cleanText(summary[1]) || "Other";
      continue;
    }

    const line = rawLine.trim();
    if (!line.startsWith("|") || !line.endsWith("|")) continue;
    const cells = splitMarkdownRow(line);
    if (cells.length < 6) continue;

    const company = cleanText(cells[0]);
    const role = cleanText(cells[1]);
    if (!company || !role || company.toLowerCase() === "company" || /^-+$/.test(company)) continue;

    const url = extractMarkdownUrl(cells[5]);
    if (!url) continue;

    jobs.push({
      company,
      role,
      location: cleanText(cells[2]),
      posted: cleanText(cells[3]),
      sponsorship: /sponsor|✅/i.test(cells[4]),
      url,
      category,
      kind: classifyJobKind(role),
      sources: [source],
    });
  }

  return jobs;
}

export function parseSimplifyHtml(markdown: string, source: JobSourceId): ParsedJob[] {
  const jobs: ParsedJob[] = [];
  let category = "Other";
  let previousCompany = "";
  let rowBuffer = "";
  let insideRow = false;

  for (const rawLine of markdown.split(/\r?\n/)) {
    const heading = rawLine.match(/^##\s+(.+?)\s+New Grad Roles\s*$/i);
    if (heading) category = cleanText(heading[1]) || "Other";

    if (rawLine.includes("<tr>")) {
      insideRow = true;
      rowBuffer = rawLine;
    } else if (insideRow) {
      rowBuffer += `\n${rawLine}`;
    }

    if (!insideRow || !rawLine.includes("</tr>")) continue;
    insideRow = false;
    const cells = [...rowBuffer.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((match) => match[1]);
    rowBuffer = "";
    if (cells.length < 5) continue;

    const rawCompany = cleanText(cells[0]);
    const company = rawCompany === "↳" ? previousCompany : rawCompany;
    if (rawCompany && rawCompany !== "↳") previousCompany = rawCompany;

    const role = cleanText(cells[1]);
    const location = cleanText(cells[2]);
    if (!company || !role || /🔒/.test(cells.join(" "))) continue;

    const urls = [...cells[3].matchAll(/href=["'](https?:\/\/[^"']+)["']/gi)].map((match) => decodeEntities(match[1]));
    const url = urls.find((candidate) => !candidate.includes("simplify.jobs/p/")) ?? urls[0];
    if (!url) continue;

    jobs.push({
      company: cleanCompany(company),
      role,
      location,
      posted: cleanText(cells[4]),
      sponsorship: /✅\s*Sponsor/i.test(cells.join(" ")),
      url,
      category,
      kind: classifyJobKind(role),
      sources: [source],
    });
  }

  return jobs;
}

export function aggregateJobs(groups: ParsedJob[][]): AggregatedJob[] {
  const merged = new Map<string, ParsedJob>();

  for (const job of groups.flat()) {
    const key = jobIdentity(job);
    const existing = merged.get(key);
    if (!existing) {
      merged.set(key, job);
      continue;
    }

    merged.set(key, {
      ...existing,
      url: preferDirectUrl(existing.url, job.url),
      sponsorship: existing.sponsorship || job.sponsorship,
      sources: [...new Set([...existing.sources, ...job.sources])],
    });
  }

  return [...merged.entries()].map(([key, job]) => ({
    ...job,
    id: `job_${stableHash(key)}`,
  }));
}

export function jobTrackingKey(job: Pick<AggregatedJob, "company" | "role" | "location">) {
  return jobIdentity(job);
}

function splitMarkdownRow(line: string) {
  return line.slice(1, -1).split("|").map((cell) => cell.trim());
}

function extractMarkdownUrl(cell: string) {
  const match = cell.match(/\]\((https?:\/\/[^)\s]+)\)/i);
  return match ? decodeEntities(match[1]) : "";
}

function classifyJobKind(role: string): AggregatedJobKind {
  if (/\b(intern(ship)?|co-?op)\b/i.test(role)) return "Internship";
  if (/\b(new grad(uate)?|university grad(uate)?|early career|entry[- ]level|graduate program(me)?|engineer i\b|engineer 1\b)\b/i.test(role)) {
    return "New Grad";
  }
  return "Other";
}

function cleanCompany(value: string) {
  return value.replace(/[🔥🎓🇺🇸🛂🔒]/gu, "").trim();
}

function cleanText(value: string) {
  return decodeEntities(value)
    .replace(/<[^>]+>/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/\*\*|__/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function decodeEntities(value: string) {
  const named: Record<string, string> = {
    "&amp;": "&",
    "&quot;": '"',
    "&#39;": "'",
    "&apos;": "'",
    "&lt;": "<",
    "&gt;": ">",
    "&nbsp;": " ",
  };
  return value
    .replace(/&(amp|quot|apos|lt|gt|nbsp);|&#39;/g, (entity) => named[entity] ?? entity)
    .replace(/&#(\d+);/g, (_entity, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_entity, code) => String.fromCodePoint(Number.parseInt(code, 16)));
}

function jobIdentity(job: Pick<ParsedJob, "company" | "role" | "location">) {
  return [job.company, job.role, job.location]
    .map((value) => value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim())
    .join("|");
}

function preferDirectUrl(left: string, right: string) {
  const leftIsAggregator = /zapply\.jobs|simplify\.jobs\/p\//i.test(left);
  const rightIsAggregator = /zapply\.jobs|simplify\.jobs\/p\//i.test(right);
  return leftIsAggregator && !rightIsAggregator ? right : left;
}

function stableHash(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}
