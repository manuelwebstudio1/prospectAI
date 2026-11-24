import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { mutateLocalWorkspace, readLocalWorkspace } from "@/lib/dev/local-workspace";
import type { LeadNoteRecord, OutreachEventRecord, OutreachMessageRecord } from "@/services/workspace/types";
import type { DemoWebsiteRecord } from "@/services/demos/types";
import type { LeadStage, OutreachStatus } from "@/types";

function nowIso() {
  return new Date().toISOString();
}

function outreachMetadata(message: OutreachMessageRecord) {
  return {
    recipient: message.recipient,
    delivery_method: message.delivery_method,
    last_error: message.last_error,
    demo_url: message.demo_url,
    is_sample: message.is_sample,
    draft_mode: message.draft_mode,
  };
}

function mapOutreachRow(row: Record<string, unknown>): OutreachMessageRecord {
  const metadata = (row.metadata ?? {}) as Record<string, unknown>;
  return {
    id: String(row.id),
    organization_id: String(row.organization_id),
    lead_id: String(row.lead_id),
    channel: (row.channel as OutreachMessageRecord["channel"]) ?? "email",
    subject: (row.subject as string | null) ?? null,
    body: String(row.body ?? ""),
    status: (row.status as OutreachStatus) ?? "draft",
    scheduled_at: (row.scheduled_at as string | null) ?? null,
    sent_at: (row.sent_at as string | null) ?? null,
    approved_by: (row.approved_by as string | null) ?? null,
    recipient: (metadata.recipient as string | null) ?? null,
    delivery_method: (metadata.delivery_method as OutreachMessageRecord["delivery_method"]) ?? "unsent",
    last_error: (metadata.last_error as string | null) ?? null,
    demo_url: (metadata.demo_url as string | null) ?? null,
    is_sample: Boolean(metadata.is_sample),
    draft_mode: metadata.draft_mode === "ai" ? "ai" : "deterministic",
    created_at: String(row.created_at),
    updated_at: String(row.updated_at ?? row.created_at),
  };
}

export async function listOutreach(organizationId: string): Promise<OutreachMessageRecord[]> {
  if (!isSupabaseConfigured()) {
    const workspace = await readLocalWorkspace();
    return (workspace.outreach ?? [])
      .filter((item) => item.organization_id === organizationId)
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  }
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    ?.from("outreach_messages")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false }) ?? { data: [] };
  return (data ?? []).map((row) => mapOutreachRow(row as Record<string, unknown>));
}

export async function getOutreach(organizationId: string, id: string) {
  const messages = await listOutreach(organizationId);
  return messages.find((item) => item.id === id) ?? null;
}

export async function saveOutreach(message: OutreachMessageRecord) {
  if (!isSupabaseConfigured()) {
    await mutateLocalWorkspace((workspace) => {
      workspace.outreach ??= [];
      const index = workspace.outreach.findIndex((item) => item.id === message.id);
      if (index >= 0) workspace.outreach[index] = message;
      else workspace.outreach.unshift(message);
    });
    return;
  }
  const supabase = await createSupabaseServerClient();
  if (!supabase) throw new Error("Database is not configured.");
  const { error } = await supabase.from("outreach_messages").upsert({
    id: message.id,
    organization_id: message.organization_id,
    lead_id: message.lead_id,
    channel: message.channel,
    subject: message.subject,
    body: message.body,
    status: message.status,
    scheduled_at: message.scheduled_at,
    sent_at: message.sent_at,
    approved_by: message.approved_by,
    metadata: outreachMetadata(message),
  });
  if (error) throw new Error(error.message);
}

export async function addOutreachEvent(event: OutreachEventRecord) {
  if (!isSupabaseConfigured()) {
    await mutateLocalWorkspace((workspace) => {
      workspace.outreachEvents ??= [];
      workspace.outreachEvents.unshift(event);
    });
    return;
  }
  const supabase = await createSupabaseServerClient();
  await supabase?.from("outreach_events").insert({
    id: event.id,
    message_id: event.message_id,
    event_type: event.event_type,
    payload: event.payload,
  });
}

export async function listOutreachEvents(messageId: string): Promise<OutreachEventRecord[]> {
  if (!isSupabaseConfigured()) {
    const workspace = await readLocalWorkspace();
    return (workspace.outreachEvents ?? [])
      .filter((item) => item.message_id === messageId)
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  }
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    ?.from("outreach_events")
    .select("*")
    .eq("message_id", messageId)
    .order("created_at", { ascending: false }) ?? { data: [] };
  return (data ?? []) as OutreachEventRecord[];
}

export async function updateLeadStage(organizationId: string, leadId: string, stage: LeadStage) {
  const now = nowIso();
  if (!isSupabaseConfigured()) {
    await mutateLocalWorkspace((workspace) => {
      workspace.leads = workspace.leads.map((lead) =>
        lead.id === leadId && lead.organization_id === organizationId
          ? { ...lead, stage, last_interaction_at: now, updated_at: now }
          : lead,
      );
    });
    return;
  }
  const supabase = await createSupabaseServerClient();
  await supabase
    ?.from("leads")
    .update({ stage, last_interaction_at: now })
    .eq("id", leadId)
    .eq("organization_id", organizationId);
}

export async function listLeadNotes(organizationId: string, leadId: string): Promise<LeadNoteRecord[]> {
  if (!isSupabaseConfigured()) {
    const workspace = await readLocalWorkspace();
    return (workspace.notes ?? [])
      .filter((item) => item.organization_id === organizationId && item.lead_id === leadId)
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  }
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    ?.from("lead_notes")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("lead_id", leadId)
    .order("created_at", { ascending: false }) ?? { data: [] };
  return (data ?? []) as LeadNoteRecord[];
}

export async function addLeadNote(note: LeadNoteRecord) {
  if (!isSupabaseConfigured()) {
    await mutateLocalWorkspace((workspace) => {
      workspace.notes ??= [];
      workspace.notes.unshift(note);
      workspace.leads = workspace.leads.map((lead) =>
        lead.id === note.lead_id ? { ...lead, last_interaction_at: note.created_at, updated_at: note.created_at } : lead,
      );
    });
    return;
  }
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase?.from("lead_notes").insert(note) ?? { error: { message: "Database is not configured." } };
  if (error) throw new Error(error.message);
}

export async function getDemoForBusiness(organizationId: string, businessId: string) {
  if (!isSupabaseConfigured()) {
    const workspace = await readLocalWorkspace();
    return (
      workspace.demos.find(
        (item) => item.organization_id === organizationId && item.business_id === businessId && item.status !== "expired",
      ) ?? null
    );
  }
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    ?.from("generated_websites")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("business_id", businessId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle() ?? { data: null };
  if (!data) return null;
  const row = data as { business_id: string; demo_id: string; status?: DemoWebsiteRecord["status"] };
  return {
    business_id: String(row.business_id),
    preview_path: `/d/${row.demo_id}`,
    status: row.status ?? "ready",
  };
}
