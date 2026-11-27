import type { CampaignStatus } from "@/types";

export type AgentMode =
  | "campaign"
  | "research_existing"
  | "generate_existing"
  | "outreach_existing"
  | "query";

export type WebsiteFilter = "no_website" | "poor_website" | "any";

export type CreditEstimate = {
  discovery: number;
  research: number;
  website_generation: number;
  outreach: number;
  total: number;
};

export type AgentPlan = {
  mode: AgentMode;
  objective: string;
  city: string | null;
  region: string | null;
  country: string;
  countryCode: string;
  industry: string | null;
  limit: number;
  websiteFilter: WebsiteFilter;
  includeResearch: boolean;
  includeGenerate: boolean;
  includeOutreach: boolean;
  missing: string[];
  estimatedCredits: CreditEstimate;
  queryKind: "none" | "deployed" | "score" | "status";
  querySubject: string | null;
};

export type AgentCounters = {
  discovered: number;
  researched: number;
  analyzed: number;
  scored: number;
  generated: number;
  deployed: number;
  outreachDrafts: number;
  failed: number;
};

export type AgentJobStatus = CampaignStatus;

export type AgentTaskStatus = "queued" | "running" | "succeeded" | "failed" | "cancelled" | "retrying";

export type AgentJobRecord = {
  id: string;
  organization_id: string;
  created_by: string | null;
  campaign_id: string | null;
  instruction: string;
  status: AgentJobStatus;
  plan: AgentPlan;
  counters: AgentCounters;
  last_error: string | null;
  locked_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type AgentTaskRecord = {
  id: string;
  job_id: string;
  organization_id: string;
  agent: string;
  title: string;
  sort_order: number;
  status: AgentTaskStatus;
  progress: number;
  attempts: number;
  cursor: number;
  last_error: string | null;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
};

export type AgentActivityRecord = {
  id: string;
  job_id: string;
  organization_id: string;
  task_id: string | null;
  message: string;
  level: "info" | "warn" | "error";
  created_at: string;
};

export type OpportunityScoreRecord = {
  id: string;
  organization_id: string;
  business_id: string;
  job_id: string | null;
  score: number;
  reasons: string[];
  created_at: string;
};

export type DeploymentRecord = {
  id: string;
  organization_id: string;
  website_id: string | null;
  job_id: string | null;
  demo_id: string;
  preview_path: string;
  status: "queued" | "live" | "failed";
  verified_at: string | null;
  last_error: string | null;
  created_at: string;
};

export function emptyCounters(): AgentCounters {
  return {
    discovered: 0,
    researched: 0,
    analyzed: 0,
    scored: 0,
    generated: 0,
    deployed: 0,
    outreachDrafts: 0,
    failed: 0,
  };
}

export function emptyEstimate(): CreditEstimate {
  return { discovery: 0, research: 0, website_generation: 0, outreach: 0, total: 0 };
}
