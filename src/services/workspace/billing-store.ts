import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseServerClient, createSupabaseServiceClient } from "@/lib/supabase/server";
import { mutateLocalWorkspace, readLocalWorkspace } from "@/lib/dev/local-workspace";
import type { LocalCredits } from "@/lib/dev/local-workspace";
import type { LocalSubscriptionRecord, PaymentRecord, WebhookEventRecord } from "@/services/workspace/types";
import { getPlan, type PlanSlug } from "@/config/plans";

function nowIso() {
  return new Date().toISOString();
}

function creditsFromPlan(slug: PlanSlug): LocalCredits {
  const plan = getPlan(slug);
  return {
    discovery: { remaining: plan.discoveryCredits, allocated: plan.discoveryCredits },
    research: { remaining: plan.researchCredits, allocated: plan.researchCredits },
    website_generation: { remaining: plan.websiteCredits, allocated: plan.websiteCredits },
    outreach: { remaining: plan.outreachCredits, allocated: plan.outreachCredits },
  };
}

async function billingClient() {
  return (await createSupabaseServiceClient()) ?? (await createSupabaseServerClient());
}

export async function listPayments(organizationId: string): Promise<PaymentRecord[]> {
  if (!isSupabaseConfigured()) {
    const workspace = await readLocalWorkspace();
    return (workspace.payments ?? [])
      .filter((item) => item.organization_id === organizationId)
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  }
  const supabase = await createSupabaseServerClient();
  const { data } = (await supabase
    ?.from("payment_transactions")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })) ?? { data: [] };
  return (data ?? []).map((row) => mapPaymentRow(row as Record<string, unknown>));
}

export async function getPaymentByRef(externalRef: string): Promise<PaymentRecord | null> {
  if (!isSupabaseConfigured()) {
    const workspace = await readLocalWorkspace();
    return (workspace.payments ?? []).find((item) => item.external_ref === externalRef) ?? null;
  }
  const supabase = await billingClient();
  const { data } = (await supabase
    ?.from("payment_transactions")
    .select("*")
    .eq("external_ref", externalRef)
    .maybeSingle()) ?? { data: null };
  return data ? mapPaymentRow(data as Record<string, unknown>) : null;
}

export async function savePayment(payment: PaymentRecord) {
  if (!isSupabaseConfigured()) {
    await mutateLocalWorkspace((workspace) => {
      workspace.payments ??= [];
      const index = workspace.payments.findIndex((item) => item.id === payment.id);
      if (index >= 0) workspace.payments[index] = payment;
      else workspace.payments.unshift(payment);
    });
    return;
  }
  const supabase = await billingClient();
  if (!supabase) throw new Error("Database is not configured.");
  const { error } = await supabase.from("payment_transactions").upsert({
    id: payment.id,
    organization_id: payment.organization_id,
    provider: payment.provider,
    provider_reference: payment.provider_reference,
    amount: payment.amount,
    currency: payment.currency,
    status: payment.status,
    external_ref: payment.external_ref,
    plan_slug: payment.plan_slug,
    billing_interval: payment.billing_interval,
    checkout_url: payment.checkout_url,
    raw: {
      ...payment.raw,
      failure_reason: payment.failure_reason,
    },
  });
  if (error) throw new Error(error.message);
}

export async function markPaymentOutcome(
  externalRef: string,
  outcome: {
    status: "paid" | "failed" | "expired";
    providerReference?: string | null;
    failureReason?: string | null;
    raw?: Record<string, unknown>;
  },
): Promise<PaymentRecord | null> {
  if (!isSupabaseConfigured()) {
    return mutateLocalWorkspace((workspace) => {
      workspace.payments ??= [];
      const payment = workspace.payments.find((item) => item.external_ref === externalRef);
      if (!payment) return null;
      if (payment.status === "paid") return payment;
      payment.status = outcome.status;
      payment.updated_at = nowIso();
      if (outcome.providerReference) payment.provider_reference = outcome.providerReference;
      if (outcome.failureReason) payment.failure_reason = outcome.failureReason;
      if (outcome.raw) payment.raw = { ...payment.raw, ...outcome.raw };
      return payment;
    });
  }
  const existing = await getPaymentByRef(externalRef);
  if (!existing) return null;
  if (existing.status === "paid") return existing;
  const next: PaymentRecord = {
    ...existing,
    status: outcome.status,
    provider_reference: outcome.providerReference ?? existing.provider_reference,
    failure_reason: outcome.failureReason ?? existing.failure_reason,
    raw: { ...existing.raw, ...(outcome.raw ?? {}) },
    updated_at: nowIso(),
  };
  await savePayment(next);
  return next;
}

export async function getSubscription(organizationId: string): Promise<LocalSubscriptionRecord | null> {
  if (!isSupabaseConfigured()) {
    const workspace = await readLocalWorkspace();
    return workspace.subscription;
  }
  const supabase = await createSupabaseServerClient();
  const { data } = (await supabase
    ?.from("subscriptions")
    .select("*, subscription_plans(slug)")
    .eq("organization_id", organizationId)
    .maybeSingle()) ?? { data: null };
  if (!data) return null;
  const plan = Array.isArray(data.subscription_plans) ? data.subscription_plans[0] : data.subscription_plans;
  return {
    organization_id: data.organization_id,
    plan_slug: plan?.slug ?? "starter",
    status: data.status,
    billing_interval: data.billing_interval ?? "monthly",
    current_period_start: data.current_period_start,
    current_period_end: data.current_period_end,
    last_external_ref: data.moolre_external_ref ?? null,
    updated_at: data.updated_at,
  };
}

export async function activatePaidPlan(input: {
  organizationId: string;
  planSlug: PlanSlug;
  interval: "monthly" | "annual";
  externalRef: string;
}) {
  const now = new Date();
  const end = new Date(now);
  if (input.interval === "annual") end.setFullYear(end.getFullYear() + 1);
  else end.setMonth(end.getMonth() + 1);
  const record: LocalSubscriptionRecord = {
    organization_id: input.organizationId,
    plan_slug: input.planSlug,
    status: "active",
    billing_interval: input.interval,
    current_period_start: now.toISOString(),
    current_period_end: end.toISOString(),
    last_external_ref: input.externalRef,
    updated_at: nowIso(),
  };
  const credits = creditsFromPlan(input.planSlug);

  if (!isSupabaseConfigured()) {
    await mutateLocalWorkspace((workspace) => {
      workspace.subscription = record;
      workspace.credits = credits;
    });
    return record;
  }

  const supabase = await billingClient();
  if (!supabase) throw new Error("Database is not configured.");
  const { data: plan } = await supabase.from("subscription_plans").select("id").eq("slug", input.planSlug).maybeSingle();
  if (!plan) throw new Error("Plan is not in the database.");
  const { error: subError } = await supabase.from("subscriptions").upsert(
    {
      organization_id: input.organizationId,
      plan_id: plan.id,
      status: "active",
      billing_interval: input.interval,
      current_period_start: record.current_period_start,
      current_period_end: record.current_period_end,
      moolre_external_ref: input.externalRef,
      cancel_at_period_end: false,
    },
    { onConflict: "organization_id" },
  );
  if (subError) throw new Error(subError.message);
  const rows = [
    { type: "discovery", remaining: credits.discovery.remaining, allocated: credits.discovery.allocated },
    { type: "research", remaining: credits.research.remaining, allocated: credits.research.allocated },
    { type: "website_generation", remaining: credits.website_generation.remaining, allocated: credits.website_generation.allocated },
    { type: "outreach", remaining: credits.outreach.remaining, allocated: credits.outreach.allocated },
  ];
  for (const row of rows) {
    const { error } = await supabase.from("credit_balances").upsert(
      {
        organization_id: input.organizationId,
        credit_type: row.type,
        remaining: row.remaining,
        allocated: row.allocated,
      },
      { onConflict: "organization_id,credit_type" },
    );
    if (error) throw new Error(error.message);
  }
  return record;
}

export async function recordWebhookEvent(event: WebhookEventRecord): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    return mutateLocalWorkspace((workspace) => {
      workspace.webhookEvents ??= [];
      if (workspace.webhookEvents.some((item) => item.event_id === event.event_id)) return false;
      workspace.webhookEvents.unshift(event);
      return true;
    });
  }
  const supabase = await createSupabaseServiceClient();
  if (!supabase) throw new Error("SUPABASE_SERVICE_ROLE_KEY is required to record Moolre webhooks.");
  const { error } = await supabase.from("webhook_events").insert({
    event_id: event.event_id,
    event: event.event,
    received_at: event.received_at,
  });
  if (error?.code === "23505") return false;
  if (error) throw new Error(error.message);
  return true;
}

function mapPaymentRow(row: Record<string, unknown>): PaymentRecord {
  const raw = (row.raw ?? {}) as Record<string, unknown>;
  return {
    id: String(row.id),
    organization_id: String(row.organization_id),
    provider: "moolre",
    external_ref: String(row.external_ref ?? raw.external_ref ?? ""),
    provider_reference: (row.provider_reference as string | null) ?? null,
    amount: Number(row.amount),
    currency: "GHS",
    status: (row.status as PaymentRecord["status"]) ?? "pending",
    plan_slug: String(row.plan_slug ?? raw.plan_slug ?? "starter"),
    billing_interval: (row.billing_interval as PaymentRecord["billing_interval"]) ?? "monthly",
    checkout_url: (row.checkout_url as string | null) ?? (raw.checkout_url as string | null) ?? null,
    failure_reason: (raw.failure_reason as string | null) ?? null,
    raw,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at ?? row.created_at),
  };
}
