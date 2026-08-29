import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions, isAllowedPlannerEmail } from "@/lib/auth";
import { isPlannerState } from "@/lib/plannerStateSchema";
import { createSeedState, withDefaultSchedules } from "@/lib/storage";
import {
  getPlannerStorageDiagnostics,
  readUserPlannerState,
  writeUserPlannerState,
} from "@/lib/server/plannerStateStore";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await authorizedEmail();

  if (auth.response) {
    return auth.response;
  }

  try {
    const storedState = await readUserPlannerState(auth.email);
    const state = storedState ? withDefaultSchedules(storedState) : createSeedState();
    if (storedState && JSON.stringify(state) !== JSON.stringify(storedState)) {
      await writeUserPlannerState(auth.email, state);
    }

    return NextResponse.json({
      state,
      persisted: Boolean(storedState),
      storage: getPlannerStorageDiagnostics(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Planner storage is unavailable",
        detail: safeStorageError(error),
        storage: getPlannerStorageDiagnostics(),
      },
      { status: 503 },
    );
  }
}

export async function PUT(request: Request) {
  const auth = await authorizedEmail();

  if (auth.response) {
    return auth.response;
  }

  const body = (await request.json()) as { state?: unknown };

  if (!isPlannerState(body.state)) {
    return NextResponse.json({ error: "Invalid planner state" }, { status: 400 });
  }

  try {
    await writeUserPlannerState(auth.email, withDefaultSchedules(body.state));
    return NextResponse.json({ ok: true, storage: getPlannerStorageDiagnostics() });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Planner storage is unavailable",
        detail: safeStorageError(error),
        storage: getPlannerStorageDiagnostics(),
      },
      { status: 503 },
    );
  }
}

function safeStorageError(error: unknown) {
  if (!(error instanceof Error)) return "Unknown storage error";
  return error.message.replace(/Bearer\s+[A-Za-z0-9._-]+/g, "Bearer [redacted]");
}

async function authorizedEmail(): Promise<
  { email: string; response?: never } | { email?: never; response: NextResponse }
> {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;

  if (!email) {
    return { response: NextResponse.json({ error: "Sign in required" }, { status: 401 }) };
  }

  if (!isAllowedPlannerEmail(email)) {
    return { response: NextResponse.json({ error: "This account is not allowed to use TaskTrail" }, { status: 403 }) };
  }

  return { email };
}
