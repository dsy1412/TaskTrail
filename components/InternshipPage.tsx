"use client";

import { BriefcaseBusiness, ExternalLink, Plus, Search, Trash2 } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import type { JobApplication, JobApplicationStatus, PlannerState } from "@/lib/types";

type JobInput = {
  company: string;
  role: string;
  location: string;
  url: string;
  source: string;
  status: JobApplicationStatus;
  notes: string;
};

const emptyInput: JobInput = {
  company: "",
  role: "",
  location: "",
  url: "",
  source: "zapplyjobs/New-Grad-Jobs-2027",
  status: "Saved",
  notes: "",
};

const jobSources = [
  {
    id: "zapplyjobs/New-Grad-Jobs-2027",
    label: "New Grad Jobs 2027",
    scope: "General SWE / tech new grad",
    url: "https://github.com/zapplyjobs/New-Grad-Jobs-2027",
  },
  {
    id: "SimplifyJobs/New-Grad-Positions",
    label: "Simplify New Grad",
    scope: "Broad US new grad list",
    url: "https://github.com/SimplifyJobs/New-Grad-Positions",
  },
  {
    id: "zapplyjobs/New-Grad-Data-Science-Jobs-2027",
    label: "Data Science Jobs 2027",
    scope: "Data science / ML / analytics",
    url: "https://github.com/zapplyjobs/New-Grad-Data-Science-Jobs-2027",
  },
];

const statuses: JobApplicationStatus[] = ["Saved", "Applied", "OA", "Interview", "Offer", "Rejected"];

const statusTone: Record<JobApplicationStatus, string> = {
  Saved: "border-slate-600 bg-slate-800 text-slate-200",
  Applied: "border-cyan-300/40 bg-cyan-300/12 text-cyan-100",
  OA: "border-violet-300/40 bg-violet-300/12 text-violet-100",
  Interview: "border-amber-300/40 bg-amber-300/12 text-amber-100",
  Offer: "border-emerald-300/40 bg-emerald-300/12 text-emerald-100",
  Rejected: "border-rose-300/40 bg-rose-300/12 text-rose-100",
};

export function InternshipPage({
  state,
  onCreateApplication,
  onUpdateApplication,
  onDeleteApplication,
  canEdit,
}: {
  state: PlannerState;
  onCreateApplication: (input: JobInput) => JobApplication | undefined;
  onUpdateApplication: (applicationId: string, patch: Partial<Omit<JobApplication, "id" | "createdAt">>) => void;
  onDeleteApplication: (applicationId: string) => void;
  canEdit: boolean;
}) {
  const [draft, setDraft] = useState<JobInput>(emptyInput);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<JobApplicationStatus | "All">("All");

  const activeApplications = useMemo(() => {
    return (state.jobApplications ?? [])
      .filter((application) => !application.deletedAt)
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
  }, [state.jobApplications]);

  const filteredApplications = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return activeApplications.filter((application) => {
      const matchesStatus = statusFilter === "All" || application.status === statusFilter;
      const matchesQuery =
        !normalizedQuery ||
        [application.company, application.role, application.location, application.source, application.notes].some((value) =>
          value.toLowerCase().includes(normalizedQuery),
        );
      return matchesStatus && matchesQuery;
    });
  }, [activeApplications, query, statusFilter]);

  const metrics = useMemo(() => {
    const active = activeApplications.filter((application) => !["Rejected", "Offer"].includes(application.status));
    return {
      saved: activeApplications.filter((application) => application.status === "Saved").length,
      applied: activeApplications.filter((application) => application.status === "Applied").length,
      pipeline: active.filter((application) => ["OA", "Interview"].includes(application.status)).length,
      total: activeApplications.length,
    };
  }, [activeApplications]);

  function updateDraft<K extends keyof JobInput>(field: K, value: JobInput[K]) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canEdit || !draft.company.trim() || !draft.role.trim()) return;
    onCreateApplication(draft);
    setDraft((current) => ({
      ...emptyInput,
      source: current.source,
    }));
  }

  return (
    <section data-testid="internship-view" className="mx-auto grid w-full max-w-[112rem] gap-4">
      <header className="glass-panel rounded-xl p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-400">
              <BriefcaseBusiness className="h-4 w-4 text-cyan-300" />
              2027 search
            </div>
            <h2 className="mt-1 text-2xl font-semibold tracking-normal text-slate-50">Internship Hunt</h2>
            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-400">
              Track roles from the three GitHub lists, keep the source link, and move each opportunity through your own pipeline.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:min-w-[28rem]">
            <MetricTile label="Saved" value={metrics.saved} />
            <MetricTile label="Applied" value={metrics.applied} />
            <MetricTile label="Pipeline" value={metrics.pipeline} />
            <MetricTile label="Total" value={metrics.total} />
          </div>
        </div>
      </header>

      <section className="grid gap-4 xl:grid-cols-[22rem_minmax(0,1fr)]">
        <aside className="grid gap-4 xl:sticky xl:top-3 xl:self-start">
          <div className="glass-panel rounded-xl p-4">
            <h3 className="text-sm font-semibold text-slate-50">Sources</h3>
            <div className="mt-3 grid gap-2">
              {jobSources.map((source) => (
                <div key={source.id} className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-100">{source.label}</p>
                      <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">{source.scope}</p>
                    </div>
                    <a
                      aria-label={`Open ${source.label}`}
                      title="Open source"
                      href={source.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-700 bg-slate-950 text-slate-300 transition hover:border-cyan-300 hover:text-cyan-200"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                  <button
                    type="button"
                    className="mt-2 rounded-md border border-slate-700 px-2 py-1 text-xs font-bold text-slate-300 transition hover:border-cyan-300 hover:text-cyan-200"
                    onClick={() => updateDraft("source", source.id)}
                  >
                    Use as source
                  </button>
                </div>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="glass-panel rounded-xl p-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-slate-50">Add opportunity</h3>
              <button
                type="submit"
                aria-label="Add job opportunity"
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-cyan-300 px-3 text-sm font-semibold text-slate-950 shadow-sm transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={!canEdit || !draft.company.trim() || !draft.role.trim()}
              >
                <Plus className="h-4 w-4" />
                Add
              </button>
            </div>
            <div className="mt-3 grid gap-2">
              <input
                aria-label="Company"
                value={draft.company}
                onChange={(event) => updateDraft("company", event.target.value)}
                placeholder="Company"
                className="min-h-10 rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm font-semibold text-slate-50 outline-none transition placeholder:text-slate-500 focus:border-cyan-300"
              />
              <input
                aria-label="Role"
                value={draft.role}
                onChange={(event) => updateDraft("role", event.target.value)}
                placeholder="Role"
                className="min-h-10 rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm font-semibold text-slate-50 outline-none transition placeholder:text-slate-500 focus:border-cyan-300"
              />
              <input
                aria-label="Location"
                value={draft.location}
                onChange={(event) => updateDraft("location", event.target.value)}
                placeholder="Location / Remote"
                className="min-h-10 rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm font-semibold text-slate-50 outline-none transition placeholder:text-slate-500 focus:border-cyan-300"
              />
              <input
                aria-label="Job link"
                value={draft.url}
                onChange={(event) => updateDraft("url", event.target.value)}
                placeholder="Application link"
                className="min-h-10 rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm font-semibold text-slate-50 outline-none transition placeholder:text-slate-500 focus:border-cyan-300"
              />
              <select
                aria-label="Job source"
                value={draft.source}
                onChange={(event) => updateDraft("source", event.target.value)}
                className="min-h-10 rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm font-semibold text-slate-100 outline-none transition focus:border-cyan-300"
              >
                {jobSources.map((source) => (
                  <option key={source.id} value={source.id}>
                    {source.id}
                  </option>
                ))}
              </select>
              <select
                aria-label="Job status"
                value={draft.status}
                onChange={(event) => updateDraft("status", event.target.value as JobApplicationStatus)}
                className="min-h-10 rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm font-semibold text-slate-100 outline-none transition focus:border-cyan-300"
              >
                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
              <textarea
                aria-label="Job notes"
                value={draft.notes}
                onChange={(event) => updateDraft("notes", event.target.value)}
                placeholder="Next step, referral, deadline, resume variant"
                className="min-h-20 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-semibold leading-6 text-slate-50 outline-none transition placeholder:text-slate-500 focus:border-cyan-300"
              />
            </div>
          </form>
        </aside>

        <div className="grid gap-3">
          <div className="glass-panel rounded-xl p-3">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <label className="flex min-h-11 flex-1 items-center gap-2 rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm font-semibold text-slate-400 focus-within:border-cyan-300">
                <Search className="h-4 w-4 text-slate-500" />
                <input
                  aria-label="Search job applications"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search company, role, notes"
                  className="min-w-0 flex-1 bg-transparent py-3 text-slate-100 outline-none placeholder:text-slate-500"
                />
              </label>
              <div className="flex gap-1 overflow-x-auto rounded-lg border border-slate-800 bg-slate-950 p-1">
                {["All", ...statuses].map((status) => (
                  <button
                    key={status}
                    type="button"
                    className={`rounded-md px-3 py-2 text-xs font-bold transition ${
                      statusFilter === status ? "bg-slate-100 text-slate-950" : "text-slate-400 hover:text-slate-100"
                    }`}
                    onClick={() => setStatusFilter(status as JobApplicationStatus | "All")}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-2 xl:grid-cols-2">
            {filteredApplications.length ? (
              filteredApplications.map((application) => (
                <JobApplicationCard
                  key={application.id}
                  application={application}
                  canEdit={canEdit}
                  onUpdateApplication={(patch) => onUpdateApplication(application.id, patch)}
                  onDeleteApplication={() => onDeleteApplication(application.id)}
                />
              ))
            ) : (
              <div className="glass-panel rounded-xl border-dashed p-8 text-center text-sm font-semibold text-slate-400 xl:col-span-2">
                No opportunities match this view.
              </div>
            )}
          </div>
        </div>
      </section>
    </section>
  );
}

function JobApplicationCard({
  application,
  canEdit,
  onUpdateApplication,
  onDeleteApplication,
}: {
  application: JobApplication;
  canEdit: boolean;
  onUpdateApplication: (patch: Partial<Omit<JobApplication, "id" | "createdAt">>) => void;
  onDeleteApplication: () => void;
}) {
  return (
    <article data-testid="job-application-card" className="glass-panel rounded-xl p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="break-words text-lg font-semibold leading-6 text-slate-50">{application.role}</h3>
          <p className="mt-1 text-sm font-semibold text-slate-300">{application.company}</p>
        </div>
        <span className={`shrink-0 rounded-md border px-2 py-1 text-xs font-bold ${statusTone[application.status]}`}>
          {application.status}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-slate-400">
        {application.location ? <span className="rounded-md bg-slate-800 px-2 py-1">{application.location}</span> : null}
        {application.source ? <span className="rounded-md bg-slate-800 px-2 py-1">{application.source}</span> : null}
      </div>

      {application.notes ? <p className="mt-3 text-sm font-semibold leading-6 text-slate-300">{application.notes}</p> : null}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <select
          aria-label={`Update ${application.company} status`}
          value={application.status}
          onChange={(event) => onUpdateApplication({ status: event.target.value as JobApplicationStatus })}
          disabled={!canEdit}
          className="min-h-10 rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm font-semibold text-slate-100 outline-none transition focus:border-cyan-300 disabled:opacity-60"
        >
          {statuses.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
        {application.url ? (
          <a
            href={application.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm font-semibold text-slate-300 transition hover:border-cyan-300 hover:text-cyan-200"
          >
            Open
            <ExternalLink className="h-4 w-4" />
          </a>
        ) : null}
        <button
          type="button"
          aria-label={`Delete ${application.company} ${application.role}`}
          title="Delete opportunity"
          className="ml-auto inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-700 bg-slate-950 text-slate-400 transition hover:border-rose-400 hover:text-rose-200 disabled:opacity-60"
          onClick={onDeleteApplication}
          disabled={!canEdit}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </article>
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
