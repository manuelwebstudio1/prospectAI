import { leadCooldownActive, orgHourlyCapExceeded } from "@/services/outreach/limits";
import { sendOutreachEmail } from "@/services/outreach/providers/email";
import { sendWhatsAppText } from "@/services/outreach/providers/whatsapp";
import type { OutreachMessageRecord } from "@/services/workspace/types";

export type SendMethod = "api" | "manual";

export async function assertCanSend(input: {
  message: OutreachMessageRecord;
  orgSentAt: string[];
  leadLastSentAt: string | null;
}) {
  if (input.message.status === "sent") {
    throw new Error("This message was already sent.");
  }
  if (input.message.status !== "approved" && input.message.status !== "scheduled") {
    throw new Error("Approve the draft before sending. Outreach never sends from an unapproved draft.");
  }
  if (orgHourlyCapExceeded(input.orgSentAt)) {
    throw new Error("Hourly send cap reached (10 messages). Wait before sending more.");
  }
  if (leadCooldownActive(input.leadLastSentAt)) {
    throw new Error("This lead was contacted in the last 24 hours. A cooldown is in place.");
  }
}

export async function dispatchApprovedMessage(input: {
  message: OutreachMessageRecord;
  method: SendMethod;
}): Promise<Pick<OutreachMessageRecord, "status" | "sent_at" | "delivery_method" | "last_error">> {
  const now = new Date().toISOString();

  if (input.method === "manual") {
    return { status: "sent", sent_at: now, delivery_method: "manual", last_error: null };
  }

  if (input.message.is_sample) {
    throw new Error("Live sending is blocked for labelled sample records. Copy the draft or mark it sent manually.");
  }

  if (input.message.channel === "email") {
    if (!input.message.recipient) throw new Error("No email address is on file for this business.");
    const result = await sendOutreachEmail({
      to: input.message.recipient,
      subject: input.message.subject || `Message for ${input.message.recipient}`,
      body: input.message.body,
    });
    if (!result.ok) {
      return { status: "failed", sent_at: null, delivery_method: "unsent", last_error: result.error };
    }
    return { status: "sent", sent_at: now, delivery_method: "resend", last_error: null };
  }

  if (input.message.channel === "whatsapp") {
    if (!input.message.recipient) throw new Error("No usable phone number is on file for WhatsApp.");
    const result = await sendWhatsAppText({
      toDigits: input.message.recipient,
      body: input.message.body,
    });
    if (!result.ok) {
      return { status: "failed", sent_at: null, delivery_method: "unsent", last_error: result.error };
    }
    return { status: "sent", sent_at: now, delivery_method: "whatsapp_cloud", last_error: null };
  }

  throw new Error("Unsupported outreach channel.");
}
