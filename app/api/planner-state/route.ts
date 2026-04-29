import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { isPlannerState } from "@/lib/plannerStateSchema";
import { createSeedState } from "@/lib/storage";
import { readUserPlannerState, writeUserPlannerState } from "@/lib/server/plannerStateStore";

export const dynamic = "force-dynamic";

export async function GET() {
  const email = await signedInEmail();

  if (!email) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const state = await readUserPlannerState(email);
  return NextResponse.json({ state: state ?? createSeedState(), persisted: Boolean(state) });
}

export async function PUT(request: Request) {
  const email = await signedInEmail();

  if (!email) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const body = (await request.json()) as { state?: unknown };

  if (!isPlannerState(body.state)) {
    return NextResponse.json({ error: "Invalid planner state" }, { status: 400 });
  }

  await writeUserPlannerState(email, body.state);
  return NextResponse.json({ ok: true });
}

async function signedInEmail() {
  const session = await getServerSession(authOptions);
  return session?.user?.email ?? null;
}
