import { addDaysIso, timeToMinutes } from "@/lib/date";
import type { ActivityEvent, ModuleName, PlannerState, Priority, ScheduleBlock, Task } from "@/lib/types";

const ROUTINE_IMPORT_EVENT_ID = "fall_2026_semester_routine_import_v1";
const ROUTINE_SOURCE = "fall_2026_semester_routine";
const ROUTINE_CREATED_AT = "2026-09-06T12:00:00.000Z";
const TERM_START = "2026-08-25";
const TERM_END = "2026-12-07";

const routineItems = [
  {
    id: "morning_cook_breakfast",
    title: "Morning cook + breakfast",
    module: "Health",
    priority: "Medium",
    days: [0, 1, 2, 3, 4, 5, 6],
    timeSlot: "08:00",
    durationMinutes: 80,
    notes: "Daily baseline. Wake up around 8, cook, eat, and prepare for the day before training or class.",
  },
  {
    id: "weekday_gym",
    title: "Gym training",
    module: "Health",
    priority: "High",
    days: [1, 2, 3, 4, 5, 6],
    timeSlot: "10:00",
    durationMinutes: 90,
    notes: "Main 1.5-hour workout block. Keep 11:30-12:00 open for shower, food, and walking to class on course days.",
  },
  {
    id: "sunday_recovery",
    title: "Recovery workout / walk",
    module: "Health",
    priority: "Medium",
    days: [0],
    timeSlot: "10:00",
    durationMinutes: 60,
    notes: "Lower-intensity Sunday recovery so the weekly training habit stays stable without draining the next week.",
  },
  {
    id: "tuth_post_gym_snack",
    title: "Post-gym snack",
    module: "Health",
    priority: "Medium",
    days: [2, 4],
    timeSlot: "11:30",
    durationMinutes: 20,
    notes: "Tuesday/Thursday bridge before CIS 5210: quick protein, yogurt, banana, or sandwich instead of a rushed full meal.",
  },
  {
    id: "mw_lunch",
    title: "Lunch",
    module: "Health",
    priority: "Medium",
    days: [1, 3],
    timeSlot: "13:35",
    durationMinutes: 40,
    notes: "Monday/Wednesday lunch after CIS 5800.",
  },
  {
    id: "tuth_lunch",
    title: "Lunch",
    module: "Health",
    priority: "Medium",
    days: [2, 4],
    timeSlot: "13:35",
    durationMinutes: 40,
    notes: "Tuesday/Thursday real lunch after CIS 5210 and before CIS 5810. Avoid a heavy meal right before class.",
  },
  {
    id: "fri_lunch",
    title: "Lunch",
    module: "Health",
    priority: "Medium",
    days: [5],
    timeSlot: "12:00",
    durationMinutes: 45,
    notes: "Friday lunch after gym before interview practice.",
  },
  {
    id: "weekend_lunch",
    title: "Lunch",
    module: "Health",
    priority: "Low",
    days: [0, 6],
    timeSlot: "12:00",
    durationMinutes: 45,
    notes: "Weekend lunch before deep work or weekly DDL review.",
  },
  {
    id: "mw_dinner",
    title: "Dinner",
    module: "Health",
    priority: "Medium",
    days: [1, 3],
    timeSlot: "18:15",
    durationMinutes: 45,
    notes: "Monday/Wednesday dinner before evening DDL or project buffer.",
  },
  {
    id: "tuth_dinner",
    title: "Dinner",
    module: "Health",
    priority: "Medium",
    days: [2, 4],
    timeSlot: "17:10",
    durationMinutes: 40,
    notes: "Tuesday/Thursday dinner right after CIS 5810, before the evening study blocks.",
  },
  {
    id: "fri_dinner",
    title: "Dinner",
    module: "Health",
    priority: "Low",
    days: [5],
    timeSlot: "18:00",
    durationMinutes: 45,
    notes: "Friday dinner before weekly DDL cleanup.",
  },
  {
    id: "weekend_dinner",
    title: "Dinner",
    module: "Health",
    priority: "Low",
    days: [0, 6],
    timeSlot: "18:00",
    durationMinutes: 45,
    notes: "Weekend dinner and recovery time.",
  },
  {
    id: "mw_cis5800_review",
    title: "CIS 5800 review / notes",
    module: "Study",
    priority: "High",
    days: [1, 3],
    timeSlot: "14:30",
    durationMinutes: 90,
    notes: "Review Machine Perception lecture ideas, formulas, and confusion points while the class is fresh.",
  },
  {
    id: "mw_leetcode_patterns",
    title: "LeetCode patterns",
    module: "Career",
    priority: "High",
    days: [1, 3],
    timeSlot: "16:30",
    durationMinutes: 90,
    notes: "2027 summer intern prep. Monday: array, hash, two pointers. Wednesday: stack, binary search, sliding window.",
  },
  {
    id: "mw_ddl_project_buffer",
    title: "DDL / project buffer",
    module: "Study",
    priority: "High",
    days: [1, 3],
    timeSlot: "20:00",
    durationMinutes: 90,
    notes: "Use this for the nearest homework, project, or reading deadline. DDL weeks can absorb extra work here.",
  },
  {
    id: "tuth_cis5810_project",
    title: "CIS 5810 project work",
    module: "Project",
    priority: "High",
    days: [2, 4],
    timeSlot: "18:00",
    durationMinutes: 90,
    notes: "Hands-on CV project implementation after dinner, not squeezed between the two classes.",
  },
  {
    id: "tuth_cis5210_hw",
    title: "CIS 5210 homework block",
    module: "Study",
    priority: "High",
    days: [2, 4],
    timeSlot: "20:00",
    durationMinutes: 75,
    notes: "AI homework and search/probabilistic reasoning practice. Keep this before late-night fatigue.",
  },
  {
    id: "tuth_light_leetcode",
    title: "Light LeetCode review",
    module: "Career",
    priority: "Medium",
    days: [2, 4],
    timeSlot: "21:15",
    durationMinutes: 45,
    notes: "Maintenance mode after a heavy class day: review wrong answers, patterns, and English explanation.",
  },
  {
    id: "fri_leetcode_timed",
    title: "LeetCode timed practice",
    module: "Career",
    priority: "High",
    days: [5],
    timeSlot: "13:00",
    durationMinutes: 120,
    notes: "Contest-style interview practice for 2027 summer intern recruiting.",
  },
  {
    id: "fri_internship_outreach",
    title: "Internship applications / outreach",
    module: "Career",
    priority: "High",
    days: [5],
    timeSlot: "15:30",
    durationMinutes: 90,
    notes: "Resume, applications, referrals, recruiter follow-up, and project story refinement.",
  },
  {
    id: "fri_ddl_cleanup",
    title: "Weekly DDL cleanup",
    module: "Study",
    priority: "High",
    days: [5],
    timeSlot: "20:00",
    durationMinutes: 90,
    notes: "Close open loops before the weekend: submit small items, update next actions, and check Canvas/Gradescope.",
  },
  {
    id: "sat_deep_course_work",
    title: "Deep course / project work",
    module: "Project",
    priority: "High",
    days: [6],
    timeSlot: "13:00",
    durationMinutes: 150,
    notes: "Longest weekly focus block for the hardest course project or nearest DDL.",
  },
  {
    id: "sat_leetcode_review",
    title: "LeetCode review notebook",
    module: "Career",
    priority: "High",
    days: [6],
    timeSlot: "16:00",
    durationMinutes: 90,
    notes: "Rewrite wrong solutions, summarize templates, and practice explaining tradeoffs out loud.",
  },
  {
    id: "sun_upcoming_ddl_prep",
    title: "Upcoming DDL prep",
    module: "Study",
    priority: "High",
    days: [0],
    timeSlot: "13:00",
    durationMinutes: 120,
    notes: "Look ahead one week and start the nearest assignments before they become urgent.",
  },
  {
    id: "sun_weekly_planning",
    title: "Weekly planning + DDL check",
    module: "Weekly Plan",
    priority: "Medium",
    days: [0],
    timeSlot: "16:00",
    durationMinutes: 60,
    notes: "Plan the next week around classes, DDLs, gym recovery, LeetCode, and internship tasks.",
  },
  {
    id: "sun_light_review",
    title: "Light review",
    module: "Study",
    priority: "Low",
    days: [0],
    timeSlot: "20:00",
    durationMinutes: 60,
    notes: "Low-pressure review only so Sunday night does not damage sleep.",
  },
  {
    id: "night_wind_down",
    title: "Wind down before sleep",
    module: "Health",
    priority: "Low",
    days: [0, 1, 2, 3, 4, 5, 6],
    timeSlot: "22:30",
    durationMinutes: 30,
    notes: "Stop work and prepare for an 11pm bedtime.",
  },
] satisfies SemesterRoutineItem[];

export function withFall2026SemesterRoutine(state: PlannerState) {
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

  const desiredTasks = new Map(routineItems.map((item) => [makeRoutineTask(item).id, makeRoutineTask(item)]));
  const updatedTasks = state.tasks.map((task) => {
    const desired = desiredTasks.get(task.id);
    if (!desired) return task;
    const updated = { ...task, ...desired };
    return isSameTask(task, updated) ? task : updated;
  });
  const allBlocks = [...state.scheduleBlocks, ...blocksToAdd];

  routineItems.forEach((item) => {
    const task = makeRoutineTask(item);
    if (!existingTaskIds.has(task.id)) {
      tasksToAdd.push(task);
      existingTaskIds.add(task.id);
      addEvent({
        id: `semester_routine_event_created_${item.id}`,
        type: "TASK_CREATED",
        taskId: task.id,
        payload: { task, source: ROUTINE_SOURCE, term: "Fall 2026" },
        createdAt: ROUTINE_CREATED_AT,
      });
    }

    getRoutineDates(item).forEach((date) => {
      const blockId = `semester_routine_block_${item.id}_${date}`;
      if (existingBlockIds.has(blockId)) return;
      const block = makeRoutineBlock(item, task, date, allBlocks);
      blocksToAdd.push(block);
      allBlocks.push(block);
      existingBlockIds.add(block.id);
      addEvent({
        id: `semester_routine_event_scheduled_${item.id}_${date}`,
        type: "TASK_SCHEDULED",
        taskId: task.id,
        scheduleBlockId: block.id,
        payload: { block, source: ROUTINE_SOURCE, term: "Fall 2026" },
        createdAt: block.createdAt,
      });
    });
  });

  addEvent({
    id: ROUTINE_IMPORT_EVENT_ID,
    type: "TASK_UPDATED",
    payload: {
      source: ROUTINE_SOURCE,
      term: "Fall 2026",
      termStart: TERM_START,
      termEnd: TERM_END,
      routineCount: routineItems.length,
      blockCount: blocksToAdd.length,
    },
    createdAt: ROUTINE_CREATED_AT,
  });

  return {
    ...state,
    tasks: [...updatedTasks, ...tasksToAdd],
    scheduleBlocks: [...state.scheduleBlocks, ...blocksToAdd],
    events: [...state.events, ...eventsToAdd],
  };
}

interface SemesterRoutineItem {
  id: string;
  title: string;
  module: ModuleName;
  priority: Priority;
  days: number[];
  timeSlot: string;
  durationMinutes: number;
  notes: string;
}

function makeRoutineTask(item: SemesterRoutineItem): Task {
  return {
    id: `semester_routine_task_${item.id}`,
    title: item.title,
    module: item.module,
    priority: item.priority,
    estimatedDurationMinutes: item.durationMinutes,
    notes: `Fall 2026 semester routine. ${item.notes}`,
    createdAt: ROUTINE_CREATED_AT,
    queued: false,
  };
}

function makeRoutineBlock(
  item: SemesterRoutineItem,
  task: Task,
  date: string,
  existingBlocks: ScheduleBlock[],
): ScheduleBlock {
  const createdAt = `${date}T${item.timeSlot}:00.000Z`;
  return {
    id: `semester_routine_block_${item.id}_${date}`,
    taskId: task.id,
    date,
    timeSlot: item.timeSlot,
    columnIndex: getAvailableColumn(date, item.timeSlot, item.durationMinutes, existingBlocks),
    durationMinutes: item.durationMinutes,
    createdAt,
    updatedAt: createdAt,
  };
}

function getRoutineDates(item: SemesterRoutineItem) {
  const dates: string[] = [];
  let cursor = TERM_START;
  while (cursor <= TERM_END) {
    const day = new Date(`${cursor}T00:00:00`).getDay();
    if (item.days.includes(day)) dates.push(cursor);
    cursor = addDaysIso(cursor, 1);
  }
  return dates;
}

function getAvailableColumn(date: string, startTime: string, durationMinutes: number, blocks: ScheduleBlock[]) {
  const start = timeToMinutes(startTime);
  const end = start + durationMinutes;
  const sameDayBlocks = blocks.filter((block) => !block.deletedAt && block.date === date);

  for (let columnIndex = 0; columnIndex < 4; columnIndex += 1) {
    const hasOverlap = sameDayBlocks.some((block) => {
      if (block.columnIndex !== columnIndex) return false;
      const blockStart = timeToMinutes(block.timeSlot);
      const blockEnd = blockStart + block.durationMinutes;
      return start < blockEnd && end > blockStart;
    });
    if (!hasOverlap) return columnIndex;
  }

  return 0;
}

function isSameTask(left: Task, right: Task) {
  return (
    left.title === right.title &&
    left.module === right.module &&
    left.priority === right.priority &&
    left.estimatedDurationMinutes === right.estimatedDurationMinutes &&
    left.notes === right.notes &&
    left.queued === right.queued
  );
}
