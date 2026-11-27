import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { createAgentJob } from "@/services/agent/create-job";
import { listAgentJobs, listAgentTasks } from "@/services/agent/store";

export const runtime = "nodejs";

export async function GET() {
  const user = await getCurrentUser();
  if (!user?.organizationId) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  const jobs = await listAgentJobs(user.organizationId);
  const withTasks = await Promise.all(
    jobs.slice(0, 20).map(async (job) => ({
      job,
      tasks: await listAgentTasks(job.id),
    })),
  );
  return NextResponse.json({ jobs: withTasks });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user?.organizationId) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  const body = (await request.json().catch(() => null)) as { instruction?: string; confirmed?: boolean } | null;
  const instruction = body?.instruction?.trim();
  if (!instruction) return NextResponse.json({ error: "Instruction is required." }, { status: 400 });

  const result = await createAgentJob({ user, instruction, confirmed: Boolean(body?.confirmed) });
  if (!result.ok) {
    const status = result.code === "needs_confirmation" ? 409 : result.code === "conversation" ? 200 : 400;
    return NextResponse.json(
      {
        type: result.code === "conversation" ? "conversation" : "error",
        code: result.code,
        error: result.error,
        answer: result.answer,
        plan: result.plan,
      },
      { status },
    );
  }
  return NextResponse.json({ type: "job", job: result.job }, { status: 201 });
}
