import type { ActivityEvent, PlannerState, Priority, ScheduleBlock, Task } from "@/lib/types";

const CIS5210_ASSIGNMENT_IMPORT_EVENT_ID = "cis5210_fall_2026_assignments_import_v1";
const CIS5210_ASSIGNMENT_SOURCE = "cis5210_fall_2026_gradescope_assignments";
const CIS5210_ASSIGNMENT_CREATED_AT = "2026-09-03T12:00:00.000Z";

const cis5210Assignments = [
  {
    id: "homework_1_python_skills",
    title: "CIS 5210 Homework 1: Python Skills",
    availableText: "Available Jul 24 at 12:00am",
    dueDate: "2026-09-02",
    lateDueDate: "2026-09-10",
    status: "Submitted",
  },
  {
    id: "homework_2_uninformed_search",
    title: "CIS 5210 Homework 2: Uninformed Search",
    availableText: "Available Jul 24 at 12:00am",
    dueDate: "2026-09-09",
    lateDueDate: "2026-09-18",
    status: "No Submission",
  },
  {
    id: "homework_3_informed_search",
    title: "CIS 5210 Homework 3: Informed Search",
    availableText: "Available Jul 24 at 12:00am",
    dueDate: "2026-09-16",
    lateDueDate: "2026-09-24",
    status: "No Submission",
  },
  {
    id: "homework_4_adversarial_games",
    title: "CIS 5210 Homework 4: Adversarial Games",
    availableText: "Available Jul 24 at 12:00am",
    dueDate: "2026-09-23",
    lateDueDate: "2026-10-01",
    status: "No Submission",
  },
  {
    id: "homework_5_sudoku_games",
    title: "CIS 5210 Homework 5: Sudoku Games",
    availableText: "Available Aug 31 at 12:00am",
    dueDate: "2026-09-30",
    lateDueDate: "2026-10-08",
    status: "No Submission",
  },
] satisfies Cis5210Assignment[];

export function withCis5210Assignments(state: PlannerState) {
  const existingTaskIds = new Set(state.tasks.map((task) => task.id));
  const existingBlockIds = new Set(state.scheduleBlocks.map((block) => block.id));
  const existingEventIds = new Set(state.events.map((event) => event.id));
  const tasksToAdd: Task[] = [];
  const blocksToAdd: ScheduleBlock[] = [];
  const eventsToAdd: ActivityEvent[] = [];

  function addEvent(event: ActivityEvent) {
    if (existingEventIds.has(event.id)) return;
    existingEventIds.add(event.id);
    eventsToAdd.push(event);
  }

  cis5210Assignments.forEach((assignment) => {
    const task = makeAssignmentTask(assignment);
    if (!existingTaskIds.has(task.id)) {
      tasksToAdd.push(task);
      addEvent({
        id: `cis5210_assignment_event_created_${assignment.id}`,
        type: "TASK_CREATED",
        taskId: task.id,
        payload: { task, source: CIS5210_ASSIGNMENT_SOURCE, term: "Fall 2026", deadline: assignment.dueDate },
        createdAt: CIS5210_ASSIGNMENT_CREATED_AT,
      });
    }

    const block = makeAssignmentBlock(assignment, task);
    if (!existingBlockIds.has(block.id)) {
      blocksToAdd.push(block);
      addEvent({
        id: `cis5210_assignment_event_scheduled_${assignment.id}`,
        type: "TASK_SCHEDULED",
        taskId: task.id,
        scheduleBlockId: block.id,
        payload: { block, source: CIS5210_ASSIGNMENT_SOURCE, term: "Fall 2026", deadline: assignment.dueDate },
        createdAt: block.createdAt,
      });
    }
  });

  addEvent({
    id: CIS5210_ASSIGNMENT_IMPORT_EVENT_ID,
    type: "TASK_UPDATED",
    payload: {
      source: CIS5210_ASSIGNMENT_SOURCE,
      term: "Fall 2026",
      assignmentCount: cis5210Assignments.length,
    },
    createdAt: CIS5210_ASSIGNMENT_CREATED_AT,
  });

  return {
    ...state,
    tasks: [...state.tasks, ...tasksToAdd],
    scheduleBlocks: [...state.scheduleBlocks, ...blocksToAdd],
    events: [...state.events, ...eventsToAdd],
  };
}

interface Cis5210Assignment {
  id: string;
  title: string;
  availableText: string;
  dueDate: string;
  lateDueDate: string;
  status: "Submitted" | "No Submission";
}

function makeAssignmentTask(assignment: Cis5210Assignment): Task {
  return {
    id: `cis5210_assignment_task_${assignment.id}`,
    title: assignment.title,
    module: "Study",
    priority: "High" satisfies Priority,
    estimatedDurationMinutes: 59,
    notes: `Fall 2026 CIS 5210 homework. ${assignment.availableText}. Due ${assignment.dueDate} at 11:59pm EDT. Late due date ${assignment.lateDueDate} at 11:59pm EDT. Gradescope status: ${assignment.status}. Source: BAN_CIS-5210-001 202630, Gradescope course 1357890.`,
    createdAt: CIS5210_ASSIGNMENT_CREATED_AT,
    deadline: assignment.dueDate,
    queued: false,
  };
}

function makeAssignmentBlock(assignment: Cis5210Assignment, task: Task): ScheduleBlock {
  const createdAt = `${assignment.dueDate}T23:00:00.000Z`;
  return {
    id: `cis5210_assignment_block_${assignment.id}`,
    taskId: task.id,
    date: assignment.dueDate,
    timeSlot: "23:00",
    columnIndex: 0,
    durationMinutes: task.estimatedDurationMinutes,
    createdAt,
    updatedAt: createdAt,
  };
}
