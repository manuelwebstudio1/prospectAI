import { queueDiscoveryCampaign } from "@/services/discovery/create-campaign";
import { parseInstruction, CONFIRMATION_CREDIT_THRESHOLD } from "@/services/agent/parse-instruction";
import { emptyCounters, type AgentJobRecord, type AgentPlan, type AgentTaskRecord } from "@/services/agent/types";
import { insertAgentJob, listDeployments, listOpportunityScores } from "@/services/agent/store";
import { getCreditBalance, listBusinesses, listDemos } from "@/services/workspace/repository";
import type { CurrentUser } from "@/types";

export type CreateAgentJobResult =
  | { ok: true; job: AgentJobRecord; needsConfirmation?: false }
  | { ok: false; code: "missing_fields" | "needs_confirmation" | "insufficient_credits" | "conversation"; error: string; plan: AgentPlan; answer?: string };

function nowIso() {
  return new Date().toISOString();
}

function task(
  jobId: string,
  organizationId: string,
  sort: number,
  agent: string,
  title: string,
): AgentTaskRecord {
  return {
    id: crypto.randomUUID(),
    job_id: jobId,
    organization_id: organizationId,
    agent,
    title,
    sort_order: sort,
    status: "queued",
    progress: 0,
    attempts: 0,
    cursor: 0,
    last_error: null,
    started_at: null,
    finished_at: null,
    created_at: nowIso(),
  };
}

export function buildTaskList(jobId: string, organizationId: string, plan: AgentPlan): AgentTaskRecord[] {
  const items: AgentTaskRecord[] = [];
  let order = 0;
  const add = (agent: string, title: string) => {
    items.push(task(jobId, organizationId, order, agent, title));
    order += 1;
  };
  if (plan.mode === "campaign") {
    add("discovery", `Discover ${plan.limit} ${plan.industry ?? "businesses"} in ${plan.city ?? "the selected city"}`);
    add("inspection", "Inspect website availability and quality");
  }
  if (plan.includeResearch) add("research", "Research qualified businesses");
  if (plan.includeResearch || plan.includeGenerate) add("score", "Score website opportunities");
  if (plan.includeGenerate) {
    add("generate", "Generate personalized website demos");
    add("deploy", "Publish verified demo previews");
  }
  if (plan.includeOutreach) add("outreach", "Prepare outreach drafts for approval");
  add("report", "Produce a final campaign report");
  return items;
}

export async function answerWorkspaceQuery(organizationId: string, plan: AgentPlan): Promise<string> {
  if (plan.queryKind === "deployed") {
    const [deployments, demos] = await Promise.all([listDeployments(organizationId), listDemos(organizationId)]);
    const live = deployments.filter((item) => item.status === "live");
    if (!live.length && !demos.length) {
      return "No demo websites have been deployed yet in this workspace.";
    }
    const lines = (live.length ? live : demos.map((demo) => ({
      demo_id: demo.demo_id,
      preview_path: demo.preview_path,
      status: demo.status,
    }))).slice(0, 12).map((item) => `- ${item.demo_id}: ${item.preview_path} (${"status" in item ? item.status : "ready"})`);
    return `Deployed or generated demos in your workspace:\n${lines.join("\n")}\nWildcard custom subdomains are not configured; previews use /d/[demoId].`;
  }
  if (plan.queryKind === "score") {
    const scores = await listOpportunityScores(organizationId);
    const businesses = await listBusinesses(organizationId);
    const needle = (plan.querySubject ?? "").toLowerCase();
    const match = businesses.find((item) => item.name.toLowerCase().includes(needle)) ?? businesses[0];
    if (!match) return "There are no scored businesses in this workspace yet.";
    const score = scores.find((item) => item.business_id === match.id);
    if (!score) return `${match.name} does not have an opportunity score yet. Run research first.`;
    return `${match.name} scored ${score.score}/100.\n${score.reasons.map((reason) => `- ${reason}`).join("\n")}`;
  }
  const businesses = await listBusinesses(organizationId);
  const demos = await listDemos(organizationId);
  return `Workspace snapshot: ${businesses.length} businesses on file, ${demos.length} demos generated. Open the Agent Command Center to start a new campaign.`;
}

export async function createAgentJob(input: {
  user: CurrentUser;
  instruction: string;
  confirmed?: boolean;
}): Promise<CreateAgentJobResult> {
  const organizationId = input.user.organizationId;
  if (!organizationId) {
    throw new Error("Complete onboarding before running the agent.");
  }
  const plan = parseInstruction(input.instruction);
  if (plan.mode === "query") {
    const answer = await answerWorkspaceQuery(organizationId, plan);
    return { ok: false, code: "conversation", error: answer, plan, answer };
  }
  if (plan.missing.length) {
    return {
      ok: false,
      code: "missing_fields",
      error: `I need a ${plan.missing.join(" and ")} before I can start. Example: “Find 20 construction companies in Kumasi without professional websites.”`,
      plan,
    };
  }

  const buckets = await Promise.all([
    getCreditBalance(organizationId, "discovery"),
    getCreditBalance(organizationId, "research"),
    getCreditBalance(organizationId, "website_generation"),
    getCreditBalance(organizationId, "outreach"),
  ]);
  const remaining = {
    discovery: buckets[0].allocated === -1 ? Number.POSITIVE_INFINITY : buckets[0].remaining,
    research: buckets[1].allocated === -1 ? Number.POSITIVE_INFINITY : buckets[1].remaining,
    website_generation: buckets[2].allocated === -1 ? Number.POSITIVE_INFINITY : buckets[2].remaining,
    outreach: buckets[3].allocated === -1 ? Number.POSITIVE_INFINITY : buckets[3].remaining,
  };
  if (plan.estimatedCredits.discovery > remaining.discovery) {
    return {
      ok: false,
      code: "insufficient_credits",
      error: `Discovery would use up to ${plan.estimatedCredits.discovery} credits; ${buckets[0].remaining} remain.`,
      plan,
    };
  }
  if (plan.estimatedCredits.total >= CONFIRMATION_CREDIT_THRESHOLD && !input.confirmed) {
    return {
      ok: false,
      code: "needs_confirmation",
      error: `This run may use up to ${plan.estimatedCredits.total} credits (discovery ${plan.estimatedCredits.discovery}, research ${plan.estimatedCredits.research}, demos ${plan.estimatedCredits.website_generation}, outreach ${plan.estimatedCredits.outreach}). Confirm to start.`,
      plan,
    };
  }

  let campaignId: string | null = null;
  if (plan.mode === "campaign") {
    const campaign = await queueDiscoveryCampaign(input.user, {
      name: `${plan.industry} · ${plan.city}`,
      country: plan.countryCode,
      region: plan.region ?? undefined,
      city: plan.city!,
      industry: plan.industry!,
      customCategory: undefined,
      discoveryLimit: plan.limit,
      websiteStatusFilter: plan.websiteFilter === "any" ? "any" : plan.websiteFilter,
    });
    campaignId = campaign.id;
  }

  const created = nowIso();
  const job: AgentJobRecord = {
    id: crypto.randomUUID(),
    organization_id: organizationId,
    created_by: input.user.id,
    campaign_id: campaignId,
    instruction: input.instruction.trim(),
    status: "queued",
    plan,
    counters: emptyCounters(),
    last_error: null,
    locked_at: null,
    started_at: null,
    completed_at: null,
    created_at: created,
    updated_at: created,
  };
  const tasks = buildTaskList(job.id, organizationId, plan);
  await insertAgentJob(job, tasks, `Queued: ${plan.objective}`);
  return { ok: true, job };
}
