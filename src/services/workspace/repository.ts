import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { mutateLocalWorkspace, readLocalWorkspace } from "@/lib/dev/local-workspace";
import {
  emptyProgress,
  type BusinessRecord,
  type CampaignJobRecord,
  type CampaignRecord,
  type CampaignProgress,
  type InspectionRecord,
  type LeadRecord,
  type ResearchRecord,
  type AiUsageRecord,
} from "@/services/workspace/types";
import { normalizeBusinessName } from "@/services/discovery/normalize";
import type { CampaignStatus, WebsiteStatus } from "@/types";
import type { DemoPalette, DemoWebsiteRecord } from "@/services/demos/types";
import { env } from "@/lib/env";

function nowIso() {
  return new Date().toISOString();
}

function asProgress(raw: unknown): CampaignProgress {
  const value = (raw ?? {}) as Partial<CampaignProgress>;
  return {
    ...emptyProgress(),
    ...value,
  };
}

export async function listCampaigns(organizationId: string): Promise<CampaignRecord[]> {
  if (!isSupabaseConfigured()) {
    const workspace = await readLocalWorkspace();
    return workspace.campaigns
      .filter((item) => item.organization_id === organizationId)
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  }
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    ?.from("campaigns")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false }) ?? { data: [] };
  return (data ?? []).map((row) => ({ ...row, progress: asProgress(row.progress) })) as CampaignRecord[];
}

export async function getCampaign(organizationId: string, id: string): Promise<CampaignRecord | null> {
  if (!isSupabaseConfigured()) {
    const workspace = await readLocalWorkspace();
    return workspace.campaigns.find((item) => item.id === id && item.organization_id === organizationId) ?? null;
  }
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    ?.from("campaigns")
    .select("*")
    .eq("id", id)
    .eq("organization_id", organizationId)
    .maybeSingle() ?? { data: null };
  if (!data) return null;
  return { ...data, progress: asProgress(data.progress) } as CampaignRecord;
}

export async function createCampaign(record: CampaignRecord, job: CampaignJobRecord) {
  if (!isSupabaseConfigured()) {
    await mutateLocalWorkspace((workspace) => {
      workspace.campaigns.unshift(record);
      workspace.jobs.unshift(job);
    });
    return;
  }
  const supabase = await createSupabaseServerClient();
  if (!supabase) throw new Error("Database is not configured.");
  const { error } = await supabase.from("campaigns").insert({
    id: record.id,
    organization_id: record.organization_id,
    created_by: record.created_by,
    name: record.name,
    country: record.country,
    region: record.region,
    city: record.city,
    industry: record.industry,
    custom_category: record.custom_category,
    discovery_limit: record.discovery_limit,
    website_status_filter: record.website_status_filter,
    status: record.status,
    progress: record.progress,
    last_error: record.last_error,
    started_at: record.started_at,
  });
  if (error) throw new Error(error.message);
  await supabase.from("campaign_jobs").insert({
    id: job.id,
    campaign_id: job.campaign_id,
    organization_id: job.organization_id,
    job_type: job.job_type,
    status: job.status,
    attempts: job.attempts,
    last_error: job.last_error,
    payload: job.payload,
    started_at: job.started_at,
  });
}

export async function getLatestJob(campaignId: string): Promise<CampaignJobRecord | null> {
  if (!isSupabaseConfigured()) {
    const workspace = await readLocalWorkspace();
    return workspace.jobs.filter((job) => job.campaign_id === campaignId).sort((a, b) => b.created_at.localeCompare(a.created_at))[0] ?? null;
  }
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    ?.from("campaign_jobs")
    .select("*")
    .eq("campaign_id", campaignId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle() ?? { data: null };
  return (data as CampaignJobRecord | null) ?? null;
}

export async function saveCampaignAndJob(campaign: CampaignRecord, job: CampaignJobRecord) {
  if (!isSupabaseConfigured()) {
    await mutateLocalWorkspace((workspace) => {
      workspace.campaigns = workspace.campaigns.map((item) => (item.id === campaign.id ? campaign : item));
      const exists = workspace.jobs.some((item) => item.id === job.id);
      if (exists) {
        workspace.jobs = workspace.jobs.map((item) => (item.id === job.id ? job : item));
      } else {
        workspace.jobs.unshift(job);
      }
    });
    return;
  }
  const supabase = await createSupabaseServerClient();
  if (!supabase) throw new Error("Database is not configured.");
  await supabase
    .from("campaigns")
    .update({
      status: campaign.status,
      progress: campaign.progress,
      last_error: campaign.last_error,
      started_at: campaign.started_at,
      completed_at: campaign.completed_at,
      updated_at: nowIso(),
    })
    .eq("id", campaign.id);
  await supabase
    .from("campaign_jobs")
    .update({
      status: job.status,
      attempts: job.attempts,
      last_error: job.last_error,
      payload: job.payload,
      started_at: job.started_at,
      finished_at: job.finished_at,
    })
    .eq("id", job.id);
}

export async function findDuplicate(input: {
  organizationId: string;
  name: string;
  city: string | null;
  placeId: string | null;
}): Promise<BusinessRecord | null> {
  const normalized = normalizeBusinessName(input.name);
  if (!isSupabaseConfigured()) {
    const workspace = await readLocalWorkspace();
    return (
      workspace.businesses.find((item) => {
        if (item.organization_id !== input.organizationId) return false;
        if (input.placeId && item.external_place_id === input.placeId) return true;
        return item.normalized_name === normalized && (item.city ?? "") === (input.city ?? "");
      }) ?? null
    );
  }
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;
  if (input.placeId) {
    const { data } = await supabase
      .from("businesses")
      .select("*")
      .eq("organization_id", input.organizationId)
      .eq("external_place_id", input.placeId)
      .maybeSingle();
    if (data) return data as BusinessRecord;
  }
  let query = supabase
    .from("businesses")
    .select("*")
    .eq("organization_id", input.organizationId)
    .eq("normalized_name", normalized);
  query = input.city ? query.eq("city", input.city) : query.is("city", null);
  const { data } = await query.maybeSingle();
  return (data as BusinessRecord | null) ?? null;
}

export async function insertDiscovered(input: {
  business: BusinessRecord;
  inspection: InspectionRecord;
  lead: LeadRecord;
}) {
  if (!isSupabaseConfigured()) {
    await mutateLocalWorkspace((workspace) => {
      workspace.businesses.unshift(input.business);
      workspace.inspections.unshift(input.inspection);
      workspace.leads.unshift(input.lead);
    });
    return;
  }
  const supabase = await createSupabaseServerClient();
  if (!supabase) throw new Error("Database is not configured.");
  const { error } = await supabase.from("businesses").insert({
    id: input.business.id,
    organization_id: input.business.organization_id,
    campaign_id: input.business.campaign_id,
    name: input.business.name,
    industry: input.business.industry,
    category: input.business.category,
    country: input.business.country,
    region: input.business.region,
    city: input.business.city,
    address: input.business.address,
    latitude: input.business.latitude,
    longitude: input.business.longitude,
    phone: input.business.phone,
    email: input.business.email,
    website_url: input.business.website_url,
    website_status: input.business.website_status,
    source: input.business.source,
    external_place_id: input.business.external_place_id,
    is_sample: input.business.is_sample,
  });
  if (error) throw new Error(error.message);
  await supabase.from("website_inspections").insert({
    id: input.inspection.id,
    business_id: input.inspection.business_id,
    organization_id: input.inspection.organization_id,
    url: input.inspection.url,
    verification_status: input.inspection.verification_status,
    http_status: input.inspection.http_status,
    is_reachable: input.inspection.is_reachable,
    redirect_url: input.inspection.redirect_url,
    mobile_score: input.inspection.mobile_score,
    performance_score: input.inspection.performance_score,
    seo_score: input.inspection.seo_score,
    evidence: input.inspection.evidence,
    evidence_source: input.inspection.evidence_source,
    confidence: input.inspection.confidence,
    inspected_at: input.inspection.inspected_at,
  });
  await supabase.from("leads").insert({
    id: input.lead.id,
    organization_id: input.lead.organization_id,
    business_id: input.lead.business_id,
    stage: input.lead.stage,
    owner_id: input.lead.owner_id,
  });
}

export async function listCampaignBusinesses(organizationId: string, campaignId: string): Promise<BusinessRecord[]> {
  if (!isSupabaseConfigured()) {
    const workspace = await readLocalWorkspace();
    return workspace.businesses.filter(
      (item) => item.organization_id === organizationId && item.campaign_id === campaignId,
    );
  }
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    ?.from("businesses")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("campaign_id", campaignId)
    .order("created_at", { ascending: false }) ?? { data: [] };
  return (data ?? []) as BusinessRecord[];
}

export async function listLeads(organizationId: string): Promise<Array<LeadRecord & { business: BusinessRecord | null }>> {
  if (!isSupabaseConfigured()) {
    const workspace = await readLocalWorkspace();
    return workspace.leads
      .filter((lead) => lead.organization_id === organizationId)
      .map((lead) => ({
        ...lead,
        business: workspace.businesses.find((item) => item.id === lead.business_id) ?? null,
      }))
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  }
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    ?.from("leads")
    .select("*, businesses(*)")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false }) ?? { data: [] };
  return (data ?? []).map((row) => {
    const business = Array.isArray(row.businesses) ? row.businesses[0] : row.businesses;
    const { businesses: _ignored, ...lead } = row;
    return { ...(lead as LeadRecord), business: (business as BusinessRecord | null) ?? null };
  });
}

export async function listBusinesses(organizationId: string): Promise<BusinessRecord[]> {
  if (!isSupabaseConfigured()) {
    const workspace = await readLocalWorkspace();
    return workspace.businesses.filter((item) => item.organization_id === organizationId);
  }
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    ?.from("businesses")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false }) ?? { data: [] };
  return (data ?? []) as BusinessRecord[];
}

export async function getLead(organizationId: string, id: string) {
  const leads = await listLeads(organizationId);
  return leads.find((lead) => lead.id === id) ?? null;
}

export async function getBusiness(organizationId: string, businessId: string) {
  const businesses = await listBusinesses(organizationId);
  return businesses.find((item) => item.id === businessId) ?? null;
}

export async function getCreditBalance(
  organizationId: string,
  type: "discovery" | "research" | "website_generation" | "outreach" = "discovery",
) {
  if (!isSupabaseConfigured()) {
    const workspace = await readLocalWorkspace();
    return workspace.credits[type];
  }
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    ?.from("credit_balances")
    .select("remaining, allocated")
    .eq("organization_id", organizationId)
    .eq("credit_type", type)
    .maybeSingle() ?? { data: null };
  return data ?? { remaining: type === "discovery" ? 250 : 100, allocated: type === "discovery" ? 250 : 100 };
}

export async function getCredits(organizationId: string) {
  return getCreditBalance(organizationId, "discovery");
}

export async function consumeCredit(
  organizationId: string,
  type: "discovery" | "research" | "website_generation" | "outreach",
): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    return mutateLocalWorkspace((workspace) => {
      const bucket = workspace.credits[type];
      if (bucket.allocated === -1) return true;
      if (bucket.remaining <= 0) return false;
      bucket.remaining -= 1;
      return true;
    });
  }
  const supabase = await createSupabaseServerClient();
  if (!supabase) return false;
  const current = await getCreditBalance(organizationId, type);
  if (current.allocated === -1) return true;
  if (current.remaining <= 0) return false;
  const { error } = await supabase
    .from("credit_balances")
    .update({ remaining: current.remaining - 1 })
    .eq("organization_id", organizationId)
    .eq("credit_type", type);
  return !error;
}

export async function consumeDiscoveryCredit(organizationId: string): Promise<boolean> {
  return consumeCredit(organizationId, "discovery");
}

export async function refundCredit(
  organizationId: string,
  type: "discovery" | "research" | "website_generation" | "outreach",
): Promise<void> {
  if (!isSupabaseConfigured()) {
    await mutateLocalWorkspace((workspace) => {
      const bucket = workspace.credits[type];
      if (bucket.allocated === -1) return;
      bucket.remaining += 1;
    });
    return;
  }
  const supabase = await createSupabaseServerClient();
  if (!supabase) return;
  const current = await getCreditBalance(organizationId, type);
  if (current.allocated === -1) return;
  await supabase
    .from("credit_balances")
    .update({ remaining: current.remaining + 1 })
    .eq("organization_id", organizationId)
    .eq("credit_type", type);
}

export async function updateCampaignStatus(
  organizationId: string,
  campaignId: string,
  status: CampaignStatus,
  extra: Partial<CampaignRecord> = {},
) {
  const campaign = await getCampaign(organizationId, campaignId);
  if (!campaign) return null;
  const next = { ...campaign, ...extra, status, updated_at: nowIso() };
  const job = await getLatestJob(campaignId);
  if (job) {
    if (status === "cancelled") job.status = "cancelled";
    if (status === "paused") job.status = job.status === "running" ? "queued" : job.status;
    if (status === "queued") {
      job.status = "queued";
      job.last_error = null;
    }
    await saveCampaignAndJob(next, job);
  } else if (!isSupabaseConfigured()) {
    await mutateLocalWorkspace((workspace) => {
      workspace.campaigns = workspace.campaigns.map((item) => (item.id === campaignId ? next : item));
    });
  } else {
    const supabase = await createSupabaseServerClient();
    await supabase?.from("campaigns").update({ status, last_error: extra.last_error ?? next.last_error }).eq("id", campaignId);
  }
  return next;
}

export async function updateBusinessWebsiteStatus(
  organizationId: string,
  businessId: string,
  status: WebsiteStatus,
  websiteUrl: string | null,
) {
  if (!isSupabaseConfigured()) {
    await mutateLocalWorkspace((workspace) => {
      workspace.businesses = workspace.businesses.map((item) =>
        item.id === businessId && item.organization_id === organizationId
          ? { ...item, website_status: status, website_url: websiteUrl, updated_at: nowIso() }
          : item,
      );
    });
    return;
  }
  const supabase = await createSupabaseServerClient();
  await supabase
    ?.from("businesses")
    .update({ website_status: status, website_url: websiteUrl })
    .eq("id", businessId)
    .eq("organization_id", organizationId);
}

export async function duplicateCampaign(organizationId: string, campaignId: string, userId: string) {
  const source = await getCampaign(organizationId, campaignId);
  if (!source) return null;
  const id = crypto.randomUUID();
  const created = nowIso();
  const record: CampaignRecord = {
    ...source,
    id,
    name: `${source.name} (copy)`,
    status: "draft",
    progress: emptyProgress(),
    last_error: null,
    started_at: null,
    completed_at: null,
    created_at: created,
    updated_at: created,
    created_by: userId,
  };
  const job: CampaignJobRecord = {
    id: crypto.randomUUID(),
    campaign_id: id,
    organization_id: organizationId,
    job_type: "discovery",
    status: "queued",
    attempts: 0,
    last_error: null,
    payload: { hunted: false, hits: [], cursor: 0, source_mode: "sample", form: {} },
    started_at: null,
    finished_at: null,
    created_at: created,
  };
  await createCampaign(record, job);
  return record;
}

export async function deleteCampaign(organizationId: string, campaignId: string) {
  if (!isSupabaseConfigured()) {
    await mutateLocalWorkspace((workspace) => {
      workspace.campaigns = workspace.campaigns.filter(
        (item) => !(item.id === campaignId && item.organization_id === organizationId),
      );
      workspace.jobs = workspace.jobs.filter((item) => item.campaign_id !== campaignId);
    });
    return;
  }
  const supabase = await createSupabaseServerClient();
  await supabase?.from("campaigns").delete().eq("id", campaignId).eq("organization_id", organizationId);
}

export async function saveInspection(inspection: InspectionRecord) {
  if (!isSupabaseConfigured()) {
    await mutateLocalWorkspace((workspace) => {
      workspace.inspections.unshift(inspection);
    });
    return;
  }
  const supabase = await createSupabaseServerClient();
  if (!supabase) throw new Error("Database is not configured.");
  const { error } = await supabase.from("website_inspections").insert({
    id: inspection.id,
    business_id: inspection.business_id,
    organization_id: inspection.organization_id,
    url: inspection.url,
    verification_status: inspection.verification_status,
    http_status: inspection.http_status,
    is_reachable: inspection.is_reachable,
    redirect_url: inspection.redirect_url,
    mobile_score: inspection.mobile_score,
    performance_score: inspection.performance_score,
    seo_score: inspection.seo_score,
    evidence: inspection.evidence,
    evidence_source: inspection.evidence_source,
    confidence: inspection.confidence,
    inspected_at: inspection.inspected_at,
  });
  if (error) throw new Error(error.message);
}

export async function getLatestInspection(organizationId: string, businessId: string): Promise<InspectionRecord | null> {
  if (!isSupabaseConfigured()) {
    const workspace = await readLocalWorkspace();
    return (
      workspace.inspections
        .filter((item) => item.organization_id === organizationId && item.business_id === businessId)
        .sort((a, b) => b.inspected_at.localeCompare(a.inspected_at))[0] ?? null
    );
  }
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    ?.from("website_inspections")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("business_id", businessId)
    .order("inspected_at", { ascending: false })
    .limit(1)
    .maybeSingle() ?? { data: null };
  return (data as InspectionRecord | null) ?? null;
}

export async function getLatestResearch(organizationId: string, businessId: string): Promise<ResearchRecord | null> {
  if (!isSupabaseConfigured()) {
    const workspace = await readLocalWorkspace();
    return (
      workspace.research
        .filter((item) => item.organization_id === organizationId && item.business_id === businessId)
        .sort((a, b) => b.created_at.localeCompare(a.created_at))[0] ?? null
    );
  }
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    ?.from("business_research")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("business_id", businessId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle() ?? { data: null };
  if (!data) return null;
  const packed = (data.unknowns ?? {}) as {
    report?: ResearchRecord["report"];
    modes?: { research?: ResearchRecord["research_mode"]; architect?: ResearchRecord["architect_mode"] };
    list?: string[];
  };
  return {
    id: data.id,
    business_id: data.business_id,
    organization_id: data.organization_id,
    report: packed.report ?? {
      businessName: "",
      industry: null,
      location: null,
      description: data.summary ?? null,
      services: data.services ?? [],
      products: data.products ?? [],
      publicContacts: { phone: null, email: null, website: null, address: null },
      socialMedia: data.socials ?? {},
      onlinePresenceNotes: null,
      websiteNeed: null,
      unknowns: packed.list ?? [],
      caveats: [],
    },
    architecture: (data.website_recommendation ?? {}) as ResearchRecord["architecture"],
    research_mode: packed.modes?.research ?? "records_only",
    architect_mode: packed.modes?.architect ?? "blueprint",
    model: data.model,
    created_at: data.created_at,
  };
}

export async function saveResearch(record: ResearchRecord, leadId: string | null, userId: string | null) {
  if (!isSupabaseConfigured()) {
    await mutateLocalWorkspace((workspace) => {
      workspace.research.unshift(record);
      if (leadId) {
        workspace.leads = workspace.leads.map((lead) =>
          lead.id === leadId
            ? { ...lead, stage: "researched", last_interaction_at: record.created_at, updated_at: record.created_at }
            : lead,
        );
      }
      if (record.model) {
        const usage: AiUsageRecord = {
          id: crypto.randomUUID(),
          organization_id: record.organization_id,
          user_id: userId,
          agent: "business_researcher",
          provider: record.research_mode === "ai" ? "configured" : "none",
          model: record.model,
          metadata: { businessId: record.business_id, architectMode: record.architect_mode },
          created_at: record.created_at,
        };
        workspace.aiUsage.unshift(usage);
      }
    });
    return;
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) throw new Error("Database is not configured.");
  await supabase.from("business_research").insert({
    id: record.id,
    business_id: record.business_id,
    organization_id: record.organization_id,
    summary: record.report.description ?? record.report.websiteNeed,
    services: record.report.services,
    products: record.report.products,
    socials: record.report.socialMedia,
    website_recommendation: record.architecture,
    unknowns: { list: record.report.unknowns, report: record.report, modes: { research: record.research_mode, architect: record.architect_mode } },
    model: record.model,
  });
  if (leadId) {
    await supabase.from("leads").update({ stage: "researched", last_interaction_at: record.created_at }).eq("id", leadId);
  }
  await supabase.from("ai_usage_logs").insert({
    organization_id: record.organization_id,
    user_id: userId,
    agent: "intelligence_pipeline",
    provider: record.research_mode === "ai" ? "ai" : "records_only",
    model: record.model,
    metadata: { businessId: record.business_id, architectMode: record.architect_mode },
  });
}

export async function listResearchBriefs(
  organizationId: string,
): Promise<Array<ResearchRecord & { businessName: string; leadId: string | null }>> {
  if (!isSupabaseConfigured()) {
    const workspace = await readLocalWorkspace();
    return workspace.research
      .filter((item) => item.organization_id === organizationId)
      .map((item) => ({
        ...item,
        businessName: workspace.businesses.find((b) => b.id === item.business_id)?.name ?? item.report.businessName,
        leadId: workspace.leads.find((lead) => lead.business_id === item.business_id)?.id ?? null,
      }))
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  }
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    ?.from("business_research")
    .select("id, business_id, organization_id, website_recommendation, unknowns, model, created_at, businesses(name)")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false }) ?? { data: [] };
  return (data ?? []).map((row) => {
    const unknowns = (row.unknowns ?? {}) as { report?: ResearchRecord["report"]; modes?: { research?: ResearchRecord["research_mode"]; architect?: ResearchRecord["architect_mode"] } };
    const business = Array.isArray(row.businesses) ? row.businesses[0] : row.businesses;
    return {
      id: row.id,
      business_id: row.business_id,
      organization_id: row.organization_id,
      report: unknowns.report ?? {
        businessName: business?.name ?? "Unknown",
        industry: null,
        location: null,
        description: null,
        services: [],
        products: [],
        publicContacts: { phone: null, email: null, website: null, address: null },
        socialMedia: {},
        onlinePresenceNotes: null,
        websiteNeed: null,
        unknowns: [],
        caveats: [],
      },
      architecture: (row.website_recommendation ?? {}) as ResearchRecord["architecture"],
      research_mode: unknowns.modes?.research ?? "records_only",
      architect_mode: unknowns.modes?.architect ?? "blueprint",
      model: row.model,
      created_at: row.created_at,
      businessName: business?.name ?? "Unknown",
      leadId: null,
    };
  });
}

export async function getResearchById(organizationId: string, researchId: string): Promise<ResearchRecord | null> {
  const briefs = await listResearchBriefs(organizationId);
  const match = briefs.find((item) => item.id === researchId);
  return match ?? null;
}

function applyLeadDemoStage(
  workspace: { leads: Array<{ id: string; stage: string; last_interaction_at: string | null; updated_at: string }> },
  demo: DemoWebsiteRecord,
) {
  if (!demo.lead_id) return;
  workspace.leads = workspace.leads.map((lead) =>
    lead.id === demo.lead_id
      ? { ...lead, stage: "demo_generated" as const, last_interaction_at: demo.updated_at, updated_at: demo.updated_at }
      : lead,
  );
}

export async function saveDemo(demo: DemoWebsiteRecord) {
  if (!isSupabaseConfigured()) {
    await mutateLocalWorkspace((workspace) => {
      const index = workspace.demos.findIndex((item) => item.demo_id === demo.demo_id);
      if (index >= 0) workspace.demos[index] = demo;
      else workspace.demos.unshift(demo);
      applyLeadDemoStage(workspace, demo);
    });
    return;
  }
  const supabase = await createSupabaseServerClient();
  if (!supabase) throw new Error("Database is not configured.");
  const { error } = await supabase.from("generated_websites").upsert(
    {
      id: demo.id,
      organization_id: demo.organization_id,
      business_id: demo.business_id,
      demo_id: demo.demo_id,
      template_key: demo.template_key,
      status: demo.status,
      preview_url: `${env.appUrl.replace(/\/$/, "")}${demo.preview_path}`,
      design: {
        palette: demo.palette,
        pages: demo.pages,
        business_name: demo.business_name,
        industry: demo.industry,
        is_sample: demo.is_sample,
        research_id: demo.research_id,
        lead_id: demo.lead_id,
      },
      content: demo.content,
      is_unofficial: true,
      expires_at: demo.expires_at,
    },
    { onConflict: "demo_id" },
  );
  if (error) throw new Error(error.message);
  if (demo.lead_id) {
    await supabase.from("leads").update({ stage: "demo_generated" }).eq("id", demo.lead_id);
  }
}

function mapDemoRow(row: Record<string, unknown>): DemoWebsiteRecord {
  const design = (row.design ?? {}) as Record<string, unknown>;
  return {
    id: String(row.id),
    organization_id: String(row.organization_id),
    business_id: String(row.business_id),
    research_id: (design.research_id as string | null) ?? null,
    lead_id: (design.lead_id as string | null) ?? null,
    demo_id: String(row.demo_id),
    template_key: String(row.template_key ?? "professional_services"),
    status: (row.status as DemoWebsiteRecord["status"]) ?? "ready",
    preview_path: `/d/${row.demo_id}`,
    palette: (design.palette as DemoWebsiteRecord["palette"]) ?? {
      primary: "#6D5EF6",
      secondary: "#0F172A",
      accent: "#38BDF8",
      background: "#F8FAFC",
      text: "#0F172A",
    },
    content: (row.content as DemoWebsiteRecord["content"]) ?? {
      headline: "Demo",
      subhead: "",
      about: "",
      cta: "Enquire",
      location: null,
      phone: null,
      email: null,
      address: null,
      services: [],
      unknownsNote: "",
      copyMode: "deterministic",
    },
    pages: (design.pages as DemoWebsiteRecord["pages"]) ?? [],
    business_name: String(design.business_name ?? "Business"),
    industry: (design.industry as string | null) ?? null,
    is_sample: Boolean(design.is_sample),
    is_unofficial: true,
    expires_at: String(row.expires_at ?? new Date().toISOString()),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at ?? row.created_at),
  };
}

export async function listDemos(organizationId: string): Promise<DemoWebsiteRecord[]> {
  if (!isSupabaseConfigured()) {
    const workspace = await readLocalWorkspace();
    return workspace.demos.filter((item) => item.organization_id === organizationId);
  }
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    ?.from("generated_websites")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false }) ?? { data: [] };
  return (data ?? []).map((row) => mapDemoRow(row as Record<string, unknown>));
}

export async function getDemo(organizationId: string, id: string): Promise<DemoWebsiteRecord | null> {
  const demos = await listDemos(organizationId);
  return demos.find((item) => item.id === id || item.demo_id === id) ?? null;
}

export async function getPublicDemo(demoId: string): Promise<DemoWebsiteRecord | null> {
  if (!isSupabaseConfigured()) {
    const workspace = await readLocalWorkspace();
    const demo = workspace.demos.find((item) => item.demo_id === demoId) ?? null;
    if (!demo) return null;
    if (new Date(demo.expires_at).getTime() < Date.now()) {
      return { ...demo, status: "expired" };
    }
    return demo;
  }
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    ?.from("generated_websites")
    .select("*")
    .eq("demo_id", demoId)
    .maybeSingle() ?? { data: null };
  if (!data) return null;
  const demo = mapDemoRow(data as Record<string, unknown>);
  if (new Date(demo.expires_at).getTime() < Date.now()) {
    return { ...demo, status: "expired" };
  }
  return demo;
}

export async function updateDemoPalette(organizationId: string, demoId: string, palette: DemoPalette) {
  if (!isSupabaseConfigured()) {
    await mutateLocalWorkspace((workspace) => {
      workspace.demos = workspace.demos.map((item) =>
        item.demo_id === demoId && item.organization_id === organizationId
          ? { ...item, palette, updated_at: nowIso() }
          : item,
      );
    });
    return;
  }
  const current = await getDemo(organizationId, demoId);
  if (!current) return;
  const supabase = await createSupabaseServerClient();
  await supabase
    ?.from("generated_websites")
    .update({
      design: {
        palette,
        pages: current.pages,
        business_name: current.business_name,
        industry: current.industry,
        is_sample: current.is_sample,
        research_id: current.research_id,
        lead_id: current.lead_id,
      },
    })
    .eq("demo_id", demoId)
    .eq("organization_id", organizationId);
}

export async function updateDemoTemplate(organizationId: string, demoId: string, templateKey: string) {
  if (!isSupabaseConfigured()) {
    await mutateLocalWorkspace((workspace) => {
      workspace.demos = workspace.demos.map((item) =>
        item.demo_id === demoId && item.organization_id === organizationId
          ? { ...item, template_key: templateKey, updated_at: nowIso() }
          : item,
      );
    });
    return;
  }
  const supabase = await createSupabaseServerClient();
  await supabase
    ?.from("generated_websites")
    .update({ template_key: templateKey })
    .eq("demo_id", demoId)
    .eq("organization_id", organizationId);
}

export async function deleteDemo(organizationId: string, demoId: string) {
  if (!isSupabaseConfigured()) {
    await mutateLocalWorkspace((workspace) => {
      workspace.demos = workspace.demos.filter(
        (item) => !(item.demo_id === demoId && item.organization_id === organizationId),
      );
    });
    return;
  }
  const supabase = await createSupabaseServerClient();
  await supabase?.from("generated_websites").delete().eq("demo_id", demoId).eq("organization_id", organizationId);
}
