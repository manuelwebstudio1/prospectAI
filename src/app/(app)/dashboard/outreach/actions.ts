"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { createOutreachDraft } from "@/services/outreach/draft";
import { approveOutreach, sendDueOutreach, sendOutreach } from "@/services/outreach/workflow";
import { getLatestResearch, getLead } from "@/services/workspace/repository";
import {
  addLeadNote,
  getDemoForBusiness,
  getOutreach,
  saveOutreach,
  updateLeadStage,
} from "@/services/workspace/outreach-store";
import type { LeadStage, OutreachChannel } from "@/types";

export type OutreachActionState = { error?: string; success?: string } | null;

function revalidateLead(leadId: string) {
  revalidatePath("/dashboard/outreach");
  revalidatePath("/dashboard/leads");
  revalidatePath(`/dashboard/leads/${leadId}`);
  revalidatePath("/dashboard");
}

export async function draftOutreachAction(
  _prev: OutreachActionState,
  formData: FormData,
): Promise<OutreachActionState> {
  const user = await getCurrentUser();
  if (!user?.organizationId) return { error: "You need to be signed in." };
  const leadId = String(formData.get("leadId") ?? "");
  const channel = (String(formData.get("channel") ?? "email") || "email") as OutreachChannel;
  if (channel !== "email" && channel !== "whatsapp") return { error: "Choose email or WhatsApp." };
  const lead = await getLead(user.organizationId, leadId);
  if (!lead?.business) return { error: "Lead not found." };
  let draft;
  try {
    const research = await getLatestResearch(user.organizationId, lead.business.id);
    const demo = await getDemoForBusiness(user.organizationId, lead.business.id);
    draft = await createOutreachDraft({
      organizationId: user.organizationId,
      leadId: lead.id,
      business: lead.business,
      research,
      demoPath: demo?.preview_path ?? null,
      channel,
      senderName: user.fullName,
    });
    await saveOutreach(draft);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not create a draft." };
  }
  revalidateLead(lead.id);
  redirect(`/dashboard/outreach/${draft.id}`);
}

export async function saveDraftEditsAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user?.organizationId) return;
  const message = await getOutreach(user.organizationId, String(formData.get("messageId") ?? ""));
  if (!message || (message.status !== "draft" && message.status !== "failed")) return;
  message.subject = String(formData.get("subject") ?? "").trim() || null;
  message.body = String(formData.get("body") ?? "");
  message.updated_at = new Date().toISOString();
  await saveOutreach(message);
  revalidatePath(`/dashboard/outreach/${message.id}`);
}

export async function approveOutreachAction(
  _prev: OutreachActionState,
  formData: FormData,
): Promise<OutreachActionState> {
  const user = await getCurrentUser();
  if (!user?.organizationId) return { error: "You need to be signed in." };
  const scheduledRaw = String(formData.get("scheduledAt") ?? "").trim();
  try {
    const message = await approveOutreach({
      organizationId: user.organizationId,
      userId: user.id,
      messageId: String(formData.get("messageId") ?? ""),
      scheduledAt: scheduledRaw ? new Date(scheduledRaw).toISOString() : null,
    });
    revalidateLead(message.lead_id);
    return {
      success: message.status === "scheduled"
        ? "Approved and scheduled. It will not send until due, and only after this approval."
        : "Approved. It still has not been sent.",
    };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Approval failed." };
  }
}

export async function sendOutreachAction(
  _prev: OutreachActionState,
  formData: FormData,
): Promise<OutreachActionState> {
  const user = await getCurrentUser();
  if (!user?.organizationId) return { error: "You need to be signed in." };
  const method = String(formData.get("method") ?? "api") === "manual" ? "manual" : "api";
  const messageId = String(formData.get("messageId") ?? "");
  try {
    const current = await getOutreach(user.organizationId, messageId);
    const lead = current ? await getLead(user.organizationId, current.lead_id) : null;
    await sendOutreach({
      organizationId: user.organizationId,
      messageId,
      method,
      leadStage: lead?.stage ?? null,
    });
    if (current) revalidateLead(current.lead_id);
    return {
      success:
        method === "manual"
          ? "Recorded as sent manually. ProspectAI did not deliver this message through an API."
          : "Message sent through the configured provider.",
    };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Send failed." };
  }
}

export async function cancelOutreachAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user?.organizationId) return;
  const message = await getOutreach(user.organizationId, String(formData.get("messageId") ?? ""));
  if (!message || message.status === "sent") return;
  message.status = "cancelled";
  message.updated_at = new Date().toISOString();
  await saveOutreach(message);
  revalidateLead(message.lead_id);
}

export async function sendDueOutreachAction() {
  const user = await getCurrentUser();
  if (!user?.organizationId) return;
  await sendDueOutreach(user.organizationId);
  revalidatePath("/dashboard/outreach");
}

export async function updateLeadStageAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user?.organizationId) return;
  const leadId = String(formData.get("leadId") ?? "");
  const stage = String(formData.get("stage") ?? "") as LeadStage;
  if (!leadId || !stage) return;
  await updateLeadStage(user.organizationId, leadId, stage);
  revalidateLead(leadId);
}

export async function addLeadNoteAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user?.organizationId) return;
  const leadId = String(formData.get("leadId") ?? "");
  const body = String(formData.get("body") ?? "").trim();
  if (!leadId || body.length < 2) return;
  await addLeadNote({
    id: crypto.randomUUID(),
    lead_id: leadId,
    organization_id: user.organizationId,
    author_id: user.id,
    body,
    created_at: new Date().toISOString(),
  });
  revalidateLead(leadId);
}

export async function createFollowUpAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user?.organizationId) return;
  const source = await getOutreach(user.organizationId, String(formData.get("messageId") ?? ""));
  if (!source || source.status !== "sent") return;
  const now = new Date().toISOString();
  const follow = {
    ...source,
    id: crypto.randomUUID(),
    status: "draft" as const,
    scheduled_at: null,
    sent_at: null,
    approved_by: null,
    delivery_method: "unsent" as const,
    last_error: null,
    subject: source.subject ? `Follow-up: ${source.subject.replace(/^Follow-up:\s*/i, "")}` : "Follow-up",
    body: `Following up on my earlier note.\n\n${source.body}`,
    created_at: now,
    updated_at: now,
  };
  await saveOutreach(follow);
  revalidateLead(source.lead_id);
  redirect(`/dashboard/outreach/${follow.id}`);
}
