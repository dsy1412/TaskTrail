import type { ActivityEvent, ModuleName, PlannerState, Priority, ScheduleBlock, Task } from "@/lib/types";

const SEMESTER_PLAN_IMPORT_EVENT_ID = "fall_2026_lab_semester_plan_import_v1";
const SEMESTER_PLAN_SOURCE = "fall_2026_lab_semester_plan";
const SEMESTER_PLAN_CREATED_AT = "2026-08-25T06:00:00.000Z";

const labPlanMilestones = [
  {
    id: "lab_plan_kickoff",
    title: "Semester lab plan: Gu + WAVES roadmap",
    module: "Career",
    priority: "High",
    durationMinutes: 60,
    deadline: "2026-08-30",
    date: "2026-08-25",
    timeSlot: "16:00",
    notes:
      "Fall 2026 semester plan. Target labs: Jiatao Gu and Mingmin Zhao WAVES Lab. Convert interest into small proof-of-work before outreach.",
  },
  {
    id: "jiatao_gu_paper_map",
    title: "Jiatao Gu: paper map + pitch angle",
    module: "Study",
    priority: "High",
    durationMinutes: 90,
    deadline: "2026-09-06",
    date: "2026-08-27",
    timeSlot: "19:00",
    notes:
      "Read recent work around multimodal learning, generative models, foundation models, and VLMs. Identify a focused mini-result that is more concrete than a generic interest email.",
  },
  {
    id: "waves_lab_paper_map",
    title: "WAVES Lab: RF/acoustic/vision paper map",
    module: "Study",
    priority: "High",
    durationMinutes: 90,
    deadline: "2026-09-08",
    date: "2026-09-01",
    timeSlot: "19:00",
    notes:
      "Map Mingmin Zhao WAVES Lab themes: radio, acoustic, vision, language, multimodal perception, Physical AI, and physics-driven ML. Emphasize the differentiated RF/wireless sensing story.",
  },
  {
    id: "jiatao_gu_mini_result",
    title: "Jiatao Gu: multimodal foundation mini result",
    module: "Project",
    priority: "High",
    durationMinutes: 120,
    deadline: "2026-09-20",
    date: "2026-09-10",
    timeSlot: "19:00",
    notes:
      "Build a small result related to multimodal or generative foundation models. Goal: one visual/demo artifact plus a short explanation that links directly to professor-relevant research.",
  },
  {
    id: "waves_lab_mini_result",
    title: "WAVES Lab: physical AI mini result",
    module: "Project",
    priority: "High",
    durationMinutes: 120,
    deadline: "2026-09-24",
    date: "2026-09-15",
    timeSlot: "19:00",
    notes:
      "Prototype or write up a small Physical AI / multimodal perception result. Differentiate from ordinary VLM fine-tuning by tying RF or sensing signals to vision-language reasoning.",
  },
  {
    id: "jiatao_gu_fit_email",
    title: "Jiatao Gu: research-fit email",
    module: "Career",
    priority: "High",
    durationMinutes: 60,
    deadline: "2026-09-27",
    date: "2026-09-22",
    timeSlot: "19:00",
    notes:
      "Write a concise outreach email after the mini-result is ready. Frame why multimodal/generative foundation models fit your plan and include the proof-of-work link.",
  },
  {
    id: "waves_lab_fit_email",
    title: "WAVES Lab: differentiated PhD story email",
    module: "Career",
    priority: "High",
    durationMinutes: 60,
    deadline: "2026-10-01",
    date: "2026-09-29",
    timeSlot: "19:00",
    notes:
      "Write the WAVES Lab outreach email around a distinctive research story: RF/wireless sensing + vision + multimodal/Physical AI, not just VLM fine-tuning.",
  },
] satisfies LabPlanMilestone[];

export function withFall2026LabSemesterPlan(state: PlannerState) {
  if (state.events.some((event) => event.id === SEMESTER_PLAN_IMPORT_EVENT_ID)) return state;

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

  labPlanMilestones.forEach((milestone) => {
    const task = makeLabPlanTask(milestone);
    if (!existingTaskIds.has(task.id)) {
      tasksToAdd.push(task);
      addEvent({
        id: `semester_plan_event_created_${milestone.id}`,
        type: "TASK_CREATED",
        taskId: task.id,
        payload: { task, source: SEMESTER_PLAN_SOURCE, term: "Fall 2026", deadline: milestone.deadline },
        createdAt: SEMESTER_PLAN_CREATED_AT,
      });
    }

    const block = makeLabPlanBlock(milestone, task);
    if (!existingBlockIds.has(block.id)) {
      blocksToAdd.push(block);
      addEvent({
        id: `semester_plan_event_scheduled_${milestone.id}`,
        type: "TASK_SCHEDULED",
        taskId: task.id,
        scheduleBlockId: block.id,
        payload: { block, source: SEMESTER_PLAN_SOURCE, term: "Fall 2026", deadline: milestone.deadline },
        createdAt: block.createdAt,
      });
    }
  });

  addEvent({
    id: SEMESTER_PLAN_IMPORT_EVENT_ID,
    type: "TASK_UPDATED",
    payload: {
      source: SEMESTER_PLAN_SOURCE,
      term: "Fall 2026",
      milestoneCount: labPlanMilestones.length,
    },
    createdAt: SEMESTER_PLAN_CREATED_AT,
  });

  return {
    ...state,
    tasks: [...state.tasks, ...tasksToAdd],
    scheduleBlocks: [...state.scheduleBlocks, ...blocksToAdd],
    events: [...state.events, ...eventsToAdd],
  };
}

interface LabPlanMilestone {
  id: string;
  title: string;
  module: ModuleName;
  priority: Priority;
  durationMinutes: number;
  deadline: string;
  date: string;
  timeSlot: string;
  notes: string;
}

function makeLabPlanTask(milestone: LabPlanMilestone): Task {
  return {
    id: `semester_plan_task_${milestone.id}`,
    title: milestone.title,
    module: milestone.module,
    priority: milestone.priority,
    estimatedDurationMinutes: milestone.durationMinutes,
    notes: `${milestone.notes} DDL: ${milestone.deadline}.`,
    createdAt: SEMESTER_PLAN_CREATED_AT,
    deadline: milestone.deadline,
    queued: true,
  };
}

function makeLabPlanBlock(milestone: LabPlanMilestone, task: Task): ScheduleBlock {
  const createdAt = `${milestone.date}T${milestone.timeSlot}:00.000Z`;
  return {
    id: `semester_plan_block_${milestone.id}`,
    taskId: task.id,
    date: milestone.date,
    timeSlot: milestone.timeSlot,
    columnIndex: 0,
    durationMinutes: task.estimatedDurationMinutes,
    createdAt,
    updatedAt: createdAt,
  };
}
