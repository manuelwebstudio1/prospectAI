import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseServerClient, createSupabaseServiceClient } from "@/lib/supabase/server";
import { mutateLocalWorkspace, readLocalWorkspace } from "@/lib/dev/local-workspace";
import {
  emptyCounters,
  type AgentActivityRecord,
  type AgentJobRecord,
  type AgentJobStatus,
  type AgentTaskRecord,
  type AgentTaskStatus,
  type DeploymentRecord,
  type OpportunityScoreRecord,
} from "@/services/agent/types";

export type StoreOpts = { privileged?: boolean };

const ACTIVE_JOB: AgentJobStatus[] = ["queued", "running"];

function nowIso() {
  return new Date().toISOString();
}

async function db(opts?: StoreOpts) {
  if (opts?.privileged) {
    return (await createSupabaseServiceClient()) ?? (await createSupabaseServerClient());
  }
  return createSupabaseServerClient();
}

function asJob(row: Record<string, unknown>): AgentJobRecord {
  return {
    id: String(row.id),
    organization_id: String(row.organization_id),
    created_by: (row.created_by as string | null) ?? null,
    campaign_id: (row.campaign_id as string | null) ?? null,
    instruction: String(row.instruction ?? ""),
    status: row.status as AgentJobStatus,
    plan: (row.plan ?? {}) as AgentJobRecord["plan"],
    counters: { ...emptyCounters(), ...((row.counters ?? {}) as object) },
    last_error: (row.last_error as string | null) ?? null,
    locked_at: (row.locked_at as string | null) ?? null,
    started_at: (row.started_at as string | null) ?? null,
    completed_at: (row.completed_at as string | null) ?? null,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at ?? row.created_at),
  };
}

function asTask(row: Record<string, unknown>): AgentTaskRecord {
  return {
    id: String(row.id),
    job_id: String(row.job_id),
    organization_id: String(row.organization_id),
    agent: String(row.agent),
    title: String(row.title),
    sort_order: Number(row.sort_order ?? 0),
    status: row.status as AgentTaskStatus,
    progress: Number(row.progress ?? 0),
    attempts: Number(row.attempts ?? 0),
    cursor: Number(row.cursor ?? 0),
    last_error: (row.last_error as string | null) ?? null,
    started_at: (row.started_at as string | null) ?? null,
    finished_at: (row.finished_at as string | null) ?? null,
    created_at: String(row.created_at),
  };
}

export async function insertAgentJob(
  job: AgentJobRecord,
  tasks: AgentTaskRecord[],
  firstLog: string,
  opts?: StoreOpts,
) {
  if (!isSupabaseConfigured()) {
    await mutateLocalWorkspace((workspace) => {
      workspace.agentJobs.unshift(job);
      workspace.agentTasks.push(...tasks);
      workspace.agentActivity.unshift({
        id: crypto.randomUUID(),
        job_id: job.id,
        organization_id: job.organization_id,
        task_id: null,
        message: firstLog,
        level: "info",
        created_at: nowIso(),
      });
    });
    return;
  }
  const supabase = await db(opts);
  if (!supabase) throw new Error("Database is not configured.");
  const { error } = await supabase.from("agent_jobs").insert({
    id: job.id,
    organization_id: job.organization_id,
    created_by: job.created_by,
    campaign_id: job.campaign_id,
    instruction: job.instruction,
    status: job.status,
    plan: job.plan,
    counters: job.counters,
    last_error: job.last_error,
  });
  if (error) throw new Error(error.message);
  const { error: taskError } = await supabase.from("agent_tasks").insert(
    tasks.map((task) => ({
      id: task.id,
      job_id: task.job_id,
      organization_id: task.organization_id,
      agent: task.agent,
      title: task.title,
      sort_order: task.sort_order,
      status: task.status,
      progress: task.progress,
      attempts: task.attempts,
      cursor: task.cursor,
    })),
  );
  if (taskError) throw new Error(taskError.message);
  await appendActivity(
    {
      id: crypto.randomUUID(),
      job_id: job.id,
      organization_id: job.organization_id,
      task_id: null,
      message: firstLog,
      level: "info",
      created_at: nowIso(),
    },
    opts,
  );
}

export async function listAgentJobs(organizationId: string, opts?: StoreOpts): Promise<AgentJobRecord[]> {
  if (!isSupabaseConfigured()) {
    const workspace = await readLocalWorkspace();
    return workspace.agentJobs
      .filter((item) => item.organization_id === organizationId)
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  }
  const supabase = await db(opts);
  const { data } = (await supabase
    ?.from("agent_jobs")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })) ?? { data: [] };
  return (data ?? []).map((row) => asJob(row as Record<string, unknown>));
}

export async function listRunnableAgentJobs(opts?: StoreOpts): Promise<AgentJobRecord[]> {
  if (!isSupabaseConfigured()) {
    const workspace = await readLocalWorkspace();
    return workspace.agentJobs.filter((item) => ACTIVE_JOB.includes(item.status));
  }
  const supabase = await db({ privileged: true, ...opts });
  const { data } = (await supabase
    ?.from("agent_jobs")
    .select("*")
    .in("status", ACTIVE_JOB)
    .order("created_at", { ascending: true })
    .limit(20)) ?? { data: [] };
  return (data ?? []).map((row) => asJob(row as Record<string, unknown>));
}

export async function getAgentJob(
  organizationId: string,
  jobId: string,
  opts?: StoreOpts,
): Promise<AgentJobRecord | null> {
  const jobs = await listAgentJobs(organizationId, opts);
  return jobs.find((item) => item.id === jobId) ?? null;
}

export async function listAgentTasks(jobId: string, opts?: StoreOpts): Promise<AgentTaskRecord[]> {
  if (!isSupabaseConfigured()) {
    const workspace = await readLocalWorkspace();
    return workspace.agentTasks.filter((item) => item.job_id === jobId).sort((a, b) => a.sort_order - b.sort_order);
  }
  const supabase = await db(opts);
  const { data } = (await supabase
    ?.from("agent_tasks")
    .select("*")
    .eq("job_id", jobId)
    .order("sort_order", { ascending: true })) ?? { data: [] };
  return (data ?? []).map((row) => asTask(row as Record<string, unknown>));
}

export async function listActivity(jobId: string, opts?: StoreOpts): Promise<AgentActivityRecord[]> {
  if (!isSupabaseConfigured()) {
    const workspace = await readLocalWorkspace();
    return workspace.agentActivity
      .filter((item) => item.job_id === jobId)
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .slice(0, 80);
  }
  const supabase = await db(opts);
  const { data } = (await supabase
    ?.from("agent_activity_logs")
    .select("*")
    .eq("job_id", jobId)
    .order("created_at", { ascending: false })
    .limit(80)) ?? { data: [] };
  return (data ?? []).map((row) => ({
    id: String(row.id),
    job_id: String(row.job_id),
    organization_id: String(row.organization_id),
    task_id: (row.task_id as string | null) ?? null,
    message: String(row.message),
    level: (row.level as AgentActivityRecord["level"]) ?? "info",
    created_at: String(row.created_at),
  }));
}

export async function saveAgentJob(job: AgentJobRecord, opts?: StoreOpts) {
  job.updated_at = nowIso();
  if (!isSupabaseConfigured()) {
    await mutateLocalWorkspace((workspace) => {
      workspace.agentJobs = workspace.agentJobs.map((item) => (item.id === job.id ? job : item));
    });
    return;
  }
  const supabase = await db(opts);
  const { error } = await supabase!.from("agent_jobs").update({
    status: job.status,
    plan: job.plan,
    counters: job.counters,
    last_error: job.last_error,
    locked_at: job.locked_at,
    started_at: job.started_at,
    completed_at: job.completed_at,
    campaign_id: job.campaign_id,
    updated_at: job.updated_at,
  }).eq("id", job.id);
  if (error) throw new Error(error.message);
}

export async function saveAgentTask(task: AgentTaskRecord, opts?: StoreOpts) {
  if (!isSupabaseConfigured()) {
    await mutateLocalWorkspace((workspace) => {
      workspace.agentTasks = workspace.agentTasks.map((item) => (item.id === task.id ? task : item));
    });
    return;
  }
  const supabase = await db(opts);
  const { error } = await supabase!.from("agent_tasks").update({
    status: task.status,
    progress: task.progress,
    attempts: task.attempts,
    cursor: task.cursor,
    last_error: task.last_error,
    started_at: task.started_at,
    finished_at: task.finished_at,
  }).eq("id", task.id);
  if (error) throw new Error(error.message);
}

export async function appendActivity(entry: AgentActivityRecord, opts?: StoreOpts) {
  if (!isSupabaseConfigured()) {
    await mutateLocalWorkspace((workspace) => {
      workspace.agentActivity.unshift(entry);
    });
    return;
  }
  const supabase = await db(opts);
  await supabase?.from("agent_activity_logs").insert({
    id: entry.id,
    job_id: entry.job_id,
    organization_id: entry.organization_id,
    task_id: entry.task_id,
    message: entry.message,
    level: entry.level,
  });
}

export async function saveOpportunityScore(record: OpportunityScoreRecord, opts?: StoreOpts) {
  if (!isSupabaseConfigured()) {
    await mutateLocalWorkspace((workspace) => {
      const index = workspace.opportunityScores.findIndex(
        (item) => item.business_id === record.business_id && item.job_id === record.job_id,
      );
      if (index >= 0) workspace.opportunityScores[index] = record;
      else workspace.opportunityScores.unshift(record);
    });
    return;
  }
  const supabase = await db(opts);
  const { error } = await supabase!.from("opportunity_scores").upsert(
    {
      id: record.id,
      organization_id: record.organization_id,
      business_id: record.business_id,
      job_id: record.job_id,
      score: record.score,
      reasons: record.reasons,
    },
    { onConflict: "organization_id,business_id,job_id" },
  );
  if (error) throw new Error(error.message);
}

export async function listOpportunityScores(organizationId: string, opts?: StoreOpts): Promise<OpportunityScoreRecord[]> {
  if (!isSupabaseConfigured()) {
    const workspace = await readLocalWorkspace();
    return workspace.opportunityScores.filter((item) => item.organization_id === organizationId);
  }
  const supabase = await db(opts);
  const { data } = (await supabase
    ?.from("opportunity_scores")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })) ?? { data: [] };
  return (data ?? []).map((row) => ({
    id: String(row.id),
    organization_id: String(row.organization_id),
    business_id: String(row.business_id),
    job_id: (row.job_id as string | null) ?? null,
    score: Number(row.score),
    reasons: Array.isArray(row.reasons) ? (row.reasons as string[]) : [],
    created_at: String(row.created_at),
  }));
}

export async function saveDeployment(record: DeploymentRecord, opts?: StoreOpts) {
  if (!isSupabaseConfigured()) {
    await mutateLocalWorkspace((workspace) => {
      const index = workspace.deployments.findIndex((item) => item.demo_id === record.demo_id);
      if (index >= 0) workspace.deployments[index] = record;
      else workspace.deployments.unshift(record);
    });
    return;
  }
  const supabase = await db(opts);
  const { error } = await supabase!.from("deployment_records").upsert(
    {
      id: record.id,
      organization_id: record.organization_id,
      website_id: record.website_id,
      job_id: record.job_id,
      demo_id: record.demo_id,
      preview_path: record.preview_path,
      status: record.status,
      verified_at: record.verified_at,
      last_error: record.last_error,
    },
    { onConflict: "organization_id,demo_id" },
  );
  if (error) throw new Error(error.message);
}

export async function listDeployments(organizationId: string, opts?: StoreOpts): Promise<DeploymentRecord[]> {
  if (!isSupabaseConfigured()) {
    const workspace = await readLocalWorkspace();
    return workspace.deployments.filter((item) => item.organization_id === organizationId);
  }
  const supabase = await db(opts);
  const { data } = (await supabase
    ?.from("deployment_records")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })) ?? { data: [] };
  return (data ?? []).map((row) => ({
    id: String(row.id),
    organization_id: String(row.organization_id),
    website_id: (row.website_id as string | null) ?? null,
    job_id: (row.job_id as string | null) ?? null,
    demo_id: String(row.demo_id),
    preview_path: String(row.preview_path),
    status: row.status as DeploymentRecord["status"],
    verified_at: (row.verified_at as string | null) ?? null,
    last_error: (row.last_error as string | null) ?? null,
    created_at: String(row.created_at),
  }));
}

export async function recordAgentUsage(input: {
  organizationId: string;
  jobId: string | null;
  creditType: "discovery" | "research" | "website_generation" | "outreach";
  provider?: string | null;
  opts?: StoreOpts;
}) {
  if (!isSupabaseConfigured()) return;
  const supabase = await db(input.opts);
  await supabase?.from("agent_usage_records").insert({
    organization_id: input.organizationId,
    job_id: input.jobId,
    credit_type: input.creditType,
    amount: 1,
    provider: input.provider ?? null,
  });
}

export async function loadJobBundle(organizationId: string, jobId: string, opts?: StoreOpts) {
  const job = await getAgentJob(organizationId, jobId, opts);
  if (!job) return null;
  const [tasks, activity] = await Promise.all([listAgentTasks(jobId, opts), listActivity(jobId, opts)]);
  return { job, tasks, activity };
}

export async function adminListAgentJobs(): Promise<AgentJobRecord[]> {
  if (!isSupabaseConfigured()) {
    const workspace = await readLocalWorkspace();
    return [...workspace.agentJobs].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 100);
  }
  const supabase = await db({ privileged: true });
  const { data } = (await supabase
    ?.from("agent_jobs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100)) ?? { data: [] };
  return (data ?? []).map((row) => asJob(row as Record<string, unknown>));
}
