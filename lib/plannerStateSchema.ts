import type { PlannerState } from "@/lib/types";

export function isPlannerState(value: unknown): value is PlannerState {
  if (!value || typeof value !== "object") return false;

  const candidate = value as Partial<PlannerState>;
  return (
    Array.isArray(candidate.tasks) &&
    Array.isArray(candidate.scheduleBlocks) &&
    Array.isArray(candidate.events)
  );
}
