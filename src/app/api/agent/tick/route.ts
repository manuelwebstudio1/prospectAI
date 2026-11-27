import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { loadJobBundle } from "@/services/agent/store";
import { tickAgentJob, tickOrganizationJobs } from "@/services/agent/tick";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user?.organizationId) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  const body = (await request.json().catch(() => null)) as { jobId?: string } | null;
  try {
    const result = body?.jobId
      ? await tickAgentJob(user.organizationId, body.jobId, user.id)
      : await tickOrganizationJobs(user.organizationId, user.id);
    const bundle = result.job ? await loadJobBundle(user.organizationId, result.job.id) : null;
    return NextResponse.json({ ...result, bundle });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Tick failed." }, { status: 400 });
  }
}
