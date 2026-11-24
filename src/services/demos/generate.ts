import { runWebsiteGenerator } from "@/agents/website-generator";
import { consumeCredit } from "@/services/workspace/repository";
import type { ResearchRecord } from "@/services/workspace/types";
import type { DemoWebsiteRecord } from "@/services/demos/types";
import { env } from "@/lib/env";

export function makeDemoId() {
  return `pa_${crypto.randomUUID().replace(/-/g, "").slice(0, 10)}`;
}

function requireArchitecture(research: ResearchRecord) {
  if (!research.architecture?.pages?.length) {
    throw new Error("Run research first so an architect brief exists.");
  }
  return research.architecture;
}

async function generateContent(research: ResearchRecord) {
  const architecture = requireArchitecture(research);
  return runWebsiteGenerator({
    report: research.report,
    architecture,
  });
}

export async function generateDemoWebsite(input: {
  organizationId: string;
  research: ResearchRecord;
  businessName: string;
  industry: string | null;
  isSample: boolean;
  leadId: string | null;
  existing?: DemoWebsiteRecord | null;
}): Promise<DemoWebsiteRecord> {
  const allowed = await consumeCredit(input.organizationId, "website_generation");
  if (!allowed) throw new Error("Website generation credits are exhausted.");

  const generated = await generateContent(input.research);
  const now = new Date();
  const expires = new Date(now);
  expires.setDate(expires.getDate() + 30);
  const demoId = input.existing?.demo_id ?? makeDemoId();

  return {
    id: input.existing?.id ?? crypto.randomUUID(),
    organization_id: input.organizationId,
    business_id: input.research.business_id,
    research_id: input.research.id,
    lead_id: input.leadId ?? input.existing?.lead_id ?? null,
    demo_id: demoId,
    template_key: input.existing?.template_key ?? generated.templateKey,
    status: "ready",
    preview_path: `/d/${demoId}`,
    palette: generated.palette,
    content: generated.content,
    pages: generated.pages.length
      ? generated.pages
      : [
          { slug: "home", title: "Home", purpose: "Overview" },
          { slug: "contact", title: "Contact", purpose: "Enquiry" },
        ],
    business_name: input.businessName,
    industry: input.industry,
    is_sample: input.isSample,
    is_unofficial: true,
    expires_at: input.existing?.expires_at ?? expires.toISOString(),
    created_at: input.existing?.created_at ?? now.toISOString(),
    updated_at: now.toISOString(),
  };
}

export function absolutePreviewUrl(path: string) {
  return `${env.appUrl.replace(/\/$/, "")}${path}`;
}
