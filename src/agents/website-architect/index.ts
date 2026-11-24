import { completeStructured, getAiStatus } from "@/lib/ai/provider";
import { websiteArchitectureSchema, type ResearchReport, type WebsiteArchitecture } from "@/lib/ai/schemas";
import { architectureFromIndustry } from "@/services/research/industry-blueprints";

export type ArchitectResult = {
  agent: "website_architect";
  architecture: WebsiteArchitecture;
  mode: "ai" | "blueprint";
  model: string | null;
  error?: string;
};

const SYSTEM = `You are the ProspectAI Website Architect.
You propose an unofficial demo website structure.
Rules:
- Use only the verified industry and the research report facts.
- Do not invent services, property counts, menus, or facilities.
- If services are unknown, keep service pages generic and say so in rationale.
- basedOnVerifiedFactsOnly must be true.
- Colour values must be hex strings.
Return JSON matching the schema.`;

export async function runWebsiteArchitect(report: ResearchReport): Promise<ArchitectResult> {
  const blueprint = architectureFromIndustry(report.industry);

  const status = getAiStatus();
  if (!status.configured) {
    return {
      agent: "website_architect",
      architecture: {
        ...blueprint,
        rationale: `${blueprint.rationale} AI provider is not configured, so the industry blueprint was used.`,
      },
      mode: "blueprint",
      model: null,
    };
  }

  const result = await completeStructured<WebsiteArchitecture>({
    agent: "website_architect",
    schema: websiteArchitectureSchema,
    system: SYSTEM,
    temperature: 0.2,
    user: JSON.stringify({
      research: report,
      industryBlueprint: blueprint,
      instruction:
        "You may refine the blueprint using verified research only. Do not add pages that imply unpublished products or services.",
    }),
  });

  if (!result.ok) {
    return {
      agent: "website_architect",
      architecture: {
        ...blueprint,
        rationale: `${blueprint.rationale} AI architect unavailable (${result.error}).`,
      },
      mode: "blueprint",
      model: result.model,
      error: result.error,
    };
  }

  return {
    agent: "website_architect",
    architecture: result.data,
    mode: "ai",
    model: result.model,
  };
}
