import { describe, expect, it } from "vitest";
import { aggregateJobs, parseSimplifyHtml, parseZapplyMarkdown } from "@/lib/jobSources";

describe("job source aggregation", () => {
  it("parses Zapply Markdown rows and sponsorship", () => {
    const jobs = parseZapplyMarkdown(
      `
<summary><h3>🔬 <strong>Data Scientist</strong></h3></summary>
| Company | Role | Location | Posted | Visa | **Apply** |
|---------|------|----------|--------|------|----------|
| **OpenAI** | Data Science Intern - Summer 2027 | San Francisco, CA | 1d | ✅ Sponsor | [<img alt="Apply">](https://example.com/openai) |
`,
      "zapplyjobs/New-Grad-Data-Science-Jobs-2027",
    );

    expect(jobs).toEqual([
      expect.objectContaining({
        company: "OpenAI",
        role: "Data Science Intern - Summer 2027",
        category: "Data Scientist",
        kind: "Internship",
        sponsorship: true,
        url: "https://example.com/openai",
      }),
    ]);
  });

  it("parses Simplify HTML rows and carries grouped companies forward", () => {
    const jobs = parseSimplifyHtml(
      `
## 💻 Software Engineering New Grad Roles
<tr>
<td><strong><a href="https://simplify.jobs/c/RTX">RTX</a></strong></td>
<td>Software Engineer Intern 2027</td>
<td>Tewksbury, MA</td>
<td><a href="https://example.com/rtx-one"><img alt="Apply"></a></td>
<td>0d</td>
</tr>
<tr>
<td>↳</td>
<td>Software Engineer 1</td>
<td>Woburn, MA</td>
<td><a href="https://example.com/rtx-two"><img alt="Apply"></a></td>
<td>1d</td>
</tr>
`,
      "SimplifyJobs/New-Grad-Positions",
    );

    expect(jobs).toHaveLength(2);
    expect(jobs[0]).toEqual(expect.objectContaining({ company: "RTX", kind: "Internship" }));
    expect(jobs[1]).toEqual(expect.objectContaining({ company: "RTX", kind: "New Grad" }));
  });

  it("deduplicates matching jobs and keeps all sources", () => {
    const base = {
      company: "OpenAI",
      role: "Data Science Intern 2027",
      location: "San Francisco, CA",
      category: "Data Science",
      posted: "1d",
      sponsorship: true,
      kind: "Internship" as const,
    };
    const jobs = aggregateJobs([
      [{ ...base, url: "https://zapply.jobs/openai", sources: ["zapplyjobs/New-Grad-Jobs-2027"] }],
      [{ ...base, url: "https://openai.com/careers/123", sources: ["SimplifyJobs/New-Grad-Positions"] }],
    ]);

    expect(jobs).toHaveLength(1);
    expect(jobs[0].url).toBe("https://openai.com/careers/123");
    expect(jobs[0].sources).toHaveLength(2);
  });
});
