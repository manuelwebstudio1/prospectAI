import { getAiStatus } from "@/lib/ai/provider";
import type { AgentName, AgentRun } from "@/agents/types";
import { runBusinessResearcher } from "@/agents/business-researcher";
import { runWebsiteArchitect } from "@/agents/website-architect";
import type { ResearchFacts } from "@/services/research/compile-from-records";
import type { ResearchReport, WebsiteArchitecture } from "@/lib/ai/schemas";

export function createQueuedRun(agent: AgentName, input: Record<string, unknown>): AgentRun {
  return {
    id: crypto.randomUUID(),
    agent,
    status: "queued",
    input,
    output: null,
    error: null,
    startedAt: null,
    finishedAt: null,
  };
}

export function assertAgentsReady(): { ready: boolean; reason?: string } {
  const status = getAiStatus();
  if (!status.configured) {
    return {
      ready: false,
      reason: `No optional HTTP model adapter is enabled. Records-only compilation remains available. Grok Bot connects through the MCP connector, not an xAI API key.`,
    };
  }
  return { ready: true };
}

export type IntelligencePipelineResult = {
  research: ResearchReport;
  architecture: WebsiteArchitecture;
  researchMode: "ai" | "records_only";
  architectMode: "ai" | "blueprint";
  model: string | null;
  warnings: string[];
};

export async function runIntelligencePipeline(
  facts: ResearchFacts,
): Promise<IntelligencePipelineResult> {
  const researcher = await runBusinessResearcher(facts);
  const architect = await runWebsiteArchitect(researcher.report);
  const warnings = [
    ...researcher.report.caveats,
    ...(researcher.error ? [researcher.error] : []),
    ...(architect.error ? [architect.error] : []),
  ];

  return {
    research: researcher.report,
    architecture: architect.architecture,
    researchMode: researcher.mode,
    architectMode: architect.mode,
    model: researcher.model ?? architect.model,
    warnings,
  };
}
