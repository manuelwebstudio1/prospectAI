import { z } from "zod";
import { env } from "@/lib/env";
import { inspectWebsite } from "@/services/website-detection/inspect";
import { researchBusiness } from "@/services/research/run";
import { generateDemoWebsite } from "@/services/demos/generate";
import { createOutreachDraft } from "@/services/outreach/draft";
import { saveOutreach, listOutreach } from "@/services/workspace/outreach-store";
import { createAgentJob } from "@/services/agent/create-job";
import { loadJobBundle, listAgentJobs, listDeployments, saveDeployment } from "@/services/agent/store";
import { scoreOpportunity } from "@/services/agent/score";
import { tickAgentJob } from "@/services/agent/tick";
import { queueDiscoveryCampaign } from "@/services/discovery/create-campaign";
import { campaignDraftSchema } from "@/lib/validation/auth";
import {
  getBusiness,
  getCampaign,
  getCreditBalance,
  getDemo,
  getLatestInspection,
  getLatestJob,
  getLatestResearch,
  getLead,
  listCampaignBusinesses,
  listCampaigns,
  listDemos,
  listLeads,
  saveDemo,
  saveInspection,
  updateBusinessWebsiteStatus,
  updateCampaignStatus,
} from "@/services/workspace/repository";
import { assertRateLimit, assertToolAllowed, requireOrganization } from "@/lib/mcp/guards";
import { getIdempotentResult, saveIdempotentResult } from "@/lib/mcp/store";
import type { CurrentUser } from "@/types";

const text = (value: unknown) => JSON.stringify(value, null, 2);
const uuid = z.string().uuid();
const idempotencyKey = z.string().min(8).max(80).optional();

const emptyShape = z.object({ idempotencyKey });
const instructionSchema = z.object({
  instruction: z.string().min(8).max(2000),
  confirmed: z.boolean().optional(),
  idempotencyKey,
});
const campaignIdSchema = z.object({ campaignId: uuid, idempotencyKey });
const jobIdSchema = z.object({ jobId: uuid, idempotencyKey });
const leadIdSchema = z.object({ leadId: uuid, idempotencyKey });
const businessIdSchema = z.object({ businessId: uuid, idempotencyKey });
const inspectSchema = z.object({
  businessId: uuid,
  url: z.string().url().optional(),
  idempotencyKey,
});
const outreachSchema = z.object({
  leadId: uuid,
  channel: z.enum(["email", "whatsapp"]).optional(),
  idempotencyKey,
});
const demoIdSchema = z.object({ demoId: z.string().min(4).max(80), idempotencyKey });
const searchSchema = z.object({
  query: z.string().min(2).max(120),
  idempotencyKey,
});
const createCampaignSchema = campaignDraftSchema.extend({ idempotencyKey });

export const MCP_TOOL_DEFS = [
  { name: "discover_businesses", description: "Start a durable discovery job from a natural-language instruction. Returns a jobId. Does not send outreach.", schema: instructionSchema },
  { name: "get_business_details", description: "Return one business in this workspace with inspection, research and opportunity score when present.", schema: businessIdSchema },
  { name: "search_existing_leads", description: "Search leads in the authenticated workspace by name, city or industry.", schema: searchSchema },
  { name: "research_business", description: "Compile a research report from verified records. Does not invent facts.", schema: leadIdSchema },
  { name: "inspect_website", description: "Inspect a business website with SSRF protections. Missing directory URLs are unverified, not proof of no website.", schema: inspectSchema },
  { name: "score_opportunity", description: "Score a website opportunity 0–100 with written reasons. Not a conversion probability.", schema: businessIdSchema },
  { name: "generate_website_demo", description: "Generate an unofficial demo from an existing research brief. Uses website-generation credits.", schema: leadIdSchema },
  { name: "get_generated_website", description: "Fetch a generated demo owned by this workspace.", schema: demoIdSchema },
  { name: "deploy_website_demo", description: "Verify a demo preview URL and record deployment. Does not create a new hosting project.", schema: demoIdSchema },
  { name: "get_deployment_status", description: "Read the latest deployment record for a demo in this workspace.", schema: demoIdSchema },
  { name: "create_campaign", description: "Queue a discovery campaign. Returns campaignId. Work continues in the background.", schema: createCampaignSchema },
  { name: "get_campaign_status", description: "Read campaign status, progress and the latest discovery job.", schema: campaignIdSchema },
  { name: "pause_campaign", description: "Pause a campaign so no new discovery ticks start until it is resumed.", schema: campaignIdSchema },
  { name: "resume_campaign", description: "Resume a paused campaign.", schema: campaignIdSchema },
  { name: "cancel_campaign", description: "Cancel a campaign owned by this workspace.", schema: campaignIdSchema },
  { name: "get_campaign_results", description: "Return campaign progress and discovered businesses for this workspace.", schema: campaignIdSchema },
  { name: "prepare_outreach", description: "Create an outreach draft. Never sends. Human approval is required in ProspectAI before any message goes out.", schema: outreachSchema },
  { name: "get_outreach_drafts", description: "List outreach drafts in this workspace. Sent messages are not created here.", schema: emptyShape },
  { name: "get_job_status", description: "Monitor an autonomous agent job: tasks, counters and activity.", schema: jobIdSchema },
  { name: "list_jobs", description: "List recent autonomous agent jobs for this workspace.", schema: emptyShape },
  { name: "list_campaigns", description: "List discovery campaigns in the authenticated workspace.", schema: emptyShape },
] as const;

export const MCP_TOOLS = MCP_TOOL_DEFS.map((tool) => ({
  name: tool.name,
  description: tool.description,
}));

async function assertCredits(
  organizationId: string,
  type: "discovery" | "research" | "website_generation" | "outreach",
) {
  const balance = await getCreditBalance(organizationId, type);
  if (balance.allocated !== -1 && balance.remaining <= 0) {
    throw new Error(`${type} credits are exhausted. A human must add credits in Billing before this tool can continue.`);
  }
}

async function dispatch(name: string, rawArgs: unknown, user: CurrentUser, organizationId: string): Promise<string> {
  switch (name) {
    case "discover_businesses": {
      const args = instructionSchema.parse(rawArgs);
      await assertCredits(organizationId, "discovery");
      const result = await createAgentJob({ user, instruction: args.instruction, confirmed: args.confirmed });
      if (result.ok) {
        await tickAgentJob(organizationId, result.job.id, user.id).catch(() => undefined);
        return text({
          jobId: result.job.id,
          campaignId: result.job.campaign_id,
          status: result.job.status,
          note: "Discovery continues in the background. Poll get_job_status. Nothing was sent.",
        });
      }
      return text(result);
    }
    case "get_business_details": {
      const args = businessIdSchema.parse(rawArgs);
      const business = await getBusiness(organizationId, args.businessId);
      if (!business) throw new Error("Business not found in this workspace.");
      const [inspection, research] = await Promise.all([
        getLatestInspection(organizationId, business.id),
        getLatestResearch(organizationId, business.id),
      ]);
      const score = scoreOpportunity({ business, inspection, research });
      return text({ business, inspection, research: research?.report ?? null, opportunity: score });
    }
    case "search_existing_leads": {
      const args = searchSchema.parse(rawArgs);
      const needle = args.query.toLowerCase();
      const leads = await listLeads(organizationId);
      const matches = leads.filter((lead) => {
        const hay = [lead.business?.name, lead.business?.city, lead.business?.industry, lead.business?.address]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return hay.includes(needle);
      });
      return text(
        matches.slice(0, 40).map((lead) => ({
          leadId: lead.id,
          businessId: lead.business_id,
          name: lead.business?.name ?? null,
          city: lead.business?.city ?? null,
          websiteStatus: lead.business?.website_status ?? null,
          stage: lead.stage,
          isSample: lead.business?.is_sample ?? false,
        })),
      );
    }
    case "inspect_website": {
      const args = inspectSchema.parse(rawArgs);
      const business = await getBusiness(organizationId, args.businessId);
      if (!business) throw new Error("Business not found in this workspace.");
      const result = await inspectWebsite({
        businessName: business.name,
        sourceUrl: args.url ?? business.website_url,
        isSample: business.is_sample,
      });
      await saveInspection({
        id: crypto.randomUUID(),
        business_id: business.id,
        organization_id: organizationId,
        url: result.url,
        verification_status: result.verificationStatus,
        http_status: result.httpStatus,
        is_reachable: result.isReachable,
        redirect_url: result.redirectUrl,
        mobile_score: result.mobileScore,
        performance_score: result.performanceScore,
        seo_score: result.seoScore,
        evidence: result.evidence,
        evidence_source: result.evidenceSource,
        confidence: result.confidence,
        inspected_at: new Date().toISOString(),
      });
      await updateBusinessWebsiteStatus(organizationId, business.id, result.verificationStatus, result.finalUrl ?? result.url);
      return text(result);
    }
    case "research_business": {
      const args = leadIdSchema.parse(rawArgs);
      await assertCredits(organizationId, "research");
      const lead = await getLead(organizationId, args.leadId);
      if (!lead?.business) throw new Error("Lead not found in this workspace.");
      const pipeline = await researchBusiness({
        organizationId,
        userId: user.id,
        leadId: lead.id,
        business: lead.business,
        userNotes: null,
      });
      return text({ leadId: lead.id, businessId: lead.business.id, ...pipeline });
    }
    case "score_opportunity": {
      const args = businessIdSchema.parse(rawArgs);
      const business = await getBusiness(organizationId, args.businessId);
      if (!business) throw new Error("Business not found in this workspace.");
      const [inspection, research] = await Promise.all([
        getLatestInspection(organizationId, business.id),
        getLatestResearch(organizationId, business.id),
      ]);
      return text({ businessId: business.id, name: business.name, ...scoreOpportunity({ business, inspection, research }) });
    }
    case "generate_website_demo": {
      const args = leadIdSchema.parse(rawArgs);
      await assertCredits(organizationId, "website_generation");
      const lead = await getLead(organizationId, args.leadId);
      if (!lead?.business) throw new Error("Lead not found in this workspace.");
      const research = await getLatestResearch(organizationId, lead.business.id);
      if (!research) throw new Error("Run research_business first so an architect brief exists.");
      const existing = (await listDemos(organizationId)).find((item) => item.lead_id === lead.id || item.business_id === lead.business_id);
      if (existing) {
        return text({ demoId: existing.demo_id, previewPath: existing.preview_path, reused: true, unofficial: true });
      }
      const demo = await generateDemoWebsite({
        organizationId,
        research,
        businessName: lead.business.name,
        industry: lead.business.industry,
        isSample: lead.business.is_sample,
        leadId: lead.id,
      });
      await saveDemo(demo);
      return text({ demoId: demo.demo_id, previewPath: demo.preview_path, unofficial: true });
    }
    case "get_generated_website": {
      const args = demoIdSchema.parse(rawArgs);
      const demo = await getDemo(organizationId, args.demoId);
      if (!demo) throw new Error("Demo not found in this workspace.");
      return text({
        demoId: demo.demo_id,
        previewPath: demo.preview_path,
        status: demo.status,
        businessName: demo.business_name,
        unofficial: true,
      });
    }
    case "deploy_website_demo": {
      const args = demoIdSchema.parse(rawArgs);
      const demo = (await listDemos(organizationId)).find((item) => item.demo_id === args.demoId || item.id === args.demoId);
      if (!demo) throw new Error("Demo not found in this workspace.");
      const existing = await listDeployments(organizationId);
      const live = existing.find((item) => item.demo_id === demo.demo_id);
      if (live?.status === "live") {
        return text({ demoId: demo.demo_id, previewPath: demo.preview_path, status: "live", note: "Already verified." });
      }
      const absolute = `${env.appUrl.replace(/\/$/, "")}${demo.preview_path}`;
      let ok = false;
      let error: string | null = null;
      try {
        const response = await fetch(absolute, { method: "GET", redirect: "manual" });
        ok = response.ok || response.status === 307 || response.status === 308;
        if (!ok) error = `Preview returned HTTP ${response.status}.`;
      } catch (caught) {
        error = caught instanceof Error ? caught.message : "Preview fetch failed.";
      }
      await saveDeployment({
        id: crypto.randomUUID(),
        organization_id: organizationId,
        website_id: demo.id,
        job_id: null,
        demo_id: demo.demo_id,
        preview_path: demo.preview_path,
        status: ok ? "live" : "failed",
        verified_at: ok ? new Date().toISOString() : null,
        last_error: ok ? null : error,
        created_at: new Date().toISOString(),
      });
      return text({ demoId: demo.demo_id, previewPath: demo.preview_path, status: ok ? "live" : "failed", error });
    }
    case "get_deployment_status": {
      const args = demoIdSchema.parse(rawArgs);
      const records = await listDeployments(organizationId);
      const demo = (await listDemos(organizationId)).find((item) => item.demo_id === args.demoId || item.id === args.demoId);
      const record = records.find((item) => item.demo_id === args.demoId || item.demo_id === demo?.demo_id);
      if (!record) throw new Error("No deployment record for that demo in this workspace.");
      return text(record);
    }
    case "create_campaign": {
      const args = createCampaignSchema.parse(rawArgs);
      await assertCredits(organizationId, "discovery");
      const campaign = await queueDiscoveryCampaign(user, {
        name: args.name,
        country: args.country,
        region: args.region,
        city: args.city,
        industry: args.industry,
        customCategory: args.customCategory,
        discoveryLimit: args.discoveryLimit,
        websiteStatusFilter: args.websiteStatusFilter,
      });
      return text({
        campaignId: campaign.id,
        status: campaign.status,
        note: "Queued. Poll get_campaign_status. Discovery does not depend on this MCP request staying open.",
      });
    }
    case "get_campaign_status": {
      const args = campaignIdSchema.parse(rawArgs);
      const campaign = await getCampaign(organizationId, args.campaignId);
      if (!campaign) throw new Error("Campaign not found in this workspace.");
      const job = await getLatestJob(campaign.id);
      return text({ campaign, job: job ? { id: job.id, status: job.status, lastError: job.last_error } : null });
    }
    case "pause_campaign": {
      const args = campaignIdSchema.parse(rawArgs);
      const campaign = await updateCampaignStatus(organizationId, args.campaignId, "paused");
      if (!campaign) throw new Error("Campaign not found in this workspace.");
      return text({ campaignId: campaign.id, status: campaign.status });
    }
    case "resume_campaign": {
      const args = campaignIdSchema.parse(rawArgs);
      const campaign = await updateCampaignStatus(organizationId, args.campaignId, "queued");
      if (!campaign) throw new Error("Campaign not found in this workspace.");
      return text({ campaignId: campaign.id, status: campaign.status });
    }
    case "cancel_campaign": {
      const args = campaignIdSchema.parse(rawArgs);
      const campaign = await updateCampaignStatus(organizationId, args.campaignId, "cancelled");
      if (!campaign) throw new Error("Campaign not found in this workspace.");
      return text({ campaignId: campaign.id, status: campaign.status });
    }
    case "get_campaign_results": {
      const args = campaignIdSchema.parse(rawArgs);
      const campaign = await getCampaign(organizationId, args.campaignId);
      if (!campaign) throw new Error("Campaign not found in this workspace.");
      const businesses = await listCampaignBusinesses(organizationId, campaign.id);
      return text({
        campaignId: campaign.id,
        status: campaign.status,
        progress: campaign.progress,
        businesses: businesses.map((item) => ({
          id: item.id,
          name: item.name,
          websiteStatus: item.website_status,
          city: item.city,
          isSample: item.is_sample,
        })),
      });
    }
    case "prepare_outreach": {
      const args = outreachSchema.parse(rawArgs);
      await assertCredits(organizationId, "outreach");
      const lead = await getLead(organizationId, args.leadId);
      if (!lead?.business) throw new Error("Lead not found in this workspace.");
      const existing = await listOutreach(organizationId);
      const draftExisting = existing.find((item) => item.lead_id === lead.id && item.status === "draft");
      if (draftExisting) {
        return text({ messageId: draftExisting.id, status: "draft", sent: false, reused: true, note: "Nothing was sent." });
      }
      const research = await getLatestResearch(organizationId, lead.business.id);
      const demo = (await listDemos(organizationId)).find((item) => item.lead_id === lead.id || item.business_id === lead.business_id);
      const draft = await createOutreachDraft({
        organizationId,
        leadId: lead.id,
        business: lead.business,
        research,
        demoPath: demo?.preview_path ?? null,
        channel: args.channel ?? (lead.business.email ? "email" : "whatsapp"),
        senderName: user.fullName || "ProspectAI",
      });
      await saveOutreach(draft);
      return text({
        messageId: draft.id,
        status: draft.status,
        sent: false,
        note: "Draft saved. Grok Bot cannot send this. Approve it in ProspectAI Outreach.",
      });
    }
    case "get_outreach_drafts": {
      emptyShape.parse(rawArgs ?? {});
      const messages = await listOutreach(organizationId);
      return text(
        messages.slice(0, 50).map((item) => ({
          id: item.id,
          leadId: item.lead_id,
          channel: item.channel,
          status: item.status,
          sent: Boolean(item.sent_at),
        })),
      );
    }
    case "get_job_status": {
      const args = jobIdSchema.parse(rawArgs);
      const bundle = await loadJobBundle(organizationId, args.jobId);
      if (!bundle) throw new Error("Job not found in this workspace.");
      return text({
        jobId: bundle.job.id,
        status: bundle.job.status,
        counters: bundle.job.counters,
        tasks: bundle.tasks.map((task) => ({ id: task.id, agent: task.agent, status: task.status, progress: task.progress })),
        activity: bundle.activity.slice(0, 20),
      });
    }
    case "list_jobs": {
      emptyShape.parse(rawArgs ?? {});
      const jobs = await listAgentJobs(organizationId);
      return text(jobs.slice(0, 20).map((job) => ({ jobId: job.id, status: job.status, instruction: job.instruction, counters: job.counters })));
    }
    case "list_campaigns": {
      const campaigns = await listCampaigns(organizationId);
      return text(campaigns.map((item) => ({ id: item.id, name: item.name, status: item.status, progress: item.progress })));
    }
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

export async function executeMcpTool(name: string, rawArgs: unknown, user: CurrentUser): Promise<string> {
  assertToolAllowed(name);
  assertRateLimit(user);
  const organizationId = requireOrganization(user);
  const key = typeof (rawArgs as { idempotencyKey?: unknown } | null)?.idempotencyKey === "string"
    ? (rawArgs as { idempotencyKey: string }).idempotencyKey
    : null;
  const mutating = !name.startsWith("get_") && name !== "search_existing_leads" && name !== "list_jobs" && name !== "list_campaigns";
  if (key && mutating) {
    const cached = await getIdempotentResult(organizationId, name, key);
    if (cached) return cached;
  }
  const result = await dispatch(name, rawArgs ?? {}, user, organizationId);
  if (key && mutating) await saveIdempotentResult(organizationId, name, key, result);
  return result;
}
