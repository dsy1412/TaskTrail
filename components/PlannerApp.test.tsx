import { render, screen, waitFor } from "@testing-library/react";
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
  });

  it("shows a top-right Google sign-in action when signed out", async () => {
    authMock.useSession.mockReturnValue({
      data: null,
      status: "unauthenticated",
    });
    localStorage.clear();
    const user = userEvent.setup();
    render(<PlannerApp />);

    await user.click(await screen.findByRole("button", { name: "Sign in with Google" }));

    expect(authMock.signIn).toHaveBeenCalledWith("google");
    expect(screen.getByText("Read-only preview")).toBeVisible();
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

  it("creates a backpack task and records it in the visible module group", async () => {
    localStorage.clear();
    const user = userEvent.setup();
    render(<PlannerApp />);

    await user.type(await screen.findByPlaceholderText("Task title"), "Write integration tests");
    await user.click(screen.getAllByRole("button", { name: "Add task" })[0]);

    await waitFor(() => {
      expect(screen.getByText("Write integration tests")).toBeVisible();
    });
  });

  it("focuses the task title when Add is clicked without a title", async () => {
    localStorage.clear();
    const user = userEvent.setup();
    render(<PlannerApp />);

    await user.click((await screen.findAllByRole("button", { name: "Add task" }))[0]);

    expect(screen.getByPlaceholderText("Task title")).toHaveFocus();
  });

  it("switches to Focus Trail without losing the Backpack controls", async () => {
    localStorage.clear();
    const user = userEvent.setup();
    render(<PlannerApp />);

    await user.click(await screen.findByRole("button", { name: "Focus Trail" }));

    expect(await screen.findByRole("heading", { name: "Focus Trail" })).toBeVisible();
    expect(screen.getByTestId("task-backpack")).toBeVisible();
    expect(screen.getAllByRole("button", { name: "Add task" })[0]).toBeVisible();
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

  it("switches the canvas date with previous, today, and next controls", async () => {
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

  it("creates and schedules a mobile preset task in one tap", async () => {
    localStorage.clear();
    const user = userEvent.setup();
    render(<PlannerApp />);

    const before = await screen.findAllByTestId("scheduled-task-card");
    await user.click(screen.getByRole("button", { name: "Add preset Deep work block" }));

    await waitFor(() => {
      expect(screen.getAllByTestId("scheduled-task-card").length).toBe(before.length + 1);
    });
    expect(screen.getByRole("button", { name: "Expand backpack" })).toBeVisible();
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
