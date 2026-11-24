import type { ResearchReport, WebsiteArchitecture } from "@/lib/ai/schemas";
import { buildDemoCopy } from "@/services/demos/copy";
import type { DemoContent, DemoPage } from "@/services/demos/types";

export type GeneratorResult = {
  agent: "website_generator";
  templateKey: string;
  content: DemoContent;
  pages: DemoPage[];
  palette: WebsiteArchitecture["colourPalette"];
};

export async function runWebsiteGenerator(input: {
  report: ResearchReport;
  architecture: WebsiteArchitecture;
}): Promise<GeneratorResult> {
  const content = await buildDemoCopy(input.report, input.architecture);
  return {
    agent: "website_generator",
    templateKey: input.architecture.websiteType || "professional_services",
    content,
    pages: input.architecture.pages.map((page) => ({
      slug: page.slug === "home" ? "home" : page.slug,
      title: page.title,
      purpose: page.purpose,
    })),
    palette: input.architecture.colourPalette,
  };
}
