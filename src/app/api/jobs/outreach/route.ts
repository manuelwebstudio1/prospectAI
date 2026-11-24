import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { sendDueOutreach } from "@/services/outreach/workflow";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST() {
  const user = await getCurrentUser();
  if (!user?.organizationId) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }
  const results = await sendDueOutreach(user.organizationId);
  return NextResponse.json({ processed: results.length, results });
}
