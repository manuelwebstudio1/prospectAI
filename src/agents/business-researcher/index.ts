import { z } from "zod";
import { completeStructured, getAiStatus } from "@/lib/ai/provider";
import { researchReportSchema, type ResearchReport } from "@/lib/ai/schemas";
import { compileResearchFromRecords, type ResearchFacts } from "@/services/research/compile-from-records";

export const researcherInputSchema = z.object({
  facts: z.custom<ResearchFacts>(),
});

export type ResearcherResult = {
  agent: "business_researcher";
  report: ResearchReport;
  mode: "ai" | "records_only";
  model: string | null;
  error?: string;
};

const SYSTEM = `You are the ProspectAI Business Researcher.
You receive a JSON object of verified facts about one business.
Rules:
- Restate only facts present in the input.
- Never invent services, products, addresses, testimonials, certifications, awards, staff, or social profiles.
- If a field is missing, set it to null or [] and add it to unknowns.
- websiteNeed must be a cautious recommendation, not a claim that the business has no website unless verification_status is no_website AND the input says so.
- caveats must mention any sample/fixture origin.
Return JSON matching the schema.`;

export async function runBusinessResearcher(facts: ResearchFacts): Promise<ResearcherResult> {
  const fallback = compileResearchFromRecords(facts);
  const status = getAiStatus();
  if (!status.configured) {
    return {
      agent: "business_researcher",
      report: {
        ...fallback,
        caveats: [
          ...fallback.caveats,
          `AI provider is not configured. Report compiled from records only (${status.provider} key missing).`,
        ],
      },
      mode: "records_only",
      model: null,
    };
  }

  const result = await completeStructured<ResearchReport>({
    agent: "business_researcher",
    schema: researchReportSchema,
    system: SYSTEM,
    temperature: 0,
    user: JSON.stringify({
      verifiedFacts: {
        name: facts.business.name,
        industry: facts.business.industry,
        category: facts.business.category,
        country: facts.business.country,
        region: facts.business.region,
        city: facts.business.city,
        address: facts.business.address,
        phone: facts.business.phone,
        email: facts.business.email,
        websiteUrl: facts.business.website_url,
        websiteStatus: facts.business.website_status,
        source: facts.business.source,
        isSample: facts.business.is_sample,
        inspection: facts.inspection
          ? {
              status: facts.inspection.verification_status,
              url: facts.inspection.url,
              reachable: facts.inspection.is_reachable,
              evidenceSource: facts.inspection.evidence_source,
              confidence: facts.inspection.confidence,
            }
          : null,
        userSuppliedNotes: facts.userNotes,
      },
      requiredKeys: Object.keys(researchReportSchema.shape),
    }),
  });

  if (!result.ok) {
    return {
      agent: "business_researcher",
      report: {
        ...fallback,
        caveats: [...fallback.caveats, `AI researcher unavailable (${result.error}). Fell back to records-only compilation.`],
      },
      mode: "records_only",
      model: result.model,
      error: result.error,
    };
  }

  return {
    agent: "business_researcher",
    report: result.data,
    mode: "ai",
    model: result.model,
  };
}
