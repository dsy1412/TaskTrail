import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FocusTrail } from "@/components/FocusTrail";
import { createSeedState } from "@/lib/storage";

describe("FocusTrail", () => {
  beforeEach(() => {
    vi.setSystemTime(new Date("2026-04-26T12:00:00-04:00"));
  });

  it("renders a real month calendar with daily completed task details", async () => {
    const user = userEvent.setup();
    render(<FocusTrail state={createSeedState()} />);

    await user.click(screen.getByRole("button", { name: "month" }));

    expect(screen.getByTestId("month-activity-calendar")).toBeVisible();
    expect(screen.getByText("April 2026")).toBeVisible();
    expect(screen.getByText("3 active days")).toBeVisible();
    expect(screen.getByText("6 completed blocks")).toBeVisible();

    await user.click(screen.getByRole("button", { name: "View 2026-04-26 activity" }));

    const detail = screen.getByTestId("selected-month-day-detail");
    expect(within(detail).getByText("Read paper notes")).toBeVisible();
    expect(within(detail).getByText("Tempo run")).toBeVisible();
    expect(within(detail).getByText("Build TaskTrail drag MVP")).toBeVisible();
  });
});
