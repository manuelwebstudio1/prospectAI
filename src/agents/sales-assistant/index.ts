import { completeStructured, getAiStatus } from "@/lib/ai/provider";
import { outreachDraftSchema, type OutreachDraft } from "@/lib/ai/schemas";
import type { BusinessRecord, ResearchRecord } from "@/services/workspace/types";
import type { OutreachChannel } from "@/types";

export type SalesAssistantInput = {
  senderName: string;
  business: BusinessRecord;
  research: ResearchRecord | null;
  demoUrl: string | null;
  channel: OutreachChannel;
};

function factLine(label: string, value: string | null | undefined) {
  return value ? `${label}: ${value}` : null;
}

function deterministicDraft(input: SalesAssistantInput): OutreachDraft {
  const name = input.business.name;
  const location = [input.business.city, input.business.country].filter(Boolean).join(", ");
  const sampleNote = input.business.is_sample
    ? " This note is based on labelled sample records, not a verified business."
    : "";
  const websiteNeed =
    input.research?.report.websiteNeed ??
    (input.business.website_status === "no_website"
      ? "Public records did not list a website."
      : input.business.website_status === "unverified"
        ? "A website could not be verified from directory data."
        : null);
  const demoLine = input.demoUrl
    ? `I prepared an unofficial ProspectAI demonstration (not an official ${name} website): ${input.demoUrl}`
    : "I can prepare an unofficial website demonstration if useful — it would never be published as your official site without your say-so.";
  const unknown = input.research?.report.unknowns?.length
    ? `I have not assumed anything about: ${input.research.report.unknowns.join(", ")}.`
    : null;

  if (input.channel === "whatsapp") {
    const body = [
      `Hello, this is ${input.senderName}.`,
      `I came across ${name}${location ? ` in ${location}` : ""} and put together a short note.${sampleNote}`,
      websiteNeed,
      demoLine,
      unknown,
      "If this is useful, reply here. If not, you can ignore the message.",
    ]
      .filter(Boolean)
      .join("\n\n");
    return { subject: null, body };
  }

  const subject = `Unofficial website demonstration for ${name}`;
  const body = [
    `Hello,`,
    `My name is ${input.senderName}. I work with ProspectAI, which builds unofficial website demonstrations for local businesses.${sampleNote}`,
    location ? `${name} is listed in ${location}.` : `I am writing about ${name}.`,
    websiteNeed,
    demoLine,
    unknown,
    `I will not send further messages unless you reply. Nothing in this note is a claim I could not verify from public records.`,
    `Kind regards,\n${input.senderName}`,
  ]
    .filter(Boolean)
    .join("\n\n");
  return { subject, body };
}

export async function runSalesAssistant(input: SalesAssistantInput): Promise<{
  draft: OutreachDraft;
  mode: "ai" | "deterministic";
}> {
  const fallback = deterministicDraft(input);
  if (!getAiStatus().configured) return { draft: fallback, mode: "deterministic" };

  const facts = {
    businessName: input.business.name,
    industry: input.research?.report.industry ?? input.business.industry,
    location: input.research?.report.location ?? [input.business.city, input.business.country].filter(Boolean).join(", "),
    websiteStatus: input.business.website_status,
    websiteUrl: input.business.website_url,
    phone: input.business.phone,
    email: input.business.email,
    services: input.research?.report.services ?? [],
    unknowns: input.research?.report.unknowns ?? [],
    caveats: input.research?.report.caveats ?? [],
    isSample: input.business.is_sample,
    demoUrl: input.demoUrl,
    senderName: input.senderName,
    channel: input.channel,
    verifiedLines: [
      factLine("Name", input.business.name),
      factLine("Industry", input.business.industry),
      factLine("City", input.business.city),
      factLine("Country", input.business.country),
      factLine("Phone", input.business.phone),
      factLine("Email", input.business.email),
    ].filter(Boolean),
  };

  const result = await completeStructured<OutreachDraft>({
    agent: "sales_assistant",
    schema: outreachDraftSchema,
    temperature: 0.3,
    system: `You draft opt-in, approval-first outreach for ProspectAI.
Use only supplied facts. Do not invent awards, prices, staff, years in business, or website quality claims.
If a demo URL is present, describe it as an unofficial ProspectAI demonstration, never as the business's official website.
Do not pressure, do not imply you already work with the business, and do not promise results.
WhatsApp bodies should be shorter than email. Email needs a subject. WhatsApp subject must be null.
If isSample is true, say the underlying records are labelled sample data.`,
    user: JSON.stringify(facts),
  });

  if (!result.ok) return { draft: fallback, mode: "deterministic" };
  if (input.channel === "whatsapp") return { draft: { ...result.data, subject: null }, mode: "ai" };
  return { draft: result.data, mode: "ai" };
}
