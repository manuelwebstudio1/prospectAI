import { assertCanSend, dispatchApprovedMessage, type SendMethod } from "@/services/outreach/send";
import { consumeCredit, getCreditBalance } from "@/services/workspace/repository";
import {
  addOutreachEvent,
  getOutreach,
  listOutreach,
  saveOutreach,
  updateLeadStage,
} from "@/services/workspace/outreach-store";
import type { OutreachMessageRecord } from "@/services/workspace/types";
import type { LeadStage } from "@/types";

function event(messageId: string, eventType: string, payload: Record<string, unknown> = {}) {
  return {
    id: crypto.randomUUID(),
    message_id: messageId,
    event_type: eventType,
    payload,
    created_at: new Date().toISOString(),
  };
}

export async function approveOutreach(input: {
  organizationId: string;
  userId: string;
  messageId: string;
  scheduledAt?: string | null;
}) {
  const message = await getOutreach(input.organizationId, input.messageId);
  if (!message) throw new Error("Draft not found.");
  if (message.status !== "draft" && message.status !== "failed") {
    throw new Error("Only drafts (or failed retries) can be approved.");
  }
  const scheduledAt = input.scheduledAt || null;
  const next: OutreachMessageRecord = {
    ...message,
    status: scheduledAt ? "scheduled" : "approved",
    scheduled_at: scheduledAt,
    approved_by: input.userId,
    last_error: null,
    updated_at: new Date().toISOString(),
  };
  await saveOutreach(next);
  await addOutreachEvent(
    event(message.id, scheduledAt ? "scheduled" : "approved", {
      approvedBy: input.userId,
      scheduledAt,
    }),
  );
  return next;
}

export async function sendOutreach(input: {
  organizationId: string;
  messageId: string;
  method: SendMethod;
  leadStage?: LeadStage | null;
  requireDue?: boolean;
}) {
  const message = await getOutreach(input.organizationId, input.messageId);
  if (!message) throw new Error("Message not found.");
  const all = await listOutreach(input.organizationId);
  const orgSentAt = all.filter((item) => item.sent_at).map((item) => item.sent_at!) ;
  const leadLastSentAt =
    all
      .filter((item) => item.lead_id === message.lead_id && item.sent_at)
      .sort((a, b) => (b.sent_at ?? "").localeCompare(a.sent_at ?? ""))[0]?.sent_at ?? null;
  await assertCanSend({ message, orgSentAt, leadLastSentAt });

  if (
    input.requireDue &&
    message.status === "scheduled" &&
    message.scheduled_at &&
    new Date(message.scheduled_at).getTime() > Date.now()
  ) {
    throw new Error("This message is scheduled for later and is not due yet.");
  }

  const credits = await getCreditBalance(input.organizationId, "outreach");
  if (credits.allocated !== -1 && credits.remaining <= 0) {
    throw new Error("Outreach credits are exhausted.");
  }

  const result = await dispatchApprovedMessage({
    message,
    method: input.method,
  });
  if (result.status === "sent") {
    const allowed = await consumeCredit(input.organizationId, "outreach");
    if (!allowed) throw new Error("Outreach credits are exhausted.");
  }
  const next: OutreachMessageRecord = {
    ...message,
    ...result,
    updated_at: new Date().toISOString(),
  };
  await saveOutreach(next);
  await addOutreachEvent(
    event(message.id, result.status === "sent" ? "sent" : "failed", {
      method: input.method,
      delivery: result.delivery_method,
      error: result.last_error,
    }),
  );
  if (result.status === "sent" && input.leadStage !== "converted" && input.leadStage !== "not_interested" && input.leadStage !== "negotiation" && input.leadStage !== "interested") {
    await updateLeadStage(input.organizationId, message.lead_id, "contacted");
  }
  if (result.status === "failed") {
    throw new Error(result.last_error ?? "Send failed.");
  }
  return next;
}

export async function sendDueOutreach(organizationId: string) {
  const due = (await listOutreach(organizationId)).filter(
    (item) =>
      item.status === "scheduled" &&
      item.scheduled_at &&
      new Date(item.scheduled_at).getTime() <= Date.now(),
  );
  const results: Array<{ id: string; ok: boolean; error?: string }> = [];
  for (const message of due) {
    try {
      await sendOutreach({ organizationId, messageId: message.id, method: "api", requireDue: true });
      results.push({ id: message.id, ok: true });
    } catch (error) {
      results.push({ id: message.id, ok: false, error: error instanceof Error ? error.message : "Send failed." });
    }
  }
  return results;
}
