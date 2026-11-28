import { z } from "zod";
import { completeStructured, getAiStatus } from "@/lib/ai/provider";
import type { ResearchReport, WebsiteArchitecture } from "@/lib/ai/schemas";
import type { DemoContent } from "@/services/demos/types";

const copySchema = z.object({
  headline: z.string().min(2).max(80),
  subhead: z.string().min(8).max(220),
  about: z.string().min(20).max(600),
  cta: z.string().min(2).max(40),
});

function articleFor(value: string) {
  return /^[aeiou]/i.test(value.trim()) ? "an" : "a";
}

function industryPhrase(industry: string | null) {
  if (!industry) return "local business";
  return industry.replace(/companies$/i, "").trim().toLowerCase() || "local business";
}

function deterministicCopy(report: ResearchReport): DemoContent {
  const industry = industryPhrase(report.industry);
  const city = report.location?.replace(/,\s*GH$/i, "").trim() ?? null;
  const subhead = city
    ? `${report.businessName} is ${articleFor(industry)} ${industry} business in ${city}.`
    : `${report.businessName} is ${articleFor(industry)} ${industry} business.`;
  const about = report.description
    ? report.description
    : city
      ? `${report.businessName} is listed in ${city}. Only public records are shown on this preview.`
      : `${report.businessName}. Only public records are shown on this preview.`;

  return {
    headline: report.businessName,
    subhead,
    about,
    cta: report.publicContacts.phone ? "Request a quote" : "Enquire",
    location: report.location,
    phone: report.publicContacts.phone,
    email: report.publicContacts.email,
    address: report.publicContacts.address,
    services: report.services,
    unknownsNote:
      report.unknowns.length > 0
        ? `Unknown and therefore omitted: ${report.unknowns.join(", ")}.`
        : "No additional unknown fields were recorded.",
    copyMode: "deterministic",
  };
}

export async function buildDemoCopy(
  report: ResearchReport,
  architecture: WebsiteArchitecture,
): Promise<DemoContent> {
  const fallback = deterministicCopy(report);
  if (!getAiStatus().configured) return fallback;

  const result = await completeStructured<z.infer<typeof copySchema>>({
    agent: "website_generator",
    schema: copySchema,
    temperature: 0.3,
    system: `You write copy for an unofficial ProspectAI demo website.
Use only the supplied facts. Do not invent awards, years in business, menus, property lists, testimonials, staff, or facilities.
If a detail is unknown, write around it without filling it in.
headline should usually be the business name.
cta should be a short button label.`,
    user: JSON.stringify({
      report,
      websiteType: architecture.websiteType,
      pages: architecture.pages.map((page) => page.slug),
    }),
  });

  if (!result.ok) return fallback;
  return { ...fallback, ...result.data, copyMode: "ai" };
}
