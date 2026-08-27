import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { DegreePlanPage } from "@/components/DegreePlanPage";

const authMock = vi.hoisted(() => ({
  useSession: vi.fn(),
  signIn: vi.fn(),
}));

vi.mock("next-auth/react", () => ({
  useSession: authMock.useSession,
  signIn: authMock.signIn,
  SessionProvider: ({ children }: { children: ReactNode }) => children,
}));

describe("DegreePlanPage", () => {
  it("shows the DSAI AI concentration structure after sign-in", () => {
    authMock.useSession.mockReturnValue({
      data: { user: { email: "tester@example.com" } },
      status: "authenticated",
    });

    render(<DegreePlanPage />);

    expect(screen.getByRole("heading", { name: "MSE in Data Science and AI (DSAI)" })).toBeVisible();
    expect(screen.getByText("Artificial Intelligence Concentration - 10 CU total")).toBeVisible();
    expect(screen.getByText("Total requirement")).toBeVisible();
    expect(screen.getByText("Linear Algebra or Convex Optimization")).toBeVisible();
    expect(screen.getByText("CIS 5150")).toBeVisible();
  });

  it("switches sections and searches courses on a compact control surface", async () => {
    authMock.useSession.mockReturnValue({
      data: { user: { email: "tester@example.com" } },
      status: "authenticated",
    });
    const user = userEvent.setup();
    render(<DegreePlanPage />);

    await user.click(screen.getByRole("button", { name: "Electives" }));

    expect(screen.getByText("Machine Learning, Multi-modal AI and Data Analysis")).toBeVisible();
    expect(screen.getByText("For the AI concentration, at least 2 CU should come from this bucket.")).toBeVisible();

    await user.type(screen.getByLabelText("Search degree courses"), "CIS 6250");

    const results = screen.getByRole("heading", { name: "Search Results" }).closest("section");
    expect(results).not.toBeNull();
    expect(within(results!).getAllByText("CIS 6250").length).toBeGreaterThan(0);
    expect(within(results!).getByText("Theory of Machine Learning / Computational Learning Theory")).toBeVisible();
  });

  it("keeps the page private when signed out", async () => {
    authMock.useSession.mockReturnValue({
      data: null,
      status: "unauthenticated",
    });
    const user = userEvent.setup();
    render(<DegreePlanPage />);

    await user.click(screen.getByRole("button", { name: "Sign in with Google" }));

    expect(authMock.signIn).toHaveBeenCalledWith("google");
    expect(screen.getByText("Private degree plan")).toBeVisible();
  });
});
