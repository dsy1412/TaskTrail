"use client";

import { ArrowLeft, BookOpenCheck, CheckCircle2, GraduationCap, Layers3, Search, ShieldCheck } from "lucide-react";
import { signIn, useSession } from "next-auth/react";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  degreePlanSummary,
  degreeRequirements,
  electiveBuckets,
  thesisOptions,
  type DegreeCourse,
  type DegreePlanSectionId,
} from "@/lib/degreePlan";

const sections: Array<{ id: DegreePlanSectionId; label: string }> = [
  { id: "core", label: "Core" },
  { id: "ai", label: "AI" },
  { id: "electives", label: "Electives" },
  { id: "thesis", label: "Thesis" },
];

export function DegreePlanPage() {
  const { status } = useSession();
  const [section, setSection] = useState<DegreePlanSectionId>("core");
  const [query, setQuery] = useState("");

  const visibleRequirements = degreeRequirements.filter((requirement) => requirement.section === section);
  const searchableCourses = useMemo(() => {
    if (!query.trim()) return [];
    const normalizedQuery = query.trim().toLowerCase();
    return [
      ...degreeRequirements.flatMap((requirement) =>
        requirement.courses.map((course) => ({ course, context: requirement.title })),
      ),
      ...electiveBuckets.flatMap((bucket) => bucket.courses.map((course) => ({ course, context: bucket.title }))),
      ...thesisOptions.map((course) => ({ course, context: "Thesis / Independent Study" })),
    ].filter(({ course, context }) =>
      [course.code, course.title, course.term, course.note ?? "", context].some((value) =>
        value.toLowerCase().includes(normalizedQuery),
      ),
    );
  }, [query]);

  if (status === "loading") return <DegreePlanAccess mode="checking" />;
  if (status !== "authenticated") return <DegreePlanAccess mode="sign-in" />;

  return (
    <main className="min-h-screen px-3 py-3 text-ink sm:px-5 lg:px-6 xl:px-8">
      <div className="mx-auto grid w-full max-w-[112rem] gap-4">
        <header className="grid gap-3 px-1 lg:grid-cols-[auto_minmax(0,1fr)] lg:items-start">
          <Link
            href="/"
            aria-label="Back to planner"
            className="inline-flex min-h-11 w-fit items-center gap-2 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-semibold text-slate-300 shadow-sm transition hover:border-cyan-300 hover:text-cyan-200"
          >
            <ArrowLeft className="h-4 w-4" />
            Planner
          </Link>
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-400">
              <GraduationCap className="h-4 w-4 text-cyan-300" />
              {degreePlanSummary.school}
            </div>
            <h1 className="mt-1 text-2xl font-semibold tracking-normal text-slate-50 sm:text-4xl">
              {degreePlanSummary.program}
            </h1>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-400">
              {degreePlanSummary.concentration} - {degreePlanSummary.totalCu} CU total
            </p>
          </div>
        </header>

        <section className="grid gap-3 lg:grid-cols-[20rem_minmax(0,1fr)]">
          <aside className="grid gap-3 lg:sticky lg:top-3 lg:self-start">
            <div className="glass-panel rounded-xl p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
                <Layers3 className="h-4 w-4 text-cyan-300" />
                Degree Structure
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2">
                <CuBlock label="Core" value={degreePlanSummary.commonCoreCu} />
                <CuBlock label="AI" value={degreePlanSummary.concentrationCu} />
                <CuBlock label="Elective" value={degreePlanSummary.electiveCu} />
              </div>
              <div className="mt-3 rounded-lg border border-slate-800 bg-slate-950/70 p-3">
                <div className="flex items-center justify-between gap-3 text-xs font-bold text-slate-400">
                  <span>Total requirement</span>
                  <span className="text-slate-100">{degreePlanSummary.totalCu} CU</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-800">
                  <div className="h-full rounded-full bg-cyan-300" style={{ width: "100%" }} />
                </div>
              </div>
            </div>

            <div className="glass-panel rounded-xl p-3">
              <div className="grid grid-cols-4 gap-1 text-xs font-bold lg:grid-cols-2">
                {sections.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`min-h-10 rounded-lg px-2 py-2 transition ${
                      section === item.id ? "bg-cyan-300 text-slate-950" : "text-slate-400 hover:bg-slate-900 hover:text-slate-100"
                    }`}
                    onClick={() => setSection(item.id)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <label className="glass-panel flex min-h-12 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-slate-400 focus-within:border-cyan-300">
              <Search className="h-4 w-4 text-slate-500" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search courses"
                aria-label="Search degree courses"
                className="min-w-0 flex-1 bg-transparent py-3 text-slate-100 outline-none placeholder:text-slate-500"
              />
            </label>
          </aside>

          <div className="grid gap-4">
            {query.trim() ? (
              <SearchResults results={searchableCourses} />
            ) : (
              <>
                {section === "core" || section === "ai" ? (
                  <RequirementGrid requirements={visibleRequirements} />
                ) : null}
                {section === "electives" ? <ElectiveExplorer /> : null}
                {section === "thesis" ? <ThesisPanel /> : null}
              </>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function DegreePlanAccess({ mode }: { mode: "checking" | "sign-in" }) {
  const checking = mode === "checking";
  return (
    <main className="grid min-h-screen place-items-center px-4 py-8 text-ink">
      <section className="glass-panel w-full max-w-md rounded-xl p-6 shadow-soft sm:p-8">
        <div className="mb-5 inline-flex rounded-lg bg-cyan-300 p-3 text-slate-950 shadow-sm">
          <GraduationCap className="h-5 w-5" />
        </div>
        <div className="text-sm font-semibold text-slate-400">Private degree plan</div>
        <h1 className="mt-2 text-3xl font-semibold tracking-normal text-slate-50">DSAI Plan</h1>
        <p className="mt-3 text-sm font-semibold leading-6 text-slate-400">
          {checking ? "Checking your signed-in account." : "Sign in with your approved Google account to open the plan."}
        </p>
        <button
          type="button"
          aria-label="Sign in with Google"
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-cyan-300 px-4 py-3 text-sm font-semibold text-slate-950 shadow-sm transition hover:bg-cyan-200 disabled:cursor-wait disabled:bg-slate-500"
          onClick={() => void signIn("google")}
          disabled={checking}
        >
          <ShieldCheck className="h-4 w-4" />
          {checking ? "Checking" : "Sign in with Google"}
        </button>
      </section>
    </main>
  );
}

function RequirementGrid({ requirements }: { requirements: typeof degreeRequirements }) {
  return (
    <section className="grid gap-3 xl:grid-cols-2">
      {requirements.map((requirement) => (
        <article key={requirement.id} className="glass-panel rounded-xl p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-xs font-bold uppercase text-slate-500">{requirement.rule}</div>
              <h2 className="mt-1 text-lg font-semibold leading-6 text-slate-50">{requirement.title}</h2>
            </div>
            <div className="rounded-lg bg-cyan-300 px-2.5 py-1 text-xs font-bold text-slate-950">{requirement.cu} CU</div>
          </div>
          <CourseList courses={requirement.courses} />
        </article>
      ))}
    </section>
  );
}

function ElectiveExplorer() {
  return (
    <section className="grid gap-3">
      <div className="glass-panel rounded-xl p-4">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" />
          <p className="text-sm font-semibold leading-6 text-slate-300">
            Complete 4 CU of approved electives. For the AI concentration, at least 2 CU should come from Machine Learning,
            Multi-modal AI and Data Analysis.
          </p>
        </div>
      </div>
      <div className="grid gap-3 2xl:grid-cols-2">
        {electiveBuckets.map((bucket) => (
          <details key={bucket.id} className="glass-panel rounded-xl p-4" open={bucket.id === "ml-multimodal-data"}>
            <summary className="cursor-pointer list-none">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-base font-semibold leading-6 text-slate-50">{bucket.title}</h2>
                  <p className="mt-1 text-xs font-bold text-slate-500">{bucket.courses.length} courses</p>
                </div>
                <BookOpenCheck className="h-4 w-4 shrink-0 text-slate-400" />
              </div>
              {bucket.note ? <p className="mt-2 text-xs font-semibold leading-5 text-amber-200">{bucket.note}</p> : null}
            </summary>
            <CourseList courses={bucket.courses} compact />
          </details>
        ))}
      </div>
    </section>
  );
}

function ThesisPanel() {
  return (
    <section className="glass-panel rounded-xl p-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-300">
        <GraduationCap className="h-4 w-4 text-cyan-300" />
        Thesis / Practicum / Independent Study
      </div>
      <CourseList courses={thesisOptions} />
      <p className="mt-3 rounded-lg border border-slate-800 bg-slate-950/60 p-3 text-sm font-semibold leading-6 text-slate-400">
        How these credits apply toward specific elective requirements should be confirmed with the DSAI program.
      </p>
    </section>
  );
}

function SearchResults({ results }: { results: Array<{ course: DegreeCourse; context: string }> }) {
  return (
    <section className="glass-panel rounded-xl p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-slate-50">Search Results</h2>
        <span className="rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1 text-xs font-bold text-slate-400">
          {results.length}
        </span>
      </div>
      <div className="grid gap-2 md:grid-cols-2">
        {results.map(({ course, context }) => (
          <CourseCard key={`${context}-${course.code}-${course.title}`} course={course} context={context} compact />
        ))}
        {!results.length ? (
          <div className="rounded-lg border border-dashed border-slate-700 bg-slate-950/40 p-6 text-center text-sm font-semibold text-slate-400 md:col-span-2">
            No matching courses.
          </div>
        ) : null}
      </div>
    </section>
  );
}

function CourseList({ courses, compact = false }: { courses: DegreeCourse[]; compact?: boolean }) {
  return (
    <div className={`mt-3 grid gap-2 ${compact ? "" : "md:grid-cols-2"}`}>
      {courses.map((course) => (
        <CourseCard key={`${course.code}-${course.title}`} course={course} compact={compact} />
      ))}
    </div>
  );
}

function CourseCard({
  course,
  context,
  compact = false,
}: {
  course: DegreeCourse;
  context?: string;
  compact?: boolean;
}) {
  return (
    <article className="rounded-lg border border-slate-800 bg-slate-900 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-md bg-cyan-300 px-2 py-1 text-[0.68rem] font-bold text-slate-950">{course.code}</span>
        <span className="rounded-md bg-slate-950 px-2 py-1 text-[0.68rem] font-bold text-slate-400">{course.term}</span>
      </div>
      <h3 className={`mt-2 font-semibold leading-5 text-slate-50 ${compact ? "text-sm" : "text-base"}`}>{course.title}</h3>
      {context ? <p className="mt-2 text-xs font-semibold leading-5 text-slate-500">{context}</p> : null}
      {course.note ? <p className="mt-2 text-xs font-semibold leading-5 text-amber-200">{course.note}</p> : null}
    </article>
  );
}

function CuBlock({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3 text-center">
      <div className="text-2xl font-semibold text-slate-50">{value}</div>
      <div className="mt-1 text-[0.68rem] font-bold uppercase text-slate-500">{label}</div>
    </div>
  );
}
