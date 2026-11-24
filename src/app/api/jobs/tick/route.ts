import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { tickDiscovery } from "@/services/jobs/process-discovery";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user?.organizationId) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as { campaignId?: string } | null;
  if (!body?.campaignId) {
    return NextResponse.json({ error: "campaignId is required" }, { status: 400 });
  }

  try {
    const result = await tickDiscovery(user.organizationId, body.campaignId);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Tick failed" },
      { status: 400 },
    );
  }
}
