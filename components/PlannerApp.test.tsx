import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PlannerApp } from "@/components/PlannerApp";
import { createSeedState, makeTask, savePlannerState } from "@/lib/storage";
import { todayIsoDate } from "@/lib/date";

const authMock = vi.hoisted(() => ({
  useSession: vi.fn(),
  signIn: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock("next-auth/react", () => ({
  useSession: authMock.useSession,
  signIn: authMock.signIn,
  signOut: authMock.signOut,
  SessionProvider: ({ children }: { children: ReactNode }) => children,
}));

describe("PlannerApp", () => {
  beforeEach(() => {
    vi.setSystemTime(new Date("2026-04-26T12:00:00-04:00"));
    authMock.signIn.mockClear();
    authMock.signOut.mockClear();
    authMock.useSession.mockReturnValue({
      data: { user: { email: "tester@example.com", name: "Test User" } },
      status: "authenticated",
    });
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.reject(new Error("API routes are not mounted in component tests"))),
    );
  });

  it("renders the Today Canvas, Task Backpack, and Add task button visibly by default", async () => {
    localStorage.clear();
    render(<PlannerApp />);

    expect(await screen.findByRole("heading", { name: "Today Canvas" })).toBeVisible();
    expect(screen.getByTestId("mobile-day-agenda")).toBeInTheDocument();
    expect(screen.getByTestId("task-backpack")).toBeVisible();
    expect(screen.getByRole("button", { name: "Lexicon" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Degree" })).toBeVisible();
    expect(screen.getAllByRole("button", { name: "Add task" })[0]).toBeVisible();
    expect(screen.getByPlaceholderText("Task title")).toBeVisible();
    expect(screen.queryByText("Goal cards")).not.toBeInTheDocument();
    screen.getAllByRole("group", { name: "Module" }).forEach((moduleGroup) => {
      expect(within(moduleGroup).queryByRole("button", { name: "Weekly Plan" })).not.toBeInTheDocument();
      expect(within(moduleGroup).queryByRole("button", { name: "Monthly Plan" })).not.toBeInTheDocument();
    });
  });

  it("shows a private sign-in screen when signed out", async () => {
    authMock.useSession.mockReturnValue({
      data: null,
      status: "unauthenticated",
    });
    localStorage.clear();
    const user = userEvent.setup();
    render(<PlannerApp />);

    await user.click(await screen.findByRole("button", { name: "Sign in with Google" }));

    expect(authMock.signIn).toHaveBeenCalledWith("google");
    expect(screen.getByText("Private planner")).toBeVisible();
    expect(screen.queryByRole("heading", { name: "Today Canvas" })).not.toBeInTheDocument();
  });

  it("warns when production storage is temporary and cannot sync across devices", async () => {
    localStorage.clear();
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ state: createSeedState(), storage: { durable: false } }),
    } as Response);

    render(<PlannerApp />);

    expect(await screen.findByText("No cloud sync")).toBeVisible();
    expect(screen.getByTestId("sync-notice")).toHaveTextContent("Cross-device sync is off");
  });

  it("shows a safe storage failure detail when cloud sync fails", async () => {
    localStorage.clear();
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      json: () =>
        Promise.resolve({
          error: "Planner storage is unavailable",
          detail: "Redis request failed with 401",
          storage: { durable: true, provider: "upstash-redis-prefixed-kv" },
        }),
    } as Response);

    render(<PlannerApp />);

    expect(await screen.findByText("Local backup")).toBeVisible();
    expect(screen.getByTestId("sync-notice")).toHaveTextContent("Redis request failed with 401");
  });

  it("refreshes cloud planner state on demand", async () => {
    localStorage.clear();
    const user = userEvent.setup();
    const initialState = createSeedState();
    const refreshedState = {
      ...initialState,
      tasks: [
        ...initialState.tasks,
        makeTask({
          title: "Remote desktop update",
          module: "Project",
          priority: "High",
          estimatedDurationMinutes: 60,
        }),
      ],
    };
    let getCount = 0;

    vi.mocked(fetch).mockImplementation((_input, init) => {
      if (init?.method === "PUT") {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ ok: true, storage: { durable: true } }),
        } as Response);
      }

      getCount += 1;
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            state: getCount === 1 ? initialState : refreshedState,
            storage: { durable: true },
          }),
      } as Response);
    });

    render(<PlannerApp />);

    expect(await screen.findByText("Synced")).toBeVisible();
    expect(screen.queryByText("Remote desktop update")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Refresh sync" }));

    expect(await screen.findByText("Remote desktop update")).toBeVisible();
  });

  it("uses the browser backup to seed a newly configured cloud store", async () => {
    localStorage.clear();
    const localState = createSeedState();
    const localOnlyTask = makeTask({
      title: "Local plan ready for cloud",
      module: "Project",
      priority: "High",
      estimatedDurationMinutes: 60,
    });
    savePlannerState({
      ...localState,
      tasks: [...localState.tasks, localOnlyTask],
    });

    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          state: createSeedState(),
          persisted: false,
          storage: { durable: true },
        }),
    } as Response);

    render(<PlannerApp />);

    expect(await screen.findByText("Local plan ready for cloud")).toBeVisible();

    await waitFor(() => {
      expect(vi.mocked(fetch)).toHaveBeenCalledWith(
        "/api/planner-state",
        expect.objectContaining({
          method: "PUT",
          body: expect.stringContaining("Local plan ready for cloud"),
        }),
      );
    });
  });

  it("shows an install action when the browser exposes a PWA install prompt", async () => {
    localStorage.clear();
    const user = userEvent.setup();
    const prompt = vi.fn(() => Promise.resolve());
    render(<PlannerApp />);

    window.dispatchEvent(
      Object.assign(new Event("beforeinstallprompt"), {
        prompt,
        userChoice: Promise.resolve({ outcome: "accepted", platform: "web" }),
      }),
    );

    await user.click(await screen.findByRole("button", { name: "Install TaskTrail app" }));

    expect(prompt).toHaveBeenCalled();
  });

  it("creates a backpack task with notes and records it in the visible module group", async () => {
    localStorage.clear();
    const user = userEvent.setup();
    render(<PlannerApp />);

    await user.type(await screen.findByPlaceholderText("Task title"), "Write integration tests");
    await user.type(screen.getByLabelText("Task notes"), "Cover the drag and schedule flows.");
    await user.click(screen.getAllByRole("button", { name: "Add task" })[0]);

    await waitFor(() => {
      expect(screen.getByText("Write integration tests")).toBeVisible();
    });
    expect(screen.getByText("Cover the drag and schedule flows.")).toBeVisible();
  });

  it("captures a dated vibe journal entry and keeps it off other days", async () => {
    localStorage.clear();
    const user = userEvent.setup();
    render(<PlannerApp />);

    await user.type(
      await screen.findByLabelText("Journal note"),
      "song: Holocene - Bon Iver\nsight: Late sun on Locust Walk\nfelt: tender momentum\ntags: campus, dusk\nline: The day slowed down for a second.",
    );
    await user.click(screen.getByRole("button", { name: "Auto format" }));
    await user.click(screen.getByRole("button", { name: "Save journal entry" }));

    expect(await screen.findByText("The day slowed down for a second.")).toBeVisible();
    expect(screen.getByText("Song: Holocene - Bon Iver")).toBeVisible();
    expect(screen.getByText("Sight: Late sun on Locust Walk")).toBeVisible();
    expect(screen.getByText("Felt: tender momentum")).toBeVisible();
    expect(screen.getByText("campus")).toBeVisible();
    expect(screen.getByText("dusk")).toBeVisible();

    await user.click(screen.getByRole("button", { name: "Next day" }));

    expect(screen.queryByText("The day slowed down for a second.")).not.toBeInTheDocument();
    expect(screen.getByText("No moments on this date.")).toBeVisible();
  });

  it("auto-formats a vibe journal draft and applies a font style", async () => {
    localStorage.clear();
    const user = userEvent.setup();
    render(<PlannerApp />);

    await user.click(await screen.findByRole("button", { name: "Use Serif journal font" }));
    await user.type(
      screen.getByLabelText("Journal note"),
      "song: Myth\nsight: rain on campus\nfelt: quietly brave\ntags: rain, courage\nline: keep walking",
    );
    await user.click(screen.getByRole("button", { name: "Auto format" }));
    await user.click(screen.getByRole("button", { name: "Save journal entry" }));

    expect(await screen.findByText("Keep walking.")).toBeVisible();
    expect(screen.getByText("Song: Myth")).toBeVisible();
    expect(screen.getByText("Sight: rain on campus")).toBeVisible();
    expect(screen.getByText("Felt: quietly brave")).toBeVisible();
    expect(screen.getByText("rain")).toBeVisible();
    expect(screen.getByText("courage")).toBeVisible();
    expect(screen.getAllByText("Serif").length).toBeGreaterThan(1);
  });

  it("creates a one-time task on today without leaving it in the task queue", async () => {
    localStorage.clear();
    const user = userEvent.setup();
    render(<PlannerApp />);

    await user.type(await screen.findByPlaceholderText("Task title"), "Faculty meeting");
    await user.click(screen.getByRole("button", { name: "Keep in queue" }));
    await user.click(screen.getAllByRole("button", { name: "Add once today" })[0]);

    await waitFor(() => {
      expect(screen.getAllByText("Faculty meeting").length).toBeGreaterThan(0);
    });
    expect(within(screen.getByTestId("task-backpack")).queryByText("Faculty meeting")).not.toBeInTheDocument();
  });

  it("schedules an existing task once and removes it from the task queue", async () => {
    localStorage.clear();
    const user = userEvent.setup();
    render(<PlannerApp />);

    await user.click(await screen.findByRole("button", { name: "Schedule Read paper notes once today" }));

    await waitFor(() => {
      expect(within(screen.getByTestId("task-backpack")).queryByText("Read paper notes")).not.toBeInTheDocument();
    });
  });

  it("hides and restores a backpack task without deleting scheduled blocks", async () => {
    localStorage.clear();
    const user = userEvent.setup();
    render(<PlannerApp />);

    const scheduledBefore = await screen.findAllByTestId("scheduled-task-card");
    const backpack = screen.getByTestId("task-backpack");

    await user.click(await within(backpack).findByRole("button", { name: "Hide Read paper notes from task queue" }));

    await waitFor(() => {
      expect(within(backpack).queryByText("Read paper notes")).not.toBeInTheDocument();
    });
    expect(screen.getAllByTestId("scheduled-task-card")).toHaveLength(scheduledBefore.length);

    await user.click(within(backpack).getByRole("button", { name: "Show hidden tasks" }));
    expect(await within(backpack).findByText("Read paper notes")).toBeVisible();

    await user.click(within(backpack).getByRole("button", { name: "Restore Read paper notes to task queue" }));
    await user.click(within(backpack).getByRole("button", { name: "Show active tasks" }));

    expect(await within(backpack).findByText("Read paper notes")).toBeVisible();
  });

  it("focuses the task title when Add is clicked without a title", async () => {
    localStorage.clear();
    const user = userEvent.setup();
    render(<PlannerApp />);

    await user.click((await screen.findAllByRole("button", { name: "Add task" }))[0]);

    expect(screen.getByPlaceholderText("Task title")).toHaveFocus();
  });

  it("switches to the Planning Calendar and opens the selected day in Today Canvas", async () => {
    localStorage.clear();
    const user = userEvent.setup();
    render(<PlannerApp />);

    await user.click(await screen.findByRole("button", { name: "Calendar" }));

    expect(await screen.findByRole("heading", { name: "Planning Calendar" })).toBeVisible();
    expect(screen.getByTestId("planning-calendar-view")).toBeVisible();

    await user.click(screen.getByRole("button", { name: "Open selected day in Today Canvas" }));

    expect(await screen.findByRole("heading", { name: "Today Canvas" })).toBeVisible();
    expect(screen.getByTestId("selected-date-label")).toHaveAttribute("data-date", "2026-04-26");
  });

  it("opens the DSAI degree plan as an in-app main view", async () => {
    localStorage.clear();
    const user = userEvent.setup();
    render(<PlannerApp />);

    await user.click(await screen.findByRole("button", { name: "Degree" }));

    expect(await screen.findByTestId("degree-plan-view")).toBeVisible();
    expect(screen.getByRole("heading", { name: "MSE in Data Science and AI (DSAI)" })).toBeVisible();
    expect(screen.queryByTestId("task-backpack")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Today" }));

    expect(await screen.findByRole("heading", { name: "Today Canvas" })).toBeVisible();
    expect(screen.getByTestId("task-backpack")).toBeVisible();
  });

  it("creates a simple word card with automatic IPA and local speech", async () => {
    localStorage.clear();
    const user = userEvent.setup();
    const speak = vi.fn();
    const cancel = vi.fn();
    vi.stubGlobal(
      "SpeechSynthesisUtterance",
      class {
        lang = "";
        pitch = 1;
        rate = 1;
        voice: SpeechSynthesisVoice | null = null;

        constructor(public text: string) {}
      },
    );
    vi.stubGlobal("speechSynthesis", {
      cancel,
      speak,
      getVoices: () => [{ name: "Test English", lang: "en-US" }],
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });

    render(<PlannerApp />);

    await user.click(await screen.findByRole("button", { name: "Lexicon" }));

    expect(await screen.findByTestId("lexicon-view")).toBeVisible();
    expect(screen.queryByTestId("task-backpack")).not.toBeInTheDocument();

    await user.type(screen.getByLabelText("Word"), "posterior");
    await user.click(screen.getByRole("button", { name: "Add word" }));

    const posteriorTitle = await screen.findByText("posterior");
    expect(posteriorTitle).toBeVisible();
    expect(screen.getByText("/pɑːˈstɪriər/")).toBeVisible();
    expect(screen.queryByText("Chinese meaning")).not.toBeInTheDocument();

    expect(cancel).toHaveBeenCalled();
    expect(speak).toHaveBeenCalledWith(expect.objectContaining({ text: "posterior", rate: 0.9 }));

    const posteriorCard = posteriorTitle.closest("[data-testid='lexicon-word-card']");
    expect(posteriorCard).not.toBeNull();
    await user.click(within(posteriorCard as HTMLElement).getByRole("button", { name: "Speak word" }));

    expect(speak).toHaveBeenCalledWith(expect.objectContaining({ text: "posterior", rate: 0.95 }));
  });

  it("moves lexicon words to trash and restores them", async () => {
    localStorage.clear();
    const user = userEvent.setup();
    render(<PlannerApp />);

    await user.click(await screen.findByRole("button", { name: "Lexicon" }));
    await user.type(screen.getByLabelText("Word"), "posterior");
    await user.click(screen.getByRole("button", { name: "Add word" }));

    expect(await screen.findByText("posterior")).toBeVisible();

    await user.click(screen.getByRole("button", { name: "Move posterior to trash" }));

    await waitFor(() => {
      expect(screen.queryByText("posterior")).not.toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Trash words" }));

    expect(await screen.findByText("posterior")).toBeVisible();

    await user.click(screen.getByRole("button", { name: "Restore posterior" }));

    await waitFor(() => {
      expect(screen.queryByText("posterior")).not.toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Active words" }));

    expect(await screen.findByText("posterior")).toBeVisible();
  });

  it("opens a clicked calendar day directly in the matching Today Canvas", async () => {
    localStorage.clear();
    const user = userEvent.setup();
    render(<PlannerApp />);

    await user.click(await screen.findByRole("button", { name: "Calendar" }));
    await user.click(await screen.findByRole("button", { name: "Open 2026-04-27 in Today Canvas" }));

    expect(await screen.findByRole("heading", { name: "Today Canvas" })).toBeVisible();
    expect(screen.getByTestId("selected-date-label")).toHaveAttribute("data-date", "2026-04-27");
  });

  it("imports updated CIS course meetings into the Today Canvas and Planning Calendar", async () => {
    vi.setSystemTime(new Date("2026-08-25T12:00:00-04:00"));
    localStorage.clear();
    const user = userEvent.setup();
    render(<PlannerApp />);

    fireEvent.change(await screen.findByLabelText("Jump to date"), { target: { value: "2026-08-27" } });

    await waitFor(() => {
      expect(screen.getAllByText("CIS 5210 Artificial Intelligence").length).toBeGreaterThan(0);
    });
    expect(screen.getAllByText("12:00-13:29").length).toBeGreaterThan(0);
    expect(screen.getAllByText("DDL 2026-12-07").length).toBeGreaterThan(0);
    expect(screen.getAllByText("CIS 5810 Computer Vision & Computational Photography").length).toBeGreaterThan(0);
    expect(screen.queryByText("CIS 6250 Theory of Machine Learning")).not.toBeInTheDocument();
    expect(screen.queryByText("CIS 5450 Big Data Analytics")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Calendar" }));

    const selectedDay = await screen.findByTestId("planning-day-2026-08-27");
    expect(within(selectedDay).getByText("CIS 5210 Artificial Intelligence")).toBeVisible();
    expect(within(selectedDay).getByText("CIS 5810 Computer Vision & Computational Photography")).toBeVisible();
    expect(screen.queryByText("CIS 6250 Theory of Machine Learning")).not.toBeInTheDocument();
    expect(screen.queryByText("CIS 5450 Big Data Analytics")).not.toBeInTheDocument();
    expect(screen.getAllByText("DDL 2026-12-07").length).toBeGreaterThan(0);

    await user.click(await screen.findByRole("button", { name: "Open 2026-08-26 in Today Canvas" }));

    expect(await screen.findByRole("heading", { name: "Today Canvas" })).toBeVisible();
    expect(screen.getAllByText("CIS 5800 Machine Perception").length).toBeGreaterThan(0);
    expect(screen.getAllByText("12:00-13:29").length).toBeGreaterThan(0);
    expect(screen.queryByText("CIS 6250 Theory of Machine Learning")).not.toBeInTheDocument();
  });

  it("imports CIS 5810 assignment due dates into Today and Calendar", async () => {
    vi.setSystemTime(new Date("2026-08-25T12:00:00-04:00"));
    localStorage.clear();
    const user = userEvent.setup();
    render(<PlannerApp />);

    fireEvent.change(await screen.findByLabelText("Jump to date"), { target: { value: "2026-08-31" } });

    await waitFor(() => {
      expect(screen.getAllByText("CIS 5810 Project 1: Dolly Zoom").length).toBeGreaterThan(0);
    });
    expect(screen.getAllByText("23:00-23:59").length).toBeGreaterThan(0);
    expect(screen.getAllByText("DDL 2026-08-31").length).toBeGreaterThan(0);

    await user.click(screen.getByRole("button", { name: "Calendar" }));

    const selectedDay = await screen.findByTestId("planning-day-2026-08-31");
    expect(within(selectedDay).getByTitle("CIS 5810 Project 1: Dolly Zoom")).toBeVisible();

    await user.click(await screen.findByRole("button", { name: "Next month" }));
    await user.click(await screen.findByRole("button", { name: "Next month" }));
    await user.click(await screen.findByRole("button", { name: "Next month" }));
    await user.click(await screen.findByRole("button", { name: "Open 2026-11-09 in Today Canvas" }));

    expect(await screen.findByRole("heading", { name: "Today Canvas" })).toBeVisible();
    expect(screen.getAllByText("CIS 5810 Project 7: Hand Pose Estimation").length).toBeGreaterThan(0);
    expect(screen.getAllByText("DDL 2026-11-09").length).toBeGreaterThan(0);
  });

  it("imports Fall 2026 Penn events into the Today Canvas and Planning Calendar", async () => {
    vi.setSystemTime(new Date("2026-08-25T12:00:00-04:00"));
    localStorage.clear();
    const user = userEvent.setup();
    render(<PlannerApp />);

    fireEvent.change(await screen.findByLabelText("Jump to date"), { target: { value: "2026-09-11" } });

    await waitFor(() => {
      expect(screen.getAllByText("Graduate Workshop: Meet and Greet with Penn Engineering Faculty").length).toBeGreaterThan(0);
    });
    expect(screen.getAllByText("16:00-17:00").length).toBeGreaterThan(0);
    expect(screen.getAllByText("DDL 2026-09-11").length).toBeGreaterThan(0);

    fireEvent.change(screen.getByLabelText("Jump to date"), { target: { value: "2026-09-04" } });
    await waitFor(() => {
      expect(screen.getAllByText("DSGA Social & Elections Welcome Back Social").length).toBeGreaterThan(0);
    });

    await user.click(screen.getByRole("button", { name: "Calendar" }));
    await user.click(await screen.findByRole("button", { name: "Open 2026-09-16 in Today Canvas" }));

    expect(await screen.findByRole("heading", { name: "Today Canvas" })).toBeVisible();
    expect(screen.getAllByText("Engineering & Technology Career Fair: In Person").length).toBeGreaterThan(0);
    expect(screen.getAllByText("DDL 2026-09-16").length).toBeGreaterThan(0);
  });

  it("imports the Fall 2026 lab semester plan into the queue and calendar", async () => {
    vi.setSystemTime(new Date("2026-08-25T12:00:00-04:00"));
    localStorage.clear();
    const user = userEvent.setup();
    render(<PlannerApp />);

    expect((await screen.findAllByText("Semester lab plan: Gu + WAVES roadmap")).length).toBeGreaterThan(0);
    expect(screen.getAllByText("Jiatao Gu: paper map + pitch angle").length).toBeGreaterThan(0);
    expect(screen.getAllByText("WAVES Lab: RF/acoustic/vision paper map").length).toBeGreaterThan(0);
    expect(screen.getAllByText("DDL 2026-08-30").length).toBeGreaterThan(0);

    await user.click(screen.getByRole("button", { name: "Calendar" }));
    await user.click(await screen.findByRole("button", { name: "Next month" }));
    await user.click(await screen.findByRole("button", { name: "Open 2026-09-10 in Today Canvas" }));

    expect(await screen.findByRole("heading", { name: "Today Canvas" })).toBeVisible();
    expect(screen.getAllByText("Jiatao Gu: multimodal foundation mini result").length).toBeGreaterThan(0);
    expect(screen.getAllByText("DDL 2026-09-20").length).toBeGreaterThan(0);
  });

  it("switches the canvas date with previous, today, next, and direct jump controls", async () => {
    localStorage.clear();
    const user = userEvent.setup();
    render(<PlannerApp />);

    expect(await screen.findByTestId("selected-date-label")).toHaveAttribute("data-date", "2026-04-26");

    await user.click(screen.getByRole("button", { name: "Next day" }));
    expect(screen.getByTestId("selected-date-label")).toHaveAttribute("data-date", "2026-04-27");

    await user.click(screen.getByRole("button", { name: "Previous day" }));
    expect(screen.getByTestId("selected-date-label")).toHaveAttribute("data-date", "2026-04-26");

    await user.click(screen.getByRole("button", { name: "Next day" }));
    await user.click(screen.getByRole("button", { name: "Go to today" }));
    expect(screen.getByTestId("selected-date-label")).toHaveAttribute("data-date", "2026-04-26");

    fireEvent.change(screen.getByLabelText("Jump to date"), { target: { value: "2026-05-03" } });
    expect(screen.getByTestId("selected-date-label")).toHaveAttribute("data-date", "2026-05-03");
  });

  it("derives priority columns from the selected date and shrinks on an empty day", async () => {
    localStorage.clear();
    const seeded = createSeedState();
    const today = todayIsoDate();
    const baseBlock = seeded.scheduleBlocks.find((block) => block.date === today) ?? seeded.scheduleBlocks[0];
    savePlannerState({
      ...seeded,
      scheduleBlocks: [
        ...seeded.scheduleBlocks,
        {
          ...baseBlock,
          id: "test_fourth_column",
          date: today,
          columnIndex: 3,
          timeSlot: "15:00",
        },
      ],
    });
    const user = userEvent.setup();
    render(<PlannerApp />);

    await waitFor(() => {
      expect(screen.getByTestId("column-count-label")).toHaveTextContent("4/4 priority columns");
    });

    await user.click(screen.getByRole("button", { name: "Next day" }));

    await waitFor(() => {
      expect(screen.getByTestId("column-count-label")).toHaveTextContent("1/4 priority columns");
    });

    await user.click(screen.getByRole("button", { name: "Previous day" }));
    await waitFor(() => {
      expect(screen.getByTestId("column-count-label")).toHaveTextContent("4/4 priority columns");
    });
  });

  it("schedules a backpack task from a normal click target without requiring drag and drop", async () => {
    localStorage.clear();
    const user = userEvent.setup();
    render(<PlannerApp />);

    const before = await screen.findAllByTestId("scheduled-task-card");
    await user.click(screen.getByRole("button", { name: "Schedule Portfolio outreach today" }));

    await waitFor(() => {
      expect(screen.getAllByTestId("scheduled-task-card").length).toBe(before.length + 1);
    });
  });

  it("schedules a backpack task onto a picked date without mobile drag and drop", async () => {
    localStorage.clear();
    const user = userEvent.setup();
    render(<PlannerApp />);

    fireEvent.change(await screen.findByLabelText("Backpack schedule date"), {
      target: { value: "2026-05-03" },
    });

    expect(screen.getByTestId("selected-date-label")).toHaveAttribute("data-date", "2026-05-03");
    expect(screen.queryAllByTestId("scheduled-task-card")).toHaveLength(0);

    const scheduleButton = screen
      .getAllByRole("button", { name: /Schedule Portfolio outreach/i })
      .find((button) => !button.getAttribute("aria-label")?.includes("once"));

    expect(scheduleButton).toBeDefined();
    await user.click(scheduleButton!);

    await waitFor(() => {
      expect(screen.getByTestId("selected-date-label")).toHaveAttribute("data-date", "2026-05-03");
      expect(screen.getAllByTestId("scheduled-task-card").length).toBe(1);
    });
  });

  it("removes a scheduled task with the enlarged schedule remove action", async () => {
    localStorage.clear();
    const user = userEvent.setup();
    render(<PlannerApp />);

    const before = await screen.findAllByTestId("scheduled-task-card");
    await user.click(screen.getByRole("button", { name: "Remove Build TaskTrail drag MVP from schedule" }));

    await waitFor(() => {
      expect(screen.getAllByTestId("scheduled-task-card").length).toBe(before.length - 1);
    });
  });

  it("uses the same task backpack queue on mobile and desktop layouts", async () => {
    localStorage.clear();
    render(<PlannerApp />);

    expect(await screen.findByRole("heading", { name: "Task queue" })).toBeVisible();
    expect(screen.queryByText("Presets")).not.toBeInTheDocument();
    expect(screen.queryByText("Existing tasks")).not.toBeInTheDocument();
  });

  it("exposes whole task cards as draggable targets, not only the grip icon", async () => {
    localStorage.clear();
    render(<PlannerApp />);

    const backpackCards = await screen.findAllByTestId("backpack-task-card");
    const scheduledCards = await screen.findAllByTestId("scheduled-task-card");

    expect(backpackCards[0]).toHaveAttribute("aria-roledescription", "draggable");
    expect(backpackCards[0]).toHaveClass("cursor-grab");
    expect(scheduledCards[0]).toHaveAttribute("aria-roledescription", "draggable");
    expect(scheduledCards[0]).toHaveClass("cursor-grab");
  });

  it("collapses and expands the Backpack from a normal button click", async () => {
    localStorage.clear();
    const user = userEvent.setup();
    render(<PlannerApp />);

    await user.click(await screen.findByRole("button", { name: "Collapse backpack" }));
    expect(screen.queryByPlaceholderText("Task title")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Expand backpack" }));
    expect(await screen.findByPlaceholderText("Task title")).toBeVisible();
  });
});
