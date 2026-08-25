import { addDaysIso, timeToMinutes } from "@/lib/date";
import type { ActivityEvent, ModuleName, PlannerState, Priority, ScheduleBlock, Task } from "@/lib/types";

const COURSE_IMPORT_EVENT_ID = "course_import_fall_2026_v1";
const TERM_START = "2026-08-25";
const TERM_END = "2026-12-07";
const COURSE_CREATED_AT = "2026-08-25T04:00:00.000Z";

const courseMeetings = [
  {
    id: "cis6250_mw",
    title: "CIS 6250 Theory of Machine Learning",
    days: [1, 3],
    startTime: "10:15",
    endTime: "11:44",
    location: "AGH 105B / AGH 105A",
    instructor: "M. Kearns",
  },
  {
    id: "cis5800_mw",
    title: "CIS 5800 Machine Perception",
    days: [1, 3],
    startTime: "12:00",
    endTime: "13:29",
    location: "AGH 106B",
    instructor: "C. Taylor",
  },
  {
    id: "cis5450_mw",
    title: "CIS 5450 Big Data Analytics",
    days: [1, 3],
    startTime: "13:45",
    endTime: "15:14",
    location: "MEYH B1",
    instructor: "R. Marcus",
  },
  {
    id: "cis5450_f",
    title: "CIS 5450 Big Data Analytics Recitation",
    days: [5],
    startTime: "13:45",
    endTime: "15:14",
    location: "Room not shown",
    instructor: "R. Marcus",
  },
] satisfies CourseMeeting[];

export function withCourseSchedule(state: PlannerState) {
  if (state.events.some((event) => event.id === COURSE_IMPORT_EVENT_ID)) return state;

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

  courseMeetings.forEach((meeting) => {
    const task = makeCourseTask(meeting);
    if (!existingTaskIds.has(task.id)) {
      tasksToAdd.push(task);
      addEvent({
        id: `course_event_created_${meeting.id}`,
        type: "TASK_CREATED",
        taskId: task.id,
        payload: { task, source: "course_import_fall_2026" },
        createdAt: COURSE_CREATED_AT,
      });
    }

    getMeetingDates(meeting).forEach((date) => {
      const block = makeCourseBlock(meeting, task, date);
      if (existingBlockIds.has(block.id)) return;
      blocksToAdd.push(block);
      addEvent({
        id: `course_event_scheduled_${meeting.id}_${date}`,
        type: "TASK_SCHEDULED",
        taskId: task.id,
        scheduleBlockId: block.id,
        payload: { block, source: "course_import_fall_2026" },
        createdAt: block.createdAt,
      });
    });
  });

  addEvent({
    id: COURSE_IMPORT_EVENT_ID,
    type: "TASK_UPDATED",
    payload: {
      source: "course_import_fall_2026",
      termStart: TERM_START,
      termEnd: TERM_END,
      meetingCount: blocksToAdd.length,
    },
    createdAt: COURSE_CREATED_AT,
  });

  return {
    ...state,
    tasks: [...state.tasks, ...tasksToAdd],
    scheduleBlocks: [...state.scheduleBlocks, ...blocksToAdd],
    events: [...state.events, ...eventsToAdd],
  };
}

interface CourseMeeting {
  id: string;
  title: string;
  days: number[];
  startTime: string;
  endTime: string;
  location: string;
  instructor: string;
}

function makeCourseTask(meeting: CourseMeeting): Task {
  return {
    id: `course_task_${meeting.id}`,
    title: meeting.title,
    module: "Study" satisfies ModuleName,
    priority: "High" satisfies Priority,
    estimatedDurationMinutes: getDurationMinutes(meeting),
    notes: `${meeting.startTime}-${meeting.endTime} in ${meeting.location}. Instructor: ${meeting.instructor}. ${TERM_START} to ${TERM_END}.`,
    createdAt: COURSE_CREATED_AT,
    queued: false,
  };
}

function makeCourseBlock(meeting: CourseMeeting, task: Task, date: string): ScheduleBlock {
  const createdAt = `${date}T${meeting.startTime}:00.000Z`;
  return {
    id: `course_block_${meeting.id}_${date}`,
    taskId: task.id,
    date,
    timeSlot: meeting.startTime,
    columnIndex: 0,
    durationMinutes: getDurationMinutes(meeting),
    createdAt,
    updatedAt: createdAt,
  };
}

function getMeetingDates(meeting: CourseMeeting) {
  const dates: string[] = [];
  let cursor = TERM_START;
  while (cursor <= TERM_END) {
    const day = new Date(`${cursor}T00:00:00`).getDay();
    if (meeting.days.includes(day)) dates.push(cursor);
    cursor = addDaysIso(cursor, 1);
  }
  return dates;
}

function getDurationMinutes(meeting: CourseMeeting) {
  return timeToMinutes(meeting.endTime) - timeToMinutes(meeting.startTime);
}
