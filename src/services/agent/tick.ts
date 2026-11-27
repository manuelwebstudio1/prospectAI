import { env } from "@/lib/env";
import { tickDiscovery } from "@/services/jobs/process-discovery";
import { researchBusiness } from "@/services/research/run";
import { generateDemoWebsite } from "@/services/demos/generate";
import { createOutreachDraft } from "@/services/outreach/draft";
import { saveOutreach, listOutreach } from "@/services/workspace/outreach-store";
import { consumeCredit, refundCredit, listCampaignBusinesses, listLeads, listDemos, saveDemo, getLatestInspection, getLatestResearch, updateCampaignStatus } from "@/services/workspace/repository";
import { scoreOpportunity } from "@/services/agent/score";
import {
  appendActivity,
  getAgentJob,
  listAgentTasks,
  listDeployments,
  listOpportunityScores,
  listRunnableAgentJobs,
  recordAgentUsage,
  saveAgentJob,
  saveAgentTask,
  saveDeployment,
  saveOpportunityScore,
  type StoreOpts,
} from "@/services/agent/store";
import type { AgentJobRecord, AgentTaskRecord } from "@/services/agent/types";
import type { BusinessRecord } from "@/services/workspace/types";

const LOCK_MS = 50_000;
const MAX_ATTEMPTS = 3;

function nowIso() {
  return new Date().toISOString();
}

function lockStale(job: AgentJobRecord) {
  if (!job.locked_at) return true;
  return Date.now() - new Date(job.locked_at).getTime() > LOCK_MS;
}

function qualifies(business: BusinessRecord, filter: string) {
  if (filter === "any") return true;
  if (filter === "poor_website") return business.website_status === "poor_website";
  return business.website_status === "no_website" || business.website_status === "unverified";
}

async function log(job: AgentJobRecord, task: AgentTaskRecord | null, message: string, level: "info" | "warn" | "error" = "info", opts?: StoreOpts) {
  await appendActivity(
    {
      id: crypto.randomUUID(),
      job_id: job.id,
      organization_id: job.organization_id,
      task_id: task?.id ?? null,
      message,
      level,
      created_at: nowIso(),
    },
    opts,
  );
}

async function businessesForJob(job: AgentJobRecord): Promise<BusinessRecord[]> {
  if (job.campaign_id) {
    return listCampaignBusinesses(job.organization_id, job.campaign_id);
  }
  const leads = await listLeads(job.organization_id);
  return leads.map((lead) => lead.business).filter((item): item is BusinessRecord => Boolean(item));
}

async function leadIdFor(organizationId: string, businessId: string) {
  const leads = await listLeads(organizationId);
  return leads.find((item) => item.business_id === businessId)?.id ?? null;
}

function nextOpenTask(tasks: AgentTaskRecord[]) {
  return (
    tasks.find((item) => item.status === "running" || item.status === "retrying" || item.status === "queued") ?? null
  );
}

async function finishTask(task: AgentTaskRecord, opts?: StoreOpts) {
  task.status = "succeeded";
  task.progress = 100;
  task.finished_at = nowIso();
  await saveAgentTask(task, opts);
}

async function failRecoverable(job: AgentJobRecord, task: AgentTaskRecord, error: string, opts?: StoreOpts) {
  task.attempts += 1;
  task.last_error = error;
  if (task.attempts >= MAX_ATTEMPTS) {
    task.status = "failed";
    task.finished_at = nowIso();
    job.status = "failed";
    job.last_error = error;
    job.completed_at = nowIso();
    job.locked_at = null;
    job.counters.failed += 1;
    await saveAgentTask(task, opts);
    await saveAgentJob(job, opts);
    await log(job, task, error, "error", opts);
    return;
  }
  task.status = "retrying";
  job.status = "queued";
  job.last_error = error;
  job.locked_at = null;
  await saveAgentTask(task, opts);
  await saveAgentJob(job, opts);
  await log(job, task, `Retrying (${task.attempts}/${MAX_ATTEMPTS}): ${error}`, "warn", opts);
}

async function pauseForCredits(job: AgentJobRecord, task: AgentTaskRecord, message: string, opts?: StoreOpts) {
  task.status = "queued";
  job.status = "paused";
  job.last_error = message;
  job.locked_at = null;
  await saveAgentTask(task, opts);
  await saveAgentJob(job, opts);
  await log(job, task, message, "warn", opts);
}

export type AgentTickResult = {
  job: AgentJobRecord | null;
  message: string;
};

async function runTaskSlice(job: AgentJobRecord, task: AgentTaskRecord, userId: string, opts?: StoreOpts): Promise<string> {
  const filter = job.plan.websiteFilter;
  if (task.agent === "discovery") {
    if (!job.campaign_id) {
      await finishTask(task, opts);
      return "No discovery campaign required.";
    }
    const result = await tickDiscovery(job.organization_id, job.campaign_id);
    job.counters.discovered = result.campaign.progress.discovered;
    job.counters.analyzed = result.campaign.progress.processed;
    task.progress = Math.min(95, Math.round((result.campaign.progress.processed / Math.max(job.plan.limit, 1)) * 100));
    task.status = "running";
    task.started_at = task.started_at ?? nowIso();
    await saveAgentTask(task, opts);
    await saveAgentJob(job, opts);
    await log(job, task, result.message, "info", opts);
    if (["completed", "failed", "cancelled"].includes(result.campaign.status)) {
      if (result.campaign.status === "failed") {
        await failRecoverable(job, task, result.campaign.last_error ?? "Discovery failed.", opts);
        return result.message;
      }
      await finishTask(task, opts);
      return result.message;
    }
    return result.message;
  }

  if (task.agent === "inspection") {
    const businesses = await businessesForJob(job);
    job.counters.analyzed = businesses.length;
    await log(job, task, `Website inspection finished for ${businesses.length} businesses during discovery.`, "info", opts);
    await finishTask(task, opts);
    await saveAgentJob(job, opts);
    return "Inspection task complete.";
  }

  if (task.agent === "research") {
    const businesses = (await businessesForJob(job)).filter((item) => qualifies(item, filter));
    const target = businesses[task.cursor];
    if (!target) {
      await finishTask(task, opts);
      return "Research complete.";
    }
    const existing = await getLatestResearch(job.organization_id, target.id);
    if (existing) {
      task.cursor += 1;
      job.counters.researched += 1;
      task.progress = Math.min(99, Math.round((task.cursor / Math.max(businesses.length, 1)) * 100));
      await saveAgentTask(task, opts);
      await saveAgentJob(job, opts);
      await log(job, task, `Research already on file for ${target.name}.`, "info", opts);
      return `Skipped existing research for ${target.name}.`;
    }
    const leadId = await leadIdFor(job.organization_id, target.id);
    if (!leadId) {
      task.cursor += 1;
      await saveAgentTask(task, opts);
      return `No lead record for ${target.name}.`;
    }
    await log(job, task, `Researching ${target.name}.`, "info", opts);
    try {
      await researchBusiness({
        organizationId: job.organization_id,
        userId,
        leadId,
        business: target,
        userNotes: null,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Research failed.";
      if (/exhausted/i.test(message)) {
        await pauseForCredits(job, task, message, opts);
        return message;
      }
      await refundCredit(job.organization_id, "research").catch(() => undefined);
      throw error;
    }
    await recordAgentUsage({ organizationId: job.organization_id, jobId: job.id, creditType: "research", opts });
    task.cursor += 1;
    job.counters.researched += 1;
    task.progress = Math.min(99, Math.round((task.cursor / Math.max(businesses.length, 1)) * 100));
    task.status = "running";
    await saveAgentTask(task, opts);
    await saveAgentJob(job, opts);
    return `Research saved for ${target.name}.`;
  }

  if (task.agent === "score") {
    const businesses = (await businessesForJob(job)).filter((item) => qualifies(item, filter));
    const target = businesses[task.cursor];
    if (!target) {
      await finishTask(task, opts);
      return "Scoring complete.";
    }
    const [inspection, research] = await Promise.all([
      getLatestInspection(job.organization_id, target.id),
      getLatestResearch(job.organization_id, target.id),
    ]);
    const scored = scoreOpportunity({ business: target, inspection, research });
    await saveOpportunityScore(
      {
        id: crypto.randomUUID(),
        organization_id: job.organization_id,
        business_id: target.id,
        job_id: job.id,
        score: scored.score,
        reasons: scored.reasons,
        created_at: nowIso(),
      },
      opts,
    );
    task.cursor += 1;
    job.counters.scored += 1;
    task.progress = Math.min(99, Math.round((task.cursor / Math.max(businesses.length, 1)) * 100));
    task.status = "running";
    await saveAgentTask(task, opts);
    await saveAgentJob(job, opts);
    await log(job, task, `Opportunity score ${scored.score}/100 for ${target.name}.`, "info", opts);
    return `Scored ${target.name}.`;
  }

  if (task.agent === "generate") {
    const businesses = (await businessesForJob(job)).filter((item) => qualifies(item, filter));
    const scores = await listOpportunityScores(job.organization_id, opts);
    const ranked = [...businesses].sort((a, b) => {
      const sa = scores.find((item) => item.business_id === a.id)?.score ?? 0;
      const sb = scores.find((item) => item.business_id === b.id)?.score ?? 0;
      return sb - sa;
    });
    const demos = await listDemos(job.organization_id);
    const target = ranked.find((item, index) => index >= task.cursor && !demos.some((demo) => demo.business_id === item.id));
    if (!target) {
      task.cursor = ranked.length;
      await finishTask(task, opts);
      return "Demo generation complete.";
    }
    const research = await getLatestResearch(job.organization_id, target.id);
    if (!research) {
      task.cursor += 1;
      await saveAgentTask(task, opts);
      await log(job, task, `No research report for ${target.name}; demo skipped.`, "warn", opts);
      return `Skipped ${target.name} — research required.`;
    }
    await log(job, task, `Generating a demo for ${target.name}.`, "info", opts);
    try {
      const demo = await generateDemoWebsite({
        organizationId: job.organization_id,
        research,
        businessName: target.name,
        industry: target.industry,
        isSample: target.is_sample,
        leadId: await leadIdFor(job.organization_id, target.id),
      });
      await saveDemo(demo);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Demo generation failed.";
      if (/exhausted/i.test(message)) {
        await pauseForCredits(job, task, message, opts);
        return message;
      }
      await refundCredit(job.organization_id, "website_generation").catch(() => undefined);
      throw error;
    }
    await recordAgentUsage({ organizationId: job.organization_id, jobId: job.id, creditType: "website_generation", opts });
    task.cursor += 1;
    job.counters.generated += 1;
    task.progress = Math.min(99, Math.round((task.cursor / Math.max(ranked.length, 1)) * 100));
    task.status = "running";
    await saveAgentTask(task, opts);
    await saveAgentJob(job, opts);
    return `Demo generated for ${target.name}.`;
  }

  if (task.agent === "deploy") {
    const demos = await listDemos(job.organization_id);
    const existing = await listDeployments(job.organization_id, opts);
    const pending = demos.filter((demo) => !existing.some((item) => item.demo_id === demo.demo_id));
    const target = pending[0];
    if (!target) {
      await finishTask(task, opts);
      return "Deployments complete.";
    }
    const previewPath = target.preview_path;
    const absolute = `${env.appUrl.replace(/\/$/, "")}${previewPath}`;
    let live = false;
    let error: string | null = null;
    try {
      const response = await fetch(absolute, { method: "GET", redirect: "manual" });
      live = response.ok || response.status === 307 || response.status === 308;
      if (!live) error = `Preview returned HTTP ${response.status}.`;
    } catch (caught) {
      error = caught instanceof Error ? caught.message : "Preview fetch failed.";
    }
    await saveDeployment(
      {
        id: crypto.randomUUID(),
        organization_id: job.organization_id,
        website_id: target.id,
        job_id: job.id,
        demo_id: target.demo_id,
        preview_path: previewPath,
        status: live ? "live" : "failed",
        verified_at: live ? nowIso() : null,
        last_error: live ? null : error,
        created_at: nowIso(),
      },
      opts,
    );
    if (live) {
      job.counters.deployed += 1;
      await log(job, task, `Demo deployment successful: ${previewPath}`, "info", opts);
    } else {
      job.counters.failed += 1;
      await log(job, task, `Deployment verification failed for ${target.demo_id}: ${error}`, "warn", opts);
    }
    task.progress = Math.min(99, Math.round((job.counters.deployed / Math.max(demos.length, 1)) * 100));
    task.status = "running";
    await saveAgentTask(task, opts);
    await saveAgentJob(job, opts);
    return live ? `Published ${previewPath}` : `Could not verify ${previewPath}`;
  }

  if (task.agent === "outreach") {
    const leads = await listLeads(job.organization_id);
    const demos = await listDemos(job.organization_id);
    const existing = await listOutreach(job.organization_id);
    const candidate = leads.find((lead) => {
      if (!lead.business) return false;
      if (!qualifies(lead.business, filter) && job.plan.mode === "campaign") return false;
      const hasDemo = demos.some((demo) => demo.business_id === lead.business_id || demo.lead_id === lead.id);
      if (job.plan.includeGenerate && !hasDemo) return false;
      return !existing.some((message) => message.lead_id === lead.id && message.status === "draft");
    });
    if (!candidate?.business) {
      await finishTask(task, opts);
      return "Outreach drafts complete. Nothing was sent.";
    }
    const allowed = await consumeCredit(job.organization_id, "outreach");
    if (!allowed) {
      await pauseForCredits(job, task, "Outreach credits are exhausted.", opts);
      return "Outreach credits are exhausted.";
    }
    const research = await getLatestResearch(job.organization_id, candidate.business.id);
    const demo = demos.find((item) => item.business_id === candidate.business_id || item.lead_id === candidate.id);
    try {
      const draft = await createOutreachDraft({
        organizationId: job.organization_id,
        leadId: candidate.id,
        business: candidate.business,
        research,
        demoPath: demo?.preview_path ?? null,
        channel: candidate.business.email ? "email" : "whatsapp",
        senderName: "ProspectAI",
      });
      await saveOutreach(draft);
    } catch (error) {
      await refundCredit(job.organization_id, "outreach").catch(() => undefined);
      throw error;
    }
    await recordAgentUsage({ organizationId: job.organization_id, jobId: job.id, creditType: "outreach", opts });
    job.counters.outreachDrafts += 1;
    task.progress = Math.min(99, job.counters.outreachDrafts * 10);
    task.status = "running";
    await saveAgentTask(task, opts);
    await saveAgentJob(job, opts);
    await log(job, task, `Outreach draft prepared for ${candidate.business.name}. Not sent — approval required.`, "info", opts);
    return `Draft prepared for ${candidate.business.name}.`;
  }

  if (task.agent === "report") {
    const summary = `Finished. Discovered ${job.counters.discovered}, researched ${job.counters.researched}, scored ${job.counters.scored}, demos ${job.counters.generated}, deployed ${job.counters.deployed}, outreach drafts ${job.counters.outreachDrafts}, failed ${job.counters.failed}.`;
    await log(job, task, summary, "info", opts);
    await finishTask(task, opts);
    job.status = "completed";
    job.completed_at = nowIso();
    job.locked_at = null;
    await saveAgentJob(job, opts);
    return summary;
  }

  await finishTask(task, opts);
  return `Unknown agent ${task.agent} skipped.`;
}

export async function tickAgentJob(organizationId: string, jobId: string, userId: string, opts?: StoreOpts): Promise<AgentTickResult> {
  const job = await getAgentJob(organizationId, jobId, opts);
  if (!job) return { job: null, message: "Job not found." };
  if (job.status === "paused") return { job, message: "Job is paused." };
  if (job.status === "cancelled") return { job, message: "Job was cancelled." };
  if (job.status === "completed" || job.status === "failed") return { job, message: `Job already ${job.status}.` };
  if (!lockStale(job)) return { job, message: "Job is already running on another worker." };

  job.locked_at = nowIso();
  job.status = "running";
  job.started_at = job.started_at ?? nowIso();
  await saveAgentJob(job, opts);

  const tasks = await listAgentTasks(job.id, opts);
  const task = nextOpenTask(tasks);
  if (!task) {
    job.status = "completed";
    job.completed_at = nowIso();
    job.locked_at = null;
    await saveAgentJob(job, opts);
    return { job, message: "All tasks complete." };
  }

  try {
    const message = await runTaskSlice(job, task, userId, opts);
    const fresh = await getAgentJob(organizationId, jobId, opts);
    if (fresh && fresh.status === "running") {
      fresh.locked_at = null;
      const remaining = (await listAgentTasks(job.id, opts)).some((item) =>
        ["queued", "running", "retrying"].includes(item.status),
      );
      if (!remaining) {
        fresh.status = "completed";
        fresh.completed_at = nowIso();
      } else {
        fresh.status = "queued";
      }
      await saveAgentJob(fresh, opts);
      return { job: fresh, message };
    }
    return { job: fresh, message };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Task failed.";
    await failRecoverable(job, task, message, opts);
    return { job, message };
  }
}

export async function tickOrganizationJobs(organizationId: string, userId: string, opts?: StoreOpts) {
  const jobs = (await listRunnableAgentJobs(opts)).filter((item) => item.organization_id === organizationId);
  const target = jobs[0];
  if (!target) return { job: null, message: "No runnable agent jobs." };
  return tickAgentJob(organizationId, target.id, userId, opts);
}

export async function tickAllJobs() {
  const jobs = await listRunnableAgentJobs({ privileged: true });
  const results: AgentTickResult[] = [];
  for (const job of jobs.slice(0, 5)) {
    results.push(await tickAgentJob(job.organization_id, job.id, job.created_by ?? "worker", { privileged: true }));
  }
  return results;
}

export async function controlAgentJob(
  organizationId: string,
  jobId: string,
  action: "pause" | "resume" | "cancel" | "retry",
) {
  const job = await getAgentJob(organizationId, jobId);
  if (!job) throw new Error("Job not found.");
  if (action === "pause") {
    job.status = "paused";
    job.locked_at = null;
    if (job.campaign_id) await updateCampaignStatus(organizationId, job.campaign_id, "paused");
    await saveAgentJob(job);
    return job;
  }
  if (action === "cancel") {
    job.status = "cancelled";
    job.completed_at = nowIso();
    job.locked_at = null;
    if (job.campaign_id) await updateCampaignStatus(organizationId, job.campaign_id, "cancelled");
    const tasks = await listAgentTasks(job.id);
    for (const task of tasks) {
      if (task.status === "queued" || task.status === "running" || task.status === "retrying") {
        task.status = "cancelled";
        await saveAgentTask(task);
      }
    }
    await saveAgentJob(job);
    return job;
  }
  if (action === "resume") {
    if (job.status !== "paused" && job.status !== "failed") throw new Error("Only paused or failed jobs can be resumed.");
    job.status = "queued";
    job.last_error = null;
    job.locked_at = null;
    if (job.campaign_id) await updateCampaignStatus(organizationId, job.campaign_id, "queued");
    await saveAgentJob(job);
    return job;
  }
  const tasks = await listAgentTasks(job.id);
  const failed = tasks.find((item) => item.status === "failed" || item.status === "retrying");
  if (failed) {
    failed.status = "queued";
    failed.last_error = null;
    await saveAgentTask(failed);
  }
  job.status = "queued";
  job.last_error = null;
  job.locked_at = null;
  await saveAgentJob(job);
  return job;
}
