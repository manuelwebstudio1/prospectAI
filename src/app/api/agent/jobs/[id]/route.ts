import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { loadJobBundle } from "@/services/agent/store";

export const runtime = "nodejs";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user?.organizationId) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  const { id } = await context.params;
  const bundle = await loadJobBundle(user.organizationId, id);
  if (!bundle) return NextResponse.json({ error: "Job not found." }, { status: 404 });
  return NextResponse.json(bundle);
}
