import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getCampaign, getCredits, getLatestJob, listCampaignBusinesses } from "@/services/workspace/repository";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user?.organizationId) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }
  const { id } = await params;
  const campaign = await getCampaign(user.organizationId, id);
  if (!campaign) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const [job, businesses, credits] = await Promise.all([
    getLatestJob(id),
    listCampaignBusinesses(user.organizationId, id),
    getCredits(user.organizationId),
  ]);
  return NextResponse.json({ campaign, job, businesses, creditsRemaining: credits.remaining });
}
