"use server";

import { redirect } from "next/navigation";
import { campaignDraftSchema } from "@/lib/validation/auth";
import { getCurrentUser } from "@/lib/auth/session";
import { queueDiscoveryCampaign } from "@/services/discovery/create-campaign";

export type DiscoveryState = {
  error?: string;
  success?: string;
  campaignId?: string;
} | null;

export async function createDiscoveryCampaignAction(
  _prev: DiscoveryState,
  formData: FormData,
): Promise<DiscoveryState> {
  const parsed = campaignDraftSchema.safeParse({
    name: formData.get("name"),
    country: formData.get("country"),
    region: formData.get("region"),
    city: formData.get("city"),
    industry: formData.get("industry"),
    customCategory: formData.get("customCategory"),
    discoveryLimit: formData.get("discoveryLimit"),
    websiteStatusFilter: formData.get("websiteStatusFilter"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the campaign form." };
  }

  const user = await getCurrentUser();
  if (!user) return { error: "You need to be signed in." };

  let campaignId: string;
  try {
    const campaign = await queueDiscoveryCampaign(user, parsed.data);
    campaignId = campaign.id;
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not queue discovery." };
  }

  redirect(`/dashboard/campaigns/${campaignId}`);
}
