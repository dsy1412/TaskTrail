import { addDaysIso, todayIsoDate } from "@/lib/date";
import type {
  ActivityEvent,
  ActivityEventType,
  ModuleName,
  PlannerState,
  Priority,
  ScheduleBlock,
  Task,
} from "@/lib/types";

const STORAGE_KEY = "tasktrail.mvp.state.v1";

function id(prefix: string) {
  return `${prefix}_${crypto.randomUUID()}`;
}

function now() {
  return new Date().toISOString();
}

function seedTimestamp(date: string, hour = "08:00") {
  return `${date}T${hour}:00.000Z`;
}

export function createEvent(
  type: ActivityEventType,
  payload: Record<string, unknown>,
  taskId?: string,
  scheduleBlockId?: string,
): ActivityEvent {
  return {
    id: id("evt"),
    type,
    taskId,
    scheduleBlockId,
    payload,
    createdAt: now(),
  };
}

function seedTask(
  seedId: string,
  title: string,
  module: ModuleName,
  priority: Priority,
  estimatedDurationMinutes: number,
  createdAt: string,
  notes = "",
): Task {
  return {
    id: seedId,
    title,
    module,
    priority,
    estimatedDurationMinutes,
    notes,
    createdAt,
  };
}

function seedBlock(
  seedId: string,
  task: Task,
  date: string,
  timeSlot: string,
  columnIndex: number,
): ScheduleBlock {
  const createdAt = seedTimestamp(date, timeSlot);
  return {
    id: seedId,
    taskId: task.id,
    date,
    timeSlot,
    columnIndex,
    durationMinutes: task.estimatedDurationMinutes,
    createdAt,
    updatedAt: createdAt,
  };
}

export function createSeedState(): PlannerState {
  const today = todayIsoDate();
  const yesterday = addDaysIso(today, -1);
  const twoDaysAgo = addDaysIso(today, -2);
  const createdAt = seedTimestamp(twoDaysAgo);

  const tasks = [
    seedTask("seed_study", "Read paper notes", "Study", "Medium", 60, createdAt, "Capture three reusable ideas."),
    seedTask("seed_project", "Build TaskTrail drag MVP", "Project", "High", 120, createdAt, "Canvas first, polish second."),
    seedTask("seed_health", "Tempo run", "Health", "Medium", 45, createdAt, "Keep it light and consistent."),
    seedTask("seed_career", "Portfolio outreach", "Career", "High", 40, createdAt, "Send two focused messages."),
    seedTask("seed_weekly", "Weekly outcome review", "Weekly Plan", "Medium", 30, createdAt, "Compare plan with trail."),
    seedTask("seed_monthly", "Ship April planning loop", "Monthly Plan", "High", 60, createdAt, "Prepare backend-ready scope."),
  ];

  const scheduleBlocks = [
    seedBlock("seed_block_project_1", tasks[1], twoDaysAgo, "10:00", 0),
    seedBlock("seed_block_project_2", tasks[1], yesterday, "10:00", 0),
    seedBlock("seed_block_project_3", tasks[1], today, "09:00", 0),
    seedBlock("seed_block_study_1", tasks[0], today, "13:00", 0),
    seedBlock("seed_block_health_1", tasks[2], yesterday, "18:00", 0),
    seedBlock("seed_block_health_2", tasks[2], today, "18:00", 0),
  ];

  const events = [
    ...tasks.map((task, index) => ({
      id: `seed_event_task_${index}`,
      type: "TASK_CREATED" as const,
      taskId: task.id,
      payload: { task },
      createdAt,
    })),
    ...scheduleBlocks.map((block) =>
      ({
        id: `seed_event_${block.id}`,
        type: "TASK_SCHEDULED" as const,
        taskId: block.taskId,
        scheduleBlockId: block.id,
        payload: { block },
        createdAt: block.createdAt,
      }),
    ),
  ];

  return { tasks, scheduleBlocks, events };
}

export function loadPlannerState(): PlannerState {
  if (typeof window === "undefined") return createSeedState();

  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    const seed = createSeedState();
    savePlannerState(seed);
    return seed;
  }

  try {
    const parsed = JSON.parse(stored) as PlannerState;
    if (
      Array.isArray(parsed.tasks) &&
      parsed.tasks.some((task) => !task.deletedAt) &&
      Array.isArray(parsed.events)
    ) {
      return parsed;
    }

    const seed = createSeedState();
    savePlannerState(seed);
    return seed;
  } catch {
    const seed = createSeedState();
    savePlannerState(seed);
    return seed;
  }
}

export function savePlannerState(state: PlannerState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function makeTask(input: {
  title: string;
  module: ModuleName;
  priority: Priority;
  estimatedDurationMinutes: number;
  notes?: string;
}): Task {
  return {
    id: id("task"),
    title: input.title.trim() || "Untitled task",
    module: input.module,
    priority: input.priority,
    estimatedDurationMinutes: Math.max(15, input.estimatedDurationMinutes || 60),
    notes: input.notes?.trim() ?? "",
    createdAt: now(),
  };
}

export function makeScheduleBlock(
  task: Task,
  input: {
    date: string;
    timeSlot: string;
    columnIndex: number;
  },
): ScheduleBlock {
  return {
    id: id("block"),
    taskId: task.id,
    date: input.date,
    timeSlot: input.timeSlot,
    columnIndex: input.columnIndex,
    durationMinutes: task.estimatedDurationMinutes,
    createdAt: now(),
    updatedAt: now(),
  };
}

export function timestamp() {
  return now();
}
