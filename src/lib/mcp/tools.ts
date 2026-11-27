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
import {
  getBusiness,
  getCampaign,
  getLatestInspection,
  getLatestResearch,
  getLead,
  listBusinesses,
  listCampaigns,
  listDemos,
  listLeads,
  saveDemo,
  saveInspection,
  updateBusinessWebsiteStatus,
} from "@/services/workspace/repository";
import type { CurrentUser } from "@/types";

const text = (value: unknown) => JSON.stringify(value, null, 2);

export const MCP_TOOLS = [
  {
    name: "discover_businesses",
    description:
      "Start a durable ProspectAI discovery job from a natural-language instruction. Execution continues in the background and does not send outreach.",
    inputSchema: {
      type: "object",
      properties: {
        instruction: { type: "string", description: "e.g. Find 20 construction companies in Kumasi without professional websites." },
        confirmed: { type: "boolean", description: "Set true if the user accepted a substantial credit estimate." },
      },
      required: ["instruction"],
    },
  },
  {
    name: "list_campaigns",
    description: "List discovery campaigns in the authenticated workspace.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "get_campaign_progress",
    description: "Read progress for one campaign owned by the authenticated organization.",
    inputSchema: {
      type: "object",
      properties: { campaignId: { type: "string" } },
      required: ["campaignId"],
    },
  },
  {
    name: "get_job_status",
    description: "Monitor an autonomous agent job: status, task progress, counters and recent activity.",
    inputSchema: {
      type: "object",
      properties: { jobId: { type: "string" } },
      required: ["jobId"],
    },
  },
  {
    name: "list_jobs",
    description: "List recent autonomous agent jobs for this workspace.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "list_leads",
    description: "List leads the authenticated organization is allowed to see.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "inspect_website",
    description:
      "Inspect a business website with SSRF protections. Missing directory URLs are classified unverified, never as proof of no website.",
    inputSchema: {
      type: "object",
      properties: {
        businessId: { type: "string" },
        url: { type: "string", description: "Optional URL override. Must be a public http(s) address." },
      },
      required: ["businessId"],
    },
  },
  {
    name: "research_business",
    description: "Compile a research report from verified records. Does not invent facts.",
    inputSchema: {
      type: "object",
      properties: { leadId: { type: "string" } },
      required: ["leadId"],
    },
  },
  {
    name: "score_opportunity",
    description: "Score a website opportunity 0–100 with written reasons. Not a conversion probability.",
    inputSchema: {
      type: "object",
      properties: { businessId: { type: "string" } },
      required: ["businessId"],
    },
  },
  {
    name: "generate_website_demo",
    description: "Generate an unofficial demo website from an existing research brief.",
    inputSchema: {
      type: "object",
      properties: { leadId: { type: "string" } },
      required: ["leadId"],
    },
  },
  {
    name: "deploy_website_demo",
    description: "Verify a generated demo preview URL and record deployment. Does not create a new hosting project.",
    inputSchema: {
      type: "object",
      properties: { demoId: { type: "string" } },
      required: ["demoId"],
    },
  },
  {
    name: "prepare_outreach_draft",
    description:
      "Create an email or WhatsApp-ready outreach draft. Never sends a message. Human approval is still required.",
    inputSchema: {
      type: "object",
      properties: {
        leadId: { type: "string" },
        channel: { type: "string", enum: ["email", "whatsapp"] },
      },
      required: ["leadId"],
    },
  },
] as const;

export type McpToolName = (typeof MCP_TOOLS)[number]["name"];

const instructionSchema = z.object({
  instruction: z.string().min(8).max(2000),
  confirmed: z.boolean().optional(),
});
const campaignIdSchema = z.object({ campaignId: z.string().uuid() });
const jobIdSchema = z.object({ jobId: z.string().uuid() });
const leadIdSchema = z.object({ leadId: z.string().uuid() });
const businessIdSchema = z.object({ businessId: z.string().uuid() });
const inspectSchema = z.object({
  businessId: z.string().uuid(),
  url: z.string().url().optional(),
});
const outreachSchema = z.object({
  leadId: z.string().uuid(),
  channel: z.enum(["email", "whatsapp"]).optional(),
});
const demoIdSchema = z.object({ demoId: z.string().min(4).max(80) });

function requireOrg(user: CurrentUser) {
  if (!user.organizationId) throw new Error("This connector token is not bound to a workspace.");
  return user.organizationId;
}

export async function executeMcpTool(name: string, rawArgs: unknown, user: CurrentUser): Promise<string> {
  const organizationId = requireOrg(user);
  switch (name) {
    case "discover_businesses": {
      const args = instructionSchema.parse(rawArgs);
      const result = await createAgentJob({ user, instruction: args.instruction, confirmed: args.confirmed });
      if (result.ok) {
        await tickAgentJob(organizationId, result.job.id, user.id).catch(() => undefined);
      }
      return text(result);
    }
    case "list_campaigns": {
      const campaigns = await listCampaigns(organizationId);
      return text(campaigns.map((item) => ({ id: item.id, name: item.name, status: item.status, progress: item.progress })));
    }
    case "get_campaign_progress": {
      const args = campaignIdSchema.parse(rawArgs);
      const campaign = await getCampaign(organizationId, args.campaignId);
      if (!campaign) throw new Error("Campaign not found in this workspace.");
      return text(campaign);
    }
    case "get_job_status": {
      const args = jobIdSchema.parse(rawArgs);
      const bundle = await loadJobBundle(organizationId, args.jobId);
      if (!bundle) throw new Error("Job not found in this workspace.");
      return text(bundle);
    }
    case "list_jobs": {
      const jobs = await listAgentJobs(organizationId);
      return text(jobs.slice(0, 20));
    }
    case "list_leads": {
      const leads = await listLeads(organizationId);
      return text(
        leads.slice(0, 50).map((lead) => ({
          leadId: lead.id,
          businessId: lead.business_id,
          name: lead.business?.name ?? null,
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
      const lead = await getLead(organizationId, args.leadId);
      if (!lead?.business) throw new Error("Lead not found in this workspace.");
      const research = await getLatestResearch(organizationId, lead.business.id);
      if (!research) throw new Error("Run research_business first so an architect brief exists.");
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
    case "deploy_website_demo": {
      const args = demoIdSchema.parse(rawArgs);
      const demo = (await listDemos(organizationId)).find((item) => item.demo_id === args.demoId || item.id === args.demoId);
      if (!demo) throw new Error("Demo not found in this workspace.");
      const existing = await listDeployments(organizationId);
      if (existing.some((item) => item.demo_id === demo.demo_id && item.status === "live")) {
        return text({ demoId: demo.demo_id, previewPath: demo.preview_path, status: "live", note: "Already verified." });
      }
      const absolute = `${env.appUrl.replace(/\/$/, "")}${demo.preview_path}`;
      let live = false;
      let error: string | null = null;
      try {
        const response = await fetch(absolute, { method: "GET", redirect: "manual" });
        live = response.ok || response.status === 307 || response.status === 308;
        if (!live) error = `Preview returned HTTP ${response.status}.`;
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
        status: live ? "live" : "failed",
        verified_at: live ? new Date().toISOString() : null,
        last_error: live ? null : error,
        created_at: new Date().toISOString(),
      });
      return text({ demoId: demo.demo_id, previewPath: demo.preview_path, status: live ? "live" : "failed", error });
    }
    case "prepare_outreach_draft": {
      const args = outreachSchema.parse(rawArgs);
      const lead = await getLead(organizationId, args.leadId);
      if (!lead?.business) throw new Error("Lead not found in this workspace.");
      const existing = await listOutreach(organizationId);
      if (existing.some((item) => item.lead_id === lead.id && item.status === "draft")) {
        return text({ note: "A draft already exists. Nothing was sent.", leadId: lead.id });
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
        note: "Draft saved. ProspectAI will not send this until a human approves it in Outreach.",
      });
    }
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}
