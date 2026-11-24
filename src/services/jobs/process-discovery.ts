import { inspectWebsite } from "@/services/website-detection/inspect";
import { huntBusinesses } from "@/services/discovery/places";
import { normalizeBusinessName, normalizePhone } from "@/services/discovery/normalize";
import { normalizeWebsiteUrl } from "@/lib/security/ssrf";
import {
  consumeDiscoveryCredit,
  findDuplicate,
  getCampaign,
  getCredits,
  getLatestJob,
  insertDiscovered,
  listCampaignBusinesses,
  saveCampaignAndJob,
} from "@/services/workspace/repository";
import type { CampaignJobRecord, CampaignRecord, PlaceHit } from "@/services/workspace/types";
import type { WebsiteStatus } from "@/types";

const BATCH_SIZE = 3;

function matchesFilter(status: WebsiteStatus, filter: string) {
  if (filter === "any") return true;
  if (filter === "poor_website") return status === "poor_website";
  if (filter === "no_website") return status === "no_website" || (status === "unverified");
  return true;
}

function bumpStatus(campaign: CampaignRecord, status: WebsiteStatus) {
  if (status === "no_website") campaign.progress.no_website += 1;
  else if (status === "poor_website") campaign.progress.poor_website += 1;
  else if (status === "good_website") campaign.progress.has_website += 1;
  else campaign.progress.unverified += 1;
}

export type TickResult = {
  campaign: CampaignRecord;
  job: CampaignJobRecord | null;
  businesses: Awaited<ReturnType<typeof listCampaignBusinesses>>;
  creditsRemaining: number;
  message: string;
};

export async function tickDiscovery(organizationId: string, campaignId: string): Promise<TickResult> {
  const campaign = await getCampaign(organizationId, campaignId);
  if (!campaign) throw new Error("Campaign not found.");
  let job = await getLatestJob(campaignId);
  if (!job) throw new Error("Discovery job not found.");
  job.payload = {
    hunted: Boolean(job.payload?.hunted),
    hits: job.payload?.hits ?? [],
    cursor: job.payload?.cursor ?? 0,
    source_mode: job.payload?.source_mode ?? "sample",
    form: job.payload?.form ?? {},
  };

  if (campaign.status === "paused") {
    return respond(campaign, job, organizationId, "Campaign is paused.");
  }
  if (campaign.status === "cancelled") {
    return respond(campaign, job, organizationId, "Campaign was cancelled.");
  }
  if (campaign.status === "completed") {
    return respond(campaign, job, organizationId, "Campaign already completed.");
  }

  try {
    if (!job.payload.hunted) {
      campaign.status = "running";
      campaign.started_at = campaign.started_at ?? new Date().toISOString();
      campaign.progress.current_step = "Searching authorized sources…";
      job.status = "running";
      job.started_at = job.started_at ?? new Date().toISOString();
      job.attempts += 1;
      await saveCampaignAndJob(campaign, job);

      const hunted = await huntBusinesses({
        country: campaign.country,
        region: campaign.region,
        city: campaign.city ?? "",
        industry: campaign.industry ?? "Other",
        customCategory: campaign.custom_category,
        discoveryLimit: campaign.discovery_limit,
      });

      job.payload.hunted = true;
      job.payload.hits = hunted.hits;
      job.payload.cursor = 0;
      job.payload.source_mode = hunted.mode;
      campaign.progress.source_mode = hunted.mode;
      campaign.progress.discovered = hunted.hits.length;
      campaign.progress.current_step =
        hunted.mode === "sample"
          ? "Loaded labelled sample directory. These are not verified businesses."
          : `Found ${hunted.hits.length} places. Inspecting websites…`;
      await saveCampaignAndJob(campaign, job);
      return respond(campaign, job, organizationId, campaign.progress.current_step ?? "Search complete.");
    }

    if (!job.payload.hits.length) {
      campaign.last_error = "No businesses were returned by the configured source.";
      return complete(campaign, job, organizationId);
    }

    const credits = await getCredits(organizationId);
    if (credits.remaining <= 0) {
      campaign.status = "paused";
      campaign.last_error = "Discovery credits exhausted. Upgrade or wait for renewal.";
      campaign.progress.current_step = campaign.last_error;
      job.status = "queued";
      await saveCampaignAndJob(campaign, job);
      return respond(campaign, job, organizationId, campaign.last_error);
    }

    campaign.status = "running";
    job.status = "running";
    const slice = job.payload.hits.slice(job.payload.cursor, job.payload.cursor + BATCH_SIZE);
    if (!slice.length) {
      return complete(campaign, job, organizationId);
    }

    for (const hit of slice) {
      job.payload.cursor += 1;
      campaign.progress.current_step = `Inspecting ${hit.name}…`;
      await persistHit(organizationId, campaign, hit);
    }

    if (job.payload.cursor >= job.payload.hits.length) {
      return complete(campaign, job, organizationId);
    }

    await saveCampaignAndJob(campaign, job);
    return respond(campaign, job, organizationId, campaign.progress.current_step ?? "Processing…");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Discovery job failed.";
    campaign.status = "failed";
    campaign.last_error = message;
    campaign.progress.current_step = message;
    job.status = "failed";
    job.last_error = message;
    job.finished_at = new Date().toISOString();
    await saveCampaignAndJob(campaign, job);
    return respond(campaign, job, organizationId, message);
  }
}

async function persistHit(organizationId: string, campaign: CampaignRecord, hit: PlaceHit) {
  const duplicate = await findDuplicate({
    organizationId,
    name: hit.name,
    city: hit.city ?? campaign.city,
    placeId: hit.placeId,
  });
  if (duplicate) {
    campaign.progress.duplicates += 1;
    campaign.progress.processed += 1;
    return;
  }

  const isSample = hit.source === "sample_directory";
  const inspection = await inspectWebsite({
    businessName: hit.name,
    sourceUrl: hit.websiteUri,
    isSample,
  });

  campaign.progress.processed += 1;

  if (!matchesFilter(inspection.verificationStatus, campaign.website_status_filter)) {
    bumpStatus(campaign, inspection.verificationStatus);
    return;
  }

  const allowed = await consumeDiscoveryCredit(organizationId);
  if (!allowed) {
    throw new Error("Discovery credits exhausted.");
  }

  const businessId = crypto.randomUUID();
  const inspectedAt = new Date().toISOString();
  await insertDiscovered({
    business: {
      id: businessId,
      organization_id: organizationId,
      campaign_id: campaign.id,
      name: hit.name,
      normalized_name: normalizeBusinessName(hit.name),
      industry: campaign.industry,
      category: campaign.custom_category ?? campaign.industry,
      country: hit.country ?? campaign.country,
      region: hit.region ?? campaign.region,
      city: hit.city ?? campaign.city,
      address: hit.address,
      latitude: hit.latitude,
      longitude: hit.longitude,
      phone: normalizePhone(hit.phone),
      email: null,
      website_url: inspection.finalUrl ?? normalizeWebsiteUrl(hit.websiteUri),
      website_status: inspection.verificationStatus,
      source: hit.source,
      external_place_id: hit.placeId,
      is_sample: isSample,
      created_at: inspectedAt,
      updated_at: inspectedAt,
    },
    inspection: {
      id: crypto.randomUUID(),
      business_id: businessId,
      organization_id: organizationId,
      url: inspection.url,
      verification_status: inspection.verificationStatus,
      http_status: inspection.httpStatus,
      is_reachable: inspection.isReachable,
      redirect_url: inspection.redirectUrl,
      mobile_score: inspection.mobileScore,
      performance_score: inspection.performanceScore,
      seo_score: inspection.seoScore,
      evidence: inspection.evidence,
      evidence_source: inspection.evidenceSource,
      confidence: inspection.confidence,
      inspected_at: inspectedAt,
    },
    lead: {
      id: crypto.randomUUID(),
      organization_id: organizationId,
      business_id: businessId,
      stage: "new_lead",
      owner_id: campaign.created_by,
      tags: isSample ? ["sample"] : [],
      last_interaction_at: null,
      created_at: inspectedAt,
      updated_at: inspectedAt,
    },
  });

  bumpStatus(campaign, inspection.verificationStatus);
}

async function complete(campaign: CampaignRecord, job: CampaignJobRecord, organizationId: string) {
  campaign.status = "completed";
  campaign.completed_at = new Date().toISOString();
  campaign.progress.current_step = "Discovery complete.";
  job.status = "succeeded";
  job.finished_at = campaign.completed_at;
  await saveCampaignAndJob(campaign, job);
  return respond(campaign, job, organizationId, "Discovery complete.");
}

async function respond(
  campaign: CampaignRecord,
  job: CampaignJobRecord | null,
  organizationId: string,
  message: string,
): Promise<TickResult> {
  const [businesses, credits] = await Promise.all([
    listCampaignBusinesses(organizationId, campaign.id),
    getCredits(organizationId),
  ]);
  return { campaign, job, businesses, creditsRemaining: credits.remaining, message };
}
