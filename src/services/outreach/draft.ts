import { runSalesAssistant } from "@/agents/sales-assistant";
import { env } from "@/lib/env";
import { toWhatsAppDigits } from "@/services/outreach/phone";
import type { BusinessRecord, OutreachMessageRecord, ResearchRecord } from "@/services/workspace/types";
import type { OutreachChannel } from "@/types";

export function recipientForChannel(business: BusinessRecord, channel: OutreachChannel) {
  if (channel === "email") return business.email;
  if (channel === "whatsapp") return toWhatsAppDigits(business.phone, business.country);
  return null;
}

export async function createOutreachDraft(input: {
  organizationId: string;
  leadId: string;
  business: BusinessRecord;
  research: ResearchRecord | null;
  demoPath: string | null;
  channel: OutreachChannel;
  senderName: string;
}): Promise<OutreachMessageRecord> {
  const demoUrl = input.demoPath ? `${env.appUrl.replace(/\/$/, "")}${input.demoPath}` : null;
  const generated = await runSalesAssistant({
    senderName: input.senderName,
    business: input.business,
    research: input.research,
    demoUrl,
    channel: input.channel,
  });
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    organization_id: input.organizationId,
    lead_id: input.leadId,
    channel: input.channel,
    subject: generated.draft.subject,
    body: generated.draft.body,
    status: "draft",
    scheduled_at: null,
    sent_at: null,
    approved_by: null,
    recipient: recipientForChannel(input.business, input.channel),
    delivery_method: "unsent",
    last_error: null,
    demo_url: demoUrl,
    is_sample: input.business.is_sample,
    draft_mode: generated.mode,
    created_at: now,
    updated_at: now,
  };
}
