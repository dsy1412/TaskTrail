# TaskTrail

TaskTrail is a personal modular planning MVP: Task Backpack, Today Canvas, Planning Calendar, and an event-derived Focus Trail.

## Run

```bash
npm install
npm run dev
```

Open the local URL printed by Next.js, usually `http://localhost:3000`.

## Vercel Deployment

Production domain: `https://tasktrail-six.vercel.app`

Latest deployment:

- Deployment URL: `https://tasktrail-gcaea79wq-dsy1412s-projects.vercel.app`
- Status: Ready
- Created: Just now by `dsy1412`
- Source: `github/dsy1412`, branch `main`, commit `238ee35`
- Commit message: `Initial TaskTrail MVP`

Project settings are tracked in `vercel.json`:

- Framework: Next.js
- Install command: `npm install`
- Build command: `npm run build`
- Development command: `npm run dev`

### Private Login and Sync

TaskTrail uses Google sign-in and is intended to run as a private planner. Visitors who are not signed in only see a private sign-in screen. After signing in, planner data is loaded and saved through `/api/planner-state`, keyed by the Google account email on the server.

Required Vercel environment variables:

- `NEXTAUTH_URL`: `https://tasktrail-six.vercel.app`
- `NEXTAUTH_SECRET`: random secret for NextAuth session signing
- `GOOGLE_CLIENT_ID`: Google OAuth client ID
- `GOOGLE_CLIENT_SECRET`: Google OAuth client secret
- `TASKTRAIL_ALLOWED_EMAILS`: comma-separated Google account emails that can use the app, for example `you@example.com`

If `TASKTRAIL_ALLOWED_EMAILS` is empty, any authenticated Google account can sign in. Set it in production to keep the app private.

For durable cross-device sync, attach Vercel KV or Upstash Redis and set one of these variable pairs:

- `KV_REST_API_URL` and `KV_REST_API_TOKEN`
- `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`

Without KV/Upstash variables, local development falls back to in-memory server storage. That is useful for testing the login flow, but it is not persistent across server restarts or Vercel instances.

## Focus Trail

TaskTrail keeps an event log in LocalStorage:

- `TASK_CREATED`
- `TASK_SCHEDULED`
- `TASK_MOVED`
- `TASK_DELETED`
- `TASK_UPDATED`

Scheduled blocks and task deletions are soft-deleted, so history is preserved. The Focus Trail is derived from the current non-deleted scheduled blocks plus the event log context. Scheduling, moving, deleting, or editing a task updates LocalStorage and the trail immediately. The Month view shows a calendar of completed focus blocks with per-day details and module mix.

## Mobile Use

TaskTrail is mobile-first for personal use. The Today Canvas and Planning Calendar scroll horizontally when they need more width, and the Task Backpack behaves like a compact bottom sheet with its own scroll area.

TaskTrail is also installable as a PWA:

- iPhone Safari: open the production site, tap Share, then tap Add to Home Screen.
- Android Chrome: open the production site, tap the browser menu, then tap Install app or Add to Home screen.

The installed app opens in a standalone mobile window and keeps the same Google sign-in and sync behavior as the website.

When a new version is deployed, the installed mobile PWA keeps using the same production URL and service worker. It will pick up code and UI updates after reopening or refreshing the app, while task data syncs through the signed-in Google account and `/api/planner-state`.

## Backend Plan

The MVP is LocalStorage-first, with a small data layer in `lib/usePlannerStore.ts` and domain types in `lib/types.ts`. Later backend integration can keep the UI mostly intact:

- PostgreSQL tables for tasks, schedule blocks, and activity events.
- FastAPI endpoints for task CRUD, schedule changes, and event ingestion.
- Server-derived Focus Trail segments for cross-device sync and analytics.
