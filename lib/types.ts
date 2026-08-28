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
  deadline?: string;
  hiddenAt?: string;
  queued?: boolean;
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

export interface JournalEntry {
  id: string;
  date: string;
  song: string;
  sight: string;
  feeling: string;
  note: string;
  pulse: number;
  tags: string[];
  fontStyle?: JournalFontStyle;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export type JournalFontStyle = "clean" | "serif" | "mono";

export interface LexiconEntry {
  id: string;
  word: string;
  ipa: string;
  phonics: string;
  fieldContext: string;
  meaning: string;
  association: string;
  example: string;
  related: string[];
  reviewCount: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export type ActivityEventType =
  | "TASK_CREATED"
  | "TASK_SCHEDULED"
  | "TASK_MOVED"
  | "TASK_DELETED"
  | "TASK_UPDATED"
  | "JOURNAL_CREATED"
  | "JOURNAL_DELETED"
  | "LEXICON_CREATED"
  | "LEXICON_UPDATED"
  | "LEXICON_DELETED";

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
  journalEntries: JournalEntry[];
  lexiconEntries: LexiconEntry[];
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
