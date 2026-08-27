import type { ActivityEvent, PlannerState, Priority, ScheduleBlock, Task } from "@/lib/types";

const CIS5810_ASSIGNMENT_IMPORT_EVENT_ID = "cis5810_fall_2026_assignments_import_v1";
const CIS5810_ASSIGNMENT_SOURCE = "cis5810_fall_2026_assignments";
const CIS5810_ASSIGNMENT_CREATED_AT = "2026-08-27T05:00:00.000Z";

const cis5810Assignments = [
  {
    id: "project_1_dolly_zoom",
    title: "CIS 5810 Project 1: Dolly Zoom",
    kind: "Project",
    availableText: "Available until Sep 5 at 11:59pm",
    dueDate: "2026-08-31",
    points: 20,
  },
  {
    id: "homework_1_convolution",
    title: "CIS 5810 Homework 1: Convolution",
    kind: "Homework",
    availableText: "Available until Sep 13 at 11:59pm",
    dueDate: "2026-09-08",
    points: 10,
  },
  {
    id: "homework_2_canny_edge_detection",
    title: "CIS 5810 Homework 2: Canny Edge Detection",
    kind: "Homework",
    availableText: "Not available until Sep 1 at 12:00am",
    dueDate: "2026-09-15",
    points: 10,
  },
  {
    id: "project_2_canny_edge_detection",
    title: "CIS 5810 Project 2: Canny Edge Detection",
    kind: "Project",
    availableText: "Not available until Sep 7 at 12:00am",
    dueDate: "2026-09-21",
    points: 100,
  },
  {
    id: "project_3_laplacian_blending",
    title: "CIS 5810 Project 3: Laplacian Blending",
    kind: "Project",
    availableText: "Not available until Sep 14 at 12:00am",
    dueDate: "2026-09-28",
    points: 100,
  },
  {
    id: "project_4_homography_estimation",
    title: "CIS 5810 Project 4: Homography Estimation",
    kind: "Project",
    availableText: "Not available until Sep 21 at 12:00am",
    dueDate: "2026-10-05",
    points: 120,
  },
  {
    id: "homework_3_optical_flow_estimation",
    title: "CIS 5810 Homework 3: Optical Flow Estimation",
    kind: "Homework",
    availableText: "Not available until Sep 28 at 12:00am",
    dueDate: "2026-10-12",
    points: 10,
  },
  {
    id: "project_5_image_morphing",
    title: "CIS 5810 Project 5: Image Morphing",
    kind: "Project",
    availableText: "Not available until Oct 5 at 12:00am",
    dueDate: "2026-10-19",
    points: 22,
  },
  {
    id: "project_6_poisson_image_editing",
    title: "CIS 5810 Project 6: Poisson Image Editing",
    kind: "Project",
    availableText: "Not available until Oct 20 at 12:00am",
    dueDate: "2026-11-03",
    points: 100,
  },
  {
    id: "project_7_hand_pose_estimation",
    title: "CIS 5810 Project 7: Hand Pose Estimation",
    kind: "Project",
    availableText: "Not available until Oct 26 at 12:00am",
    dueDate: "2026-11-09",
    points: 100,
  },
] satisfies Cis5810Assignment[];

export function withCis5810Assignments(state: PlannerState) {
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

  cis5810Assignments.forEach((assignment) => {
    const task = makeAssignmentTask(assignment);
    if (!existingTaskIds.has(task.id)) {
      tasksToAdd.push(task);
      addEvent({
        id: `cis5810_assignment_event_created_${assignment.id}`,
        type: "TASK_CREATED",
        taskId: task.id,
        payload: { task, source: CIS5810_ASSIGNMENT_SOURCE, term: "Fall 2026", deadline: assignment.dueDate },
        createdAt: CIS5810_ASSIGNMENT_CREATED_AT,
      });
    }

    const block = makeAssignmentBlock(assignment, task);
    if (!existingBlockIds.has(block.id)) {
      blocksToAdd.push(block);
      addEvent({
        id: `cis5810_assignment_event_scheduled_${assignment.id}`,
        type: "TASK_SCHEDULED",
        taskId: task.id,
        scheduleBlockId: block.id,
        payload: { block, source: CIS5810_ASSIGNMENT_SOURCE, term: "Fall 2026", deadline: assignment.dueDate },
        createdAt: block.createdAt,
      });
    }
  });

  addEvent({
    id: CIS5810_ASSIGNMENT_IMPORT_EVENT_ID,
    type: "TASK_UPDATED",
    payload: {
      source: CIS5810_ASSIGNMENT_SOURCE,
      term: "Fall 2026",
      assignmentCount: cis5810Assignments.length,
    },
    createdAt: CIS5810_ASSIGNMENT_CREATED_AT,
  });

  return {
    ...state,
    tasks: [...state.tasks, ...tasksToAdd],
    scheduleBlocks: [...state.scheduleBlocks, ...blocksToAdd],
    events: [...state.events, ...eventsToAdd],
  };
}

interface Cis5810Assignment {
  id: string;
  title: string;
  kind: "Project" | "Homework";
  availableText: string;
  dueDate: string;
  points: number;
}

function makeAssignmentTask(assignment: Cis5810Assignment): Task {
  return {
    id: `cis5810_assignment_task_${assignment.id}`,
    title: assignment.title,
    module: assignment.kind === "Project" ? "Project" : "Study",
    priority: "High" satisfies Priority,
    estimatedDurationMinutes: 59,
    notes: `Fall 2026 CIS 5810 ${assignment.kind}. ${assignment.availableText}. Due ${assignment.dueDate} at 11:59pm. ${assignment.points} points. Marked red in TaskTrail.`,
    createdAt: CIS5810_ASSIGNMENT_CREATED_AT,
    deadline: assignment.dueDate,
    queued: false,
  };
}

function makeAssignmentBlock(assignment: Cis5810Assignment, task: Task): ScheduleBlock {
  const createdAt = `${assignment.dueDate}T23:00:00.000Z`;
  return {
    id: `cis5810_assignment_block_${assignment.id}`,
    taskId: task.id,
    date: assignment.dueDate,
    timeSlot: "23:00",
    columnIndex: 0,
    durationMinutes: task.estimatedDurationMinutes,
    createdAt,
    updatedAt: createdAt,
  };
}
