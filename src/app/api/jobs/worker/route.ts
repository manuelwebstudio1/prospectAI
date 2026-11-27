import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { tickAllJobs } from "@/services/agent/tick";

export const runtime = "nodejs";
export const maxDuration = 60;

function authorized(request: Request) {
  const secret = env.cronSecret;
  if (!secret) return false;
  const header = request.headers.get("authorization");
  return header === `Bearer ${secret}`;
}

async function run(request: Request) {
  if (!env.cronSecret) {
    return NextResponse.json(
      {
        error: "Unattended worker is not configured. Set CRON_SECRET and schedule GET /api/jobs/worker.",
        configured: false,
      },
      { status: 503 },
    );
  }
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const results = await tickAllJobs();
  return NextResponse.json({
    ok: true,
    processed: results.length,
    messages: results.map((item) => item.message),
  });
}

export async function GET(request: Request) {
  return run(request);
}

export async function POST(request: Request) {
  return run(request);
}
