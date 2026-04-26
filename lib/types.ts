export const MODULES = [
  "Study",
  "Project",
  "Health",
  "Career",
  "Weekly Plan",
  "Monthly Plan",
] as const;

export type ModuleName = (typeof MODULES)[number];

export type Priority = "Low" | "Medium" | "High";

export interface Task {
  id: string;
  title: string;
  module: ModuleName;
  priority: Priority;
  estimatedDurationMinutes: number;
  notes: string;
  createdAt: string;
  deletedAt?: string;
}

export interface ScheduleBlock {
  id: string;
  taskId: string;
  date: string;
  timeSlot: string;
  columnIndex: number;
  durationMinutes: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export type ActivityEventType =
  | "TASK_CREATED"
  | "TASK_SCHEDULED"
  | "TASK_MOVED"
  | "TASK_DELETED"
  | "TASK_UPDATED";

export interface ActivityEvent {
  id: string;
  type: ActivityEventType;
  taskId?: string;
  scheduleBlockId?: string;
  payload: Record<string, unknown>;
  createdAt: string;
}

export interface FocusTrailSegment {
  id: string;
  label: string;
  module: ModuleName;
  startDate: string;
  endDate: string;
  activeDates: string[];
  streakLength: number;
}

export interface PlannerState {
  tasks: Task[];
  scheduleBlocks: ScheduleBlock[];
  events: ActivityEvent[];
}

export interface ParsedTaskInput {
  title: string;
  module: ModuleName;
  priority: Priority;
  estimatedDurationMinutes: number;
  notes: string;
  date?: string;
  time?: string;
}
