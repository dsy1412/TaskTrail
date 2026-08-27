import type { Task } from "@/lib/types";

export interface TaskAccent {
  color: string;
  softColor: string;
  foreground: string;
}

export function taskAccent(task: Pick<Task, "id" | "title">): TaskAccent {
  if (task.id.startsWith("cis5810_assignment_task_")) {
    return {
      color: "#ef4444",
      softColor: "rgba(239, 68, 68, 0.18)",
      foreground: "#020617",
    };
  }

  const hash = hashString(`${task.id}:${task.title}`);
  const hue = (hash * 137) % 360;

  return {
    color: `hsl(${hue}, 86%, 64%)`,
    softColor: `hsla(${hue}, 86%, 64%, 0.14)`,
    foreground: "#020617",
  };
}

function hashString(value: string) {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}
