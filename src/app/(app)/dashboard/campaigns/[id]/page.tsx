import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getCampaign, getCredits, getLatestJob, listCampaignBusinesses } from "@/services/workspace/repository";
import { CampaignProgress } from "@/components/campaigns/campaign-progress";

export const metadata: Metadata = { title: "Campaign" };

export default async function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user?.organizationId) redirect("/login");

  const campaign = await getCampaign(user.organizationId, id);
  if (!campaign) notFound();

  const [job, businesses, credits] = await Promise.all([
    getLatestJob(id),
    listCampaignBusinesses(user.organizationId, id),
    getCredits(user.organizationId),
  ]);

  return (
    <CampaignProgress
      initial={{ campaign, job, businesses, creditsRemaining: credits.remaining }}
    />
  );
}
