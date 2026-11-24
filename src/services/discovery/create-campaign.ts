import { emptyProgress, type CampaignJobRecord, type CampaignRecord } from "@/services/workspace/types";
import { createCampaign } from "@/services/workspace/repository";
import type { CampaignDraftInput } from "@/lib/validation/auth";
import type { CurrentUser } from "@/types";
import { env } from "@/lib/env";

export async function queueDiscoveryCampaign(user: CurrentUser, input: CampaignDraftInput) {
  const organizationId = user.organizationId;
  if (!organizationId) {
    throw new Error("Complete onboarding before starting discovery.");
  }

  const created = new Date().toISOString();
  const campaignId = crypto.randomUUID();
  const sourceMode = env.googlePlacesKey ? "places" : "sample";

  const campaign: CampaignRecord = {
    id: campaignId,
    organization_id: organizationId,
    created_by: user.id,
    name: input.name,
    country: input.country,
    region: input.region || null,
    city: input.city,
    industry: input.industry,
    custom_category: input.customCategory || null,
    discovery_limit: input.discoveryLimit,
    website_status_filter: input.websiteStatusFilter,
    status: "queued",
    progress: {
      ...emptyProgress(),
      source_mode: sourceMode,
      current_step: "Queued. The worker will start without blocking this page.",
    },
    last_error: null,
    started_at: created,
    completed_at: null,
    created_at: created,
    updated_at: created,
  };

  const job: CampaignJobRecord = {
    id: crypto.randomUUID(),
    campaign_id: campaignId,
    organization_id: organizationId,
    job_type: "discovery",
    status: "queued",
    attempts: 0,
    last_error: null,
    payload: {
      hunted: false,
      hits: [],
      cursor: 0,
      source_mode: sourceMode,
      form: input,
    },
    started_at: null,
    finished_at: null,
    created_at: created,
  };

  await createCampaign(campaign, job);
  return campaign;
}
