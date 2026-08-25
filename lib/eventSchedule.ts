import { timeToMinutes } from "@/lib/date";
import type { ActivityEvent, ModuleName, PlannerState, Priority, ScheduleBlock, Task } from "@/lib/types";

const EVENT_IMPORT_EVENT_ID = "fall_2026_events_import_v1";
const EVENT_SOURCE = "fall_2026_events";
const EVENT_CREATED_AT = "2026-08-25T05:00:00.000Z";

const fallEvents = [
  {
    id: "grad_workshop_meet_faculty",
    title: "Graduate Workshop: Meet and Greet with Penn Engineering Faculty",
    date: "2026-09-11",
    startTime: "16:00",
    endTime: "17:00",
    location: "Towne 100",
    module: "Career",
    notes: "Fall 2026 Graduate Workshop Schedule. Penn Engineering faculty meet and greet.",
  },
  {
    id: "grad_workshop_student_perspectives",
    title: "Graduate Workshop: Current Graduate Student Perspectives",
    date: "2026-09-18",
    startTime: "16:00",
    endTime: "17:00",
    location: "Towne 100",
    module: "Career",
    notes: "Fall 2026 Graduate Workshop Schedule.",
  },
  {
    id: "grad_workshop_work_life_balance",
    title: "Graduate Workshop: Work-Life Balance in Graduate School",
    date: "2026-09-25",
    startTime: "16:00",
    endTime: "17:00",
    location: "Towne 100",
    module: "Health",
    notes: "Fall 2026 Graduate Workshop Schedule.",
  },
  {
    id: "grad_workshop_financial_wellbeing",
    title: "Graduate Workshop: Financial Wellbeing in Graduate School and Beyond",
    date: "2026-10-09",
    startTime: "16:00",
    endTime: "17:00",
    location: "Towne 100",
    module: "Career",
    notes: "Fall 2026 Graduate Workshop Schedule.",
  },
  {
    id: "grad_workshop_advisee_advisor",
    title: "Graduate Workshop: Building an Effective Advisee-Advisor Relationship",
    date: "2026-10-23",
    startTime: "16:00",
    endTime: "17:00",
    location: "Towne 100",
    module: "Career",
    notes: "Fall 2026 Graduate Workshop Schedule.",
  },
  {
    id: "grad_workshop_professional_networks",
    title: "Graduate Workshop: Building Professional Networks, Communication",
    date: "2026-11-20",
    startTime: "16:00",
    endTime: "17:00",
    location: "Towne 100",
    module: "Career",
    notes: "Fall 2026 Graduate Workshop Schedule.",
  },
  {
    id: "grad_workshop_reflections_celebration",
    title: "Graduate Workshop: End-of-Semester Reflections and Celebration",
    date: "2026-12-04",
    startTime: "16:00",
    endTime: "18:00",
    location: "Towne 100",
    module: "Career",
    notes: "Fall 2026 Graduate Workshop Schedule.",
  },
  {
    id: "engineering_tech_career_fair_in_person",
    title: "Engineering & Technology Career Fair: In Person",
    date: "2026-09-16",
    startTime: "09:00",
    endTime: "10:00",
    location: "Location not shown",
    module: "Career",
    notes: "Penn Engineering & Technology Career Fair. Slide does not show exact time. Info: https://careerservices.upenn.edu/career-fairs/",
  },
  {
    id: "engineering_tech_career_fair_virtual",
    title: "Engineering & Technology Career Fair: Virtual",
    date: "2026-09-24",
    startTime: "09:00",
    endTime: "10:00",
    location: "Virtual",
    module: "Career",
    notes: "Penn Engineering & Technology Career Fair. Slide does not show exact time. Info: https://careerservices.upenn.edu/career-fairs/",
  },
  {
    id: "dsga_social_elections_welcome_back",
    title: "DSGA Social & Elections Welcome Back Social",
    date: "2026-09-04",
    startTime: "09:00",
    endTime: "10:00",
    location: "TBD",
    module: "Career",
    notes: "DSGA upcoming event. Location and time TBD. All DATS students are invited.",
  },
] satisfies FallEvent[];

export function withFall2026EventSchedule(state: PlannerState) {
  if (state.events.some((event) => event.id === EVENT_IMPORT_EVENT_ID)) return state;

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

  fallEvents.forEach((event) => {
    const task = makeEventTask(event);
    if (!existingTaskIds.has(task.id)) {
      tasksToAdd.push(task);
      addEvent({
        id: `fall_event_created_${event.id}`,
        type: "TASK_CREATED",
        taskId: task.id,
        payload: { task, source: EVENT_SOURCE, term: "Fall 2026", deadline: event.date },
        createdAt: EVENT_CREATED_AT,
      });
    }

    const block = makeEventBlock(event, task);
    if (!existingBlockIds.has(block.id)) {
      blocksToAdd.push(block);
      addEvent({
        id: `fall_event_scheduled_${event.id}`,
        type: "TASK_SCHEDULED",
        taskId: task.id,
        scheduleBlockId: block.id,
        payload: { block, source: EVENT_SOURCE, term: "Fall 2026", deadline: event.date },
        createdAt: block.createdAt,
      });
    }
  });

  addEvent({
    id: EVENT_IMPORT_EVENT_ID,
    type: "TASK_UPDATED",
    payload: {
      source: EVENT_SOURCE,
      term: "Fall 2026",
      eventCount: blocksToAdd.length,
    },
    createdAt: EVENT_CREATED_AT,
  });

  return {
    ...state,
    tasks: [...state.tasks, ...tasksToAdd],
    scheduleBlocks: [...state.scheduleBlocks, ...blocksToAdd],
    events: [...state.events, ...eventsToAdd],
  };
}

interface FallEvent {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  module: ModuleName;
  notes: string;
}

function makeEventTask(event: FallEvent): Task {
  return {
    id: `fall_event_task_${event.id}`,
    title: event.title,
    module: event.module,
    priority: "Medium" satisfies Priority,
    estimatedDurationMinutes: getDurationMinutes(event),
    notes: `Fall 2026 event. ${event.startTime}-${event.endTime} in ${event.location}. ${event.notes} DDL: ${event.date}.`,
    createdAt: EVENT_CREATED_AT,
    deadline: event.date,
    queued: false,
  };
}

function makeEventBlock(event: FallEvent, task: Task): ScheduleBlock {
  const createdAt = `${event.date}T${event.startTime}:00.000Z`;
  return {
    id: `fall_event_block_${event.id}`,
    taskId: task.id,
    date: event.date,
    timeSlot: event.startTime,
    columnIndex: 0,
    durationMinutes: task.estimatedDurationMinutes,
    createdAt,
    updatedAt: createdAt,
  };
}

function getDurationMinutes(event: FallEvent) {
  return timeToMinutes(event.endTime) - timeToMinutes(event.startTime);
}
