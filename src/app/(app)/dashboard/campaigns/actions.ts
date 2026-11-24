"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { campaignDraftSchema } from "@/lib/validation/auth";
import { queueDiscoveryCampaign } from "@/services/discovery/create-campaign";
import {
  deleteCampaign,
  duplicateCampaign,
  updateCampaignStatus,
} from "@/services/workspace/repository";
import type { CampaignStatus } from "@/types";

export type CampaignActionState = { error?: string; success?: string } | null;

export async function createCampaignAction(
  _prev: CampaignActionState,
  formData: FormData,
): Promise<CampaignActionState> {
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
  if (!user) return { error: "Sign in to create a campaign." };

  const startNow = formData.get("intent") === "start";
  try {
    const campaign = await queueDiscoveryCampaign(user, parsed.data);
    if (!startNow) {
      await updateCampaignStatus(user.organizationId!, campaign.id, "draft");
      redirect(`/dashboard/campaigns/${campaign.id}`);
    }
    redirect(`/dashboard/campaigns/${campaign.id}`);
  } catch (error) {
    if (typeof error === "object" && error && "digest" in error) throw error;
    return { error: error instanceof Error ? error.message : "Could not save campaign." };
  }
}

async function requireOrg() {
  const user = await getCurrentUser();
  if (!user?.organizationId) throw new Error("Unauthenticated");
  return user;
}

export async function setCampaignStatusAction(campaignId: string, status: CampaignStatus) {
  const user = await requireOrg();
  await updateCampaignStatus(
    user.organizationId!,
    campaignId,
    status,
    status === "queued" ? { last_error: null } : {},
  );
  revalidatePath(`/dashboard/campaigns/${campaignId}`);
  revalidatePath("/dashboard/campaigns");
}

export async function retryCampaignAction(campaignId: string) {
  const user = await requireOrg();
  await updateCampaignStatus(user.organizationId!, campaignId, "queued", {
    last_error: null,
    completed_at: null,
  });
  revalidatePath(`/dashboard/campaigns/${campaignId}`);
}

export async function duplicateCampaignAction(campaignId: string) {
  const user = await requireOrg();
  const copy = await duplicateCampaign(user.organizationId!, campaignId, user.id);
  if (copy) redirect(`/dashboard/campaigns/${copy.id}`);
}

export async function deleteCampaignAction(campaignId: string) {
  const user = await requireOrg();
  await deleteCampaign(user.organizationId!, campaignId);
  redirect("/dashboard/campaigns");
}
