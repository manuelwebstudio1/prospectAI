export type AgentName =
  | "business_hunter"
  | "website_inspector"
  | "business_researcher"
  | "website_architect"
  | "website_generator"
  | "sales_assistant"
  | "lead_manager";

export type AgentRunStatus =
  | "queued"
  | "running"
  | "succeeded"
  | "failed"
  | "cancelled";

export type AgentRun = {
  id: string;
  agent: AgentName;
  status: AgentRunStatus;
  input: Record<string, unknown>;
  output: Record<string, unknown> | null;
  error: string | null;
  startedAt: string | null;
  finishedAt: string | null;
};
