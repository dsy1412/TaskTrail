"use client";

import { BriefcaseBusiness, ChevronDown, ExternalLink, RefreshCcw, Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  jobTrackingKey,
  sortAggregatedJobs,
  type AggregatedJob,
  type AggregatedJobKind,
  type AggregatedJobsResponse,
  type JobSortMode,
  type JobSourceId,
} from "@/lib/jobSources";
import type { JobApplication, JobApplicationStatus, PlannerState } from "@/lib/types";

const statuses: JobApplicationStatus[] = ["Saved", "Applied", "OA", "Interview", "Offer", "Rejected"];
const PAGE_SIZE = 60;

const statusTone: Record<JobApplicationStatus, string> = {
  Saved: "border-slate-600 bg-slate-800 text-slate-200",
  Applied: "border-cyan-300/40 bg-cyan-300/12 text-cyan-100",
  OA: "border-violet-300/40 bg-violet-300/12 text-violet-100",
  Interview: "border-amber-300/40 bg-amber-300/12 text-amber-100",
  Offer: "border-emerald-300/40 bg-emerald-300/12 text-emerald-100",
  Rejected: "border-rose-300/40 bg-rose-300/12 text-rose-100",
};

type TrackingFilter = "All" | "Untracked" | JobApplicationStatus;
type SponsorshipFilter = "All" | "Sponsor";

export function InternshipPage({
  state,
  onCreateApplication,
  onUpdateApplication,
  onDeleteApplication,
  canEdit,
}: {
  state: PlannerState;
  onCreateApplication: (input: {
    company: string;
    role: string;
    location?: string;
    url?: string;
    source?: string;
    status?: JobApplicationStatus;
    notes?: string;
  }) => JobApplication | undefined;
  onUpdateApplication: (applicationId: string, patch: Partial<Omit<JobApplication, "id" | "createdAt">>) => void;
  onDeleteApplication: (applicationId: string) => void;
  canEdit: boolean;
}) {
  const [feed, setFeed] = useState<AggregatedJobsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [kindFilter, setKindFilter] = useState<AggregatedJobKind | "All">("Internship");
  const [sourceFilter, setSourceFilter] = useState<JobSourceId | "All">("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [sponsorshipFilter, setSponsorshipFilter] = useState<SponsorshipFilter>("All");
  const [trackingFilter, setTrackingFilter] = useState<TrackingFilter>("All");
  const [sortMode, setSortMode] = useState<JobSortMode>("prominence");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const loadJobs = useCallback(async (forceRefresh = false) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(forceRefresh ? "/api/jobs?refresh=1" : "/api/jobs", { cache: "no-store" });
      const body = (await response.json()) as AggregatedJobsResponse & { error?: string };
      if (!response.ok) throw new Error(body.error ?? `Job feed request failed with ${response.status}`);
      setFeed(body);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "The GitHub job feeds could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadJobs();
  }, [loadJobs]);

  const activeApplications = useMemo(
    () => (state.jobApplications ?? []).filter((application) => !application.deletedAt),
    [state.jobApplications],
  );

  const trackingByJob = useMemo(() => {
    const map = new Map<string, JobApplication>();
    [...activeApplications]
      .sort((left, right) => left.updatedAt.localeCompare(right.updatedAt))
      .forEach((application) => map.set(jobTrackingKey(application), application));
    return map;
  }, [activeApplications]);

  const categories = useMemo(
    () => [...new Set((feed?.jobs ?? []).map((job) => job.category))].sort((left, right) => left.localeCompare(right)),
    [feed?.jobs],
  );

  const filteredJobs = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const matches = (feed?.jobs ?? []).filter((job) => {
      const tracked = trackingByJob.get(jobTrackingKey(job));
      const matchesQuery =
        !normalizedQuery ||
        [job.company, job.role, job.location, job.category].some((value) => value.toLowerCase().includes(normalizedQuery));
      const matchesKind = kindFilter === "All" || job.kind === kindFilter;
      const matchesSource = sourceFilter === "All" || job.sources.includes(sourceFilter);
      const matchesCategory = categoryFilter === "All" || job.category === categoryFilter;
      const matchesSponsorship = sponsorshipFilter === "All" || job.sponsorship;
      const matchesTracking =
        trackingFilter === "All" ||
        (trackingFilter === "Untracked" ? !tracked : tracked?.status === trackingFilter);
      return matchesQuery && matchesKind && matchesSource && matchesCategory && matchesSponsorship && matchesTracking;
    });
    return sortAggregatedJobs(matches, sortMode);
  }, [categoryFilter, feed?.jobs, kindFilter, query, sortMode, sourceFilter, sponsorshipFilter, trackingByJob, trackingFilter]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [categoryFilter, kindFilter, query, sortMode, sourceFilter, sponsorshipFilter, trackingFilter]);

  const metrics = useMemo(() => {
    const jobs = feed?.jobs ?? [];
    return {
      total: jobs.length,
      internships: jobs.filter((job) => job.kind === "Internship").length,
      sponsored: jobs.filter((job) => job.sponsorship).length,
      tracked: activeApplications.length,
    };
  }, [activeApplications.length, feed?.jobs]);

  function updateTracking(job: AggregatedJob, status: JobApplicationStatus | "Untracked") {
    if (!canEdit) return;
    const existing = trackingByJob.get(jobTrackingKey(job));
    if (status === "Untracked") {
      if (existing) onDeleteApplication(existing.id);
      return;
    }
    if (existing) {
      onUpdateApplication(existing.id, { status });
      return;
    }
    onCreateApplication({
      company: job.company,
      role: job.role,
      location: job.location,
      url: job.url,
      source: job.sources.join(", "),
      status,
    });
  }

  return (
    <section data-testid="internship-view" className="mx-auto grid w-full min-w-0 max-w-7xl gap-4 overflow-x-clip">
      <header className="glass-panel rounded-xl p-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-400">
              <BriefcaseBusiness className="h-4 w-4 text-cyan-300" />
              Live GitHub aggregation
            </div>
            <h2 className="mt-1 text-2xl font-semibold tracking-normal text-slate-50">2027 Job Feed</h2>
            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-400">
              Maintained public job lists are merged automatically. Duplicate company, role, and location entries appear once.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:min-w-[30rem]">
            <MetricTile label="All roles" value={metrics.total} />
            <MetricTile label="Internships" value={metrics.internships} />
            <MetricTile label="Sponsor" value={metrics.sponsored} />
            <MetricTile label="Tracked" value={metrics.tracked} />
          </div>
        </div>

        <details className="group mt-4 rounded-lg border border-slate-800 bg-slate-950/45">
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-3 text-sm font-semibold text-slate-300 [&::-webkit-details-marker]:hidden">
            <span>{feed?.sources.length ?? 0} GitHub sources</span>
            <ChevronDown className="h-4 w-4 shrink-0 text-slate-500 transition group-open:rotate-180" />
          </summary>
          <div className="grid gap-2 border-t border-slate-800 p-2 sm:grid-cols-2 lg:grid-cols-3">
            {(feed?.sources ?? []).map((source) => (
              <a
                key={source.id}
                href={source.repoUrl}
                target="_blank"
                rel="noreferrer"
                className="flex min-h-11 min-w-0 items-center justify-between gap-3 rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-2 text-sm transition hover:border-cyan-300/60"
              >
                <span className="min-w-0 truncate font-semibold text-slate-200">{source.label}</span>
                <span className={`shrink-0 text-xs font-bold ${source.error ? "text-rose-300" : "text-slate-400"}`}>
                  {source.error ? "Unavailable" : `${source.count} roles`}
                </span>
              </a>
            ))}
          </div>
        </details>
      </header>

      <section className="glass-panel rounded-xl p-3">
        <div className="grid min-w-0 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          <label className="flex min-h-11 min-w-0 items-center gap-2 rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm font-semibold text-slate-400 focus-within:border-cyan-300 sm:col-span-2">
            <Search className="h-4 w-4 text-slate-500" />
            <input
              aria-label="Search aggregated jobs"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Company, role, location"
              className="min-w-0 flex-1 bg-transparent py-3 text-slate-100 outline-none placeholder:text-slate-500"
            />
          </label>
          <FilterSelect label="Role type" value={kindFilter} onChange={(value) => setKindFilter(value as AggregatedJobKind | "All")}>
            <option value="All">All types</option>
            <option value="Internship">Intern / co-op</option>
            <option value="New Grad">New grad</option>
            <option value="Other">Other</option>
          </FilterSelect>
          <FilterSelect label="Job source" value={sourceFilter} onChange={(value) => setSourceFilter(value as JobSourceId | "All")}>
            <option value="All">All sources</option>
            {(feed?.sources ?? []).map((source) => (
              <option key={source.id} value={source.id}>{source.label}</option>
            ))}
          </FilterSelect>
          <FilterSelect label="Job category" value={categoryFilter} onChange={setCategoryFilter}>
            <option value="All">All fields</option>
            {categories.map((category) => <option key={category} value={category}>{category}</option>)}
          </FilterSelect>
          <FilterSelect label="Sponsorship" value={sponsorshipFilter} onChange={(value) => setSponsorshipFilter(value as SponsorshipFilter)}>
            <option value="All">Any visa</option>
            <option value="Sponsor">Sponsor shown</option>
          </FilterSelect>
          <FilterSelect label="Application tracking" value={trackingFilter} onChange={(value) => setTrackingFilter(value as TrackingFilter)}>
            <option value="All">Any progress</option>
            <option value="Untracked">Untracked</option>
            {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
          </FilterSelect>
          <FilterSelect label="Sort jobs" value={sortMode} onChange={(value) => setSortMode(value as JobSortMode)}>
            <option value="prominence">Known companies first</option>
            <option value="salary">Salary high to low</option>
          </FilterSelect>
          <button
            type="button"
            aria-label="Refresh GitHub job feeds"
            title="Refresh GitHub job feeds"
            onClick={() => void loadJobs(true)}
            disabled={loading}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm font-semibold text-slate-300 transition hover:border-cyan-300 hover:text-cyan-200 disabled:opacity-60"
          >
            <RefreshCcw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </section>

      {error ? (
        <div className="rounded-xl border border-rose-400/30 bg-rose-400/10 p-4 text-sm font-semibold text-rose-100">
          GitHub feed error: {error}
        </div>
      ) : null}

      <div className="flex flex-col gap-1 px-1 text-sm font-semibold text-slate-400 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
        <span>{loading && !feed ? "Loading GitHub sources..." : `${filteredJobs.length} matching roles`}</span>
        {feed ? <span>Updated {new Date(feed.fetchedAt).toLocaleString()}</span> : null}
      </div>

      <div className="grid gap-2">
        {filteredJobs.slice(0, visibleCount).map((job) => (
          <JobListingRow
            key={job.id}
            job={job}
            application={trackingByJob.get(jobTrackingKey(job))}
            canEdit={canEdit}
            onStatusChange={(status) => updateTracking(job, status)}
          />
        ))}
        {!loading && !filteredJobs.length ? (
          <div className="glass-panel rounded-xl border-dashed p-8 text-center text-sm font-semibold text-slate-400">
            No roles match these filters.
          </div>
        ) : null}
      </div>

      {visibleCount < filteredJobs.length ? (
        <button
          type="button"
          onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
          className="mx-auto min-h-11 rounded-lg border border-slate-700 bg-slate-950 px-5 text-sm font-semibold text-slate-200 transition hover:border-cyan-300 hover:text-cyan-100"
        >
          Show {Math.min(PAGE_SIZE, filteredJobs.length - visibleCount)} more
        </button>
      ) : null}
    </section>
  );
}

function JobListingRow({
  job,
  application,
  canEdit,
  onStatusChange,
}: {
  job: AggregatedJob;
  application?: JobApplication;
  canEdit: boolean;
  onStatusChange: (status: JobApplicationStatus | "Untracked") => void;
}) {
  const selectedStatus = application?.status ?? "Untracked";
  return (
    <article
      data-testid="job-listing-card"
      className="grid min-w-0 gap-3 rounded-xl border border-slate-800 bg-slate-950/55 p-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center"
    >
      <div className="min-w-0">
        <h3 className="break-words text-base font-semibold leading-6 text-slate-50">{job.role}</h3>
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-semibold text-slate-400">
          <span className="text-slate-200">{job.company}</span>
          <span>{job.location || "Location not listed"}</span>
        </div>
        <div className="mt-2 flex min-w-0 flex-wrap gap-1.5 text-xs font-bold text-slate-400">
          <span className="max-w-full truncate rounded-md bg-slate-800 px-2 py-1">{job.category}</span>
          <span className="rounded-md bg-slate-800 px-2 py-1">{job.kind}</span>
          {job.sponsorship ? <span className="rounded-md bg-emerald-400/12 px-2 py-1 text-emerald-200">Sponsor</span> : null}
          {job.salary ? <span className="rounded-md bg-emerald-400/12 px-2 py-1 text-emerald-200">{job.salary}</span> : null}
          {job.posted ? <span className="rounded-md bg-slate-800 px-2 py-1">{job.posted}</span> : null}
          {job.sources.length > 1 ? <span className="rounded-md bg-cyan-300/12 px-2 py-1 text-cyan-200">{job.sources.length} sources</span> : null}
        </div>
      </div>
      <div className="grid min-w-0 grid-cols-[minmax(8.5rem,1fr)_auto] gap-2 md:flex md:items-center">
        <select
          aria-label={`Track ${job.company} status`}
          value={selectedStatus}
          onChange={(event) => onStatusChange(event.target.value as JobApplicationStatus | "Untracked")}
          disabled={!canEdit}
          className={`min-h-10 min-w-0 rounded-lg border px-3 text-sm font-semibold outline-none transition focus:border-cyan-300 disabled:opacity-60 md:w-36 ${
            application ? statusTone[application.status] : "border-slate-700 bg-slate-950 text-slate-300"
          }`}
        >
          <option value="Untracked">Untracked</option>
          {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
        </select>
        <a
          href={job.url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-cyan-300 px-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200"
        >
          Apply
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>
    </article>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
}) {
  return (
    <select
      aria-label={label}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="min-h-11 min-w-0 rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm font-semibold text-slate-200 outline-none transition focus:border-cyan-300"
    >
      {children}
    </select>
  );
}

function MetricTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
      <p className="text-xl font-semibold text-slate-50">{value}</p>
      <p className="mt-1 text-[0.65rem] font-bold uppercase text-slate-500">{label}</p>
    </div>
  );
}
