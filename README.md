# TaskTrail

TaskTrail is a personal modular planning MVP: Task Backpack, Today Canvas, bilingual voice task capture, and an event-derived Focus Trail.

## Run

```bash
npm install
npm run dev
```

Open the local URL printed by Next.js, usually `http://localhost:3000`.

## Voice Input

The Backpack includes a microphone button and a language toggle for English, Chinese, or Auto/Mixed. The MVP uses the browser `SpeechRecognition` / `webkitSpeechRecognition` API when available. If the browser does not support it, TaskTrail shows a fallback message and lets you paste text into the same parser field.

Important browser notes:

- SpeechRecognition works best in Chromium-based browsers.
- On a deployed website, microphone capture generally requires HTTPS.
- Auto/Mixed uses the browser's speech-recognition locale for live capture because the browser API cannot truly listen in two languages at once. The parser still detects English and Chinese from pasted or recognized text.
- If microphone permission is blocked, paste the spoken text into the field and click the wand button.

Example prompts:

- `Tomorrow afternoon I need to work on the project code for two hours, high priority`
- `明天下午两点我要写项目代码，大概两个小时，优先级高`

The current parser is rule-based and extracts title, module, date, time, duration, priority, and notes. A TODO in `lib/voiceParser.ts` marks where a future FastAPI + faster-whisper transcription/parser endpoint can replace the browser-only implementation.

## Focus Trail

TaskTrail keeps an event log in LocalStorage:

- `TASK_CREATED`
- `TASK_SCHEDULED`
- `TASK_MOVED`
- `TASK_DELETED`
- `TASK_UPDATED`

Scheduled blocks and task deletions are soft-deleted, so history is preserved. The Focus Trail is derived from the current non-deleted scheduled blocks plus the event log context. Scheduling, moving, deleting, or editing a task updates LocalStorage and the trail immediately. The Month view shows a calendar of completed focus blocks with per-day details and module mix.

## Mobile Use

TaskTrail is mobile-first for personal use. The Today Canvas scrolls horizontally when the timetable needs more width, and the Task Backpack behaves like a compact bottom sheet with its own scroll area.

## Backend Plan

The MVP is LocalStorage-first, with a small data layer in `lib/usePlannerStore.ts` and domain types in `lib/types.ts`. Later backend integration can keep the UI mostly intact:

- PostgreSQL tables for tasks, schedule blocks, and activity events.
- FastAPI endpoints for task CRUD, schedule changes, and event ingestion.
- faster-whisper service for multilingual speech-to-text.
- A backend parser that converts transcript text into the same `ParsedTaskInput` shape used by the current client parser.
- Server-derived Focus Trail segments for cross-device sync and analytics.
