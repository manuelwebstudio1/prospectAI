import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { controlAgentJob } from "@/services/agent/tick";

export const runtime = "nodejs";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user?.organizationId) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  const { id } = await context.params;
  const body = (await request.json().catch(() => null)) as { action?: string } | null;
  const action = body?.action;
  if (action !== "pause" && action !== "resume" && action !== "cancel" && action !== "retry") {
    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  }
  try {
    const job = await controlAgentJob(user.organizationId, id, action);
    return NextResponse.json({ job });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Control failed." }, { status: 400 });
  }
}
