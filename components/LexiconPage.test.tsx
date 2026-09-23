import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LexiconPage } from "@/components/LexiconPage";
import { makeLexiconEntry } from "@/lib/storage";
import type { PlannerState } from "@/lib/types";

const emptyState: PlannerState = {
  tasks: [],
  scheduleBlocks: [],
  events: [],
  journalEntries: [],
  jobApplications: [],
  lexiconEntries: [],
};

describe("LexiconPage online enrichment", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  it("adds an unknown word with online IPA, Chinese meaning, and translated example", async () => {
    vi.mocked(fetch).mockResolvedValue(lookupResponse());
    const onCreateEntry = vi.fn();
    const user = userEvent.setup();

    render(
      <LexiconPage
        state={emptyState}
        onCreateEntry={onCreateEntry}
        onUpdateEntry={vi.fn()}
        onDeleteEntry={vi.fn()}
        onRestoreEntry={vi.fn()}
        canEdit
      />,
    );

    await user.type(screen.getByLabelText("Word or sentence"), "philosophy");
    await user.click(screen.getByRole("button", { name: "Add word" }));

    await waitFor(() => expect(onCreateEntry).toHaveBeenCalledWith(expect.objectContaining({
      word: "philosophy",
      ipa: "/fəˈlɑːsəfi/",
      meaning: "哲学；通过推理研究知识和存在。",
      example: "She studies philosophy.",
      exampleTranslation: "她学习哲学。",
    })));
    expect(screen.getByRole("status")).toHaveTextContent("Added with online notes and translation.");
  });

  it("completes an existing empty card without replacing its title", async () => {
    vi.mocked(fetch).mockResolvedValue(lookupResponse());
    const entry = makeLexiconEntry({ word: "philosophy" });
    const onUpdateEntry = vi.fn();
    const user = userEvent.setup();

    render(
      <LexiconPage
        state={{ ...emptyState, lexiconEntries: [entry] }}
        onCreateEntry={vi.fn()}
        onUpdateEntry={onUpdateEntry}
        onDeleteEntry={vi.fn()}
        onRestoreEntry={vi.fn()}
        canEdit
      />,
    );

    await user.click(screen.getByRole("button", { name: "Complete notes for philosophy" }));

    await waitFor(() => expect(onUpdateEntry).toHaveBeenCalledWith(entry.id, expect.objectContaining({
      ipa: "/fəˈlɑːsəfi/",
      meaning: "哲学；通过推理研究知识和存在。",
      exampleTranslation: "她学习哲学。",
    })));
  });
});

function lookupResponse() {
  return {
    ok: true,
    json: () => Promise.resolve({
      ipa: "/fəˈlɑːsəfi/",
      fieldContext: "Online dictionary and translation",
      meaning: "哲学；通过推理研究知识和存在。",
      example: "She studies philosophy.",
      exampleTranslation: "她学习哲学。",
      related: ["thought"],
      warning: "",
    }),
  } as Response;
}
