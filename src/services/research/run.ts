import { runIntelligencePipeline } from "@/agents/orchestrator";
import { consumeCredit, getLatestInspection, saveResearch } from "@/services/workspace/repository";
import type { BusinessRecord } from "@/services/workspace/types";
import type { IntelligencePipelineResult } from "@/agents/orchestrator";

export async function researchBusiness(input: {
  organizationId: string;
  userId: string;
  leadId: string;
  business: BusinessRecord;
  userNotes: string | null;
}): Promise<IntelligencePipelineResult> {
  const allowed = await consumeCredit(input.organizationId, "research");
  if (!allowed) {
    throw new Error("Research credits are exhausted.");
  }

  const inspection = await getLatestInspection(input.organizationId, input.business.id);
  const pipeline = await runIntelligencePipeline({
    business: input.business,
    inspection,
    userNotes: input.userNotes,
  });

  await saveResearch(
    {
      id: crypto.randomUUID(),
      business_id: input.business.id,
      organization_id: input.organizationId,
      report: pipeline.research,
      architecture: pipeline.architecture,
      research_mode: pipeline.researchMode,
      architect_mode: pipeline.architectMode,
      model: pipeline.model,
      created_at: new Date().toISOString(),
    },
    input.leadId,
    input.userId,
  );

  return pipeline;
}
