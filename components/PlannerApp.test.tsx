import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PlannerApp } from "@/components/PlannerApp";
import { createSeedState, savePlannerState } from "@/lib/storage";
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

  it("opens a clicked calendar day directly in the matching Today Canvas", async () => {
    localStorage.clear();
    const user = userEvent.setup();
    render(<PlannerApp />);

    await user.click(await screen.findByRole("button", { name: "Calendar" }));
    await user.click(await screen.findByRole("button", { name: "Open 2026-04-27 in Today Canvas" }));

    expect(await screen.findByRole("heading", { name: "Today Canvas" })).toBeVisible();
    expect(screen.getByTestId("selected-date-label")).toHaveAttribute("data-date", "2026-04-27");
  });

  it("imports CIS course meetings into the Today Canvas and Planning Calendar", async () => {
    vi.setSystemTime(new Date("2026-08-25T12:00:00-04:00"));
    localStorage.clear();
    const user = userEvent.setup();
    render(<PlannerApp />);

    fireEvent.change(await screen.findByLabelText("Jump to date"), { target: { value: "2026-08-26" } });

    await waitFor(() => {
      expect(screen.getAllByText("CIS 6250 Theory of Machine Learning").length).toBeGreaterThan(0);
    });
    expect(screen.getAllByText("10:15-11:44").length).toBeGreaterThan(0);
    expect(screen.getAllByText("DDL 2026-12-07").length).toBeGreaterThan(0);

    await user.click(screen.getByRole("button", { name: "Calendar" }));

    const selectedDay = await screen.findByTestId("planning-day-2026-08-26");
    expect(within(selectedDay).getByText("CIS 6250 Theory of Machine Learning")).toBeVisible();
    expect(screen.getAllByText("CIS 5800 Machine Perception").length).toBeGreaterThan(0);
    expect(screen.getAllByText("CIS 5450 Big Data Analytics").length).toBeGreaterThan(0);
    expect(screen.getAllByText("DDL 2026-12-07").length).toBeGreaterThan(0);
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
