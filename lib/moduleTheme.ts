import type { ModuleName } from "@/lib/types";

export const moduleTheme: Record<
  ModuleName,
  {
    color: string;
    text: string;
    soft: string;
    border: string;
  }
> = {
  Study: {
    color: "#06b6d4",
    text: "text-cyan-700",
    soft: "bg-cyan-50",
    border: "border-cyan-200",
  },
  Project: {
    color: "#6366f1",
    text: "text-indigo-700",
    soft: "bg-indigo-50",
    border: "border-indigo-200",
  },
  Health: {
    color: "#10b981",
    text: "text-emerald-700",
    soft: "bg-emerald-50",
    border: "border-emerald-200",
  },
  Career: {
    color: "#f43f5e",
    text: "text-rose-700",
    soft: "bg-rose-50",
    border: "border-rose-200",
  },
  "Weekly Plan": {
    color: "#f59e0b",
    text: "text-amber-700",
    soft: "bg-amber-50",
    border: "border-amber-200",
  },
  "Monthly Plan": {
    color: "#14b8a6",
    text: "text-teal-700",
    soft: "bg-teal-50",
    border: "border-teal-200",
  },
};
