import { env } from "@/lib/env";
import type { PlanSlug } from "@/config/plans";
import { getRuntimePlan } from "@/services/admin/store";
import { assertMoolreReady, getPaymentProviderStatus } from "@/lib/payments/provider";
import { createMoolrePaymentLink } from "@/lib/payments/moolre";
import { savePayment } from "@/services/workspace/billing-store";
import type { PaymentRecord } from "@/services/workspace/types";

const PLAN_SLUGS: PlanSlug[] = ["starter", "professional", "agency"];

export function parsePlanSlug(value: string): PlanSlug | null {
  return PLAN_SLUGS.includes(value as PlanSlug) ? (value as PlanSlug) : null;
}

export function parseInterval(value: string): "monthly" | "annual" | null {
  return value === "monthly" || value === "annual" ? value : null;
}

export async function createCheckout(input: {
  organizationId: string;
  email: string;
  planSlug: PlanSlug;
  interval: "monthly" | "annual";
}): Promise<{ url: string; externalRef: string }> {
  assertMoolreReady();
  const plan = await getRuntimePlan(input.planSlug);
  const amount = input.interval === "annual" ? plan.annualGhs : plan.monthlyGhs;
  const externalRef = `pa_${crypto.randomUUID().replace(/-/g, "")}`;
  const now = new Date().toISOString();
  const payment: PaymentRecord = {
    id: crypto.randomUUID(),
    organization_id: input.organizationId,
    provider: "moolre",
    external_ref: externalRef,
    provider_reference: null,
    amount,
    currency: "GHS",
    status: "pending",
    plan_slug: input.planSlug,
    billing_interval: input.interval,
    checkout_url: null,
    failure_reason: null,
    raw: { created_via: "checkout" },
    created_at: now,
    updated_at: now,
  };
  await savePayment(payment);

  const appUrl = env.appUrl.replace(/\/$/, "");
  try {
    const link = await createMoolrePaymentLink({
      amountGhs: amount,
      email: input.email,
      externalRef,
      redirectUrl: `${appUrl}/dashboard/billing/return?ref=${encodeURIComponent(externalRef)}`,
      callbackUrl: `${appUrl}/api/billing/moolre/webhook`,
      metadata: {
        organization_id: input.organizationId,
        plan_slug: input.planSlug,
        billing_interval: input.interval,
      },
    });
    payment.checkout_url = link.authorizationUrl;
    payment.provider_reference = link.reference;
    payment.updated_at = new Date().toISOString();
    await savePayment(payment);
    return { url: link.authorizationUrl, externalRef };
  } catch (error) {
    payment.status = "failed";
    payment.failure_reason = error instanceof Error ? error.message : "Could not create a Moolre payment link.";
    payment.updated_at = new Date().toISOString();
    await savePayment(payment);
    throw error;
  }
}

export function checkoutUnavailableReason() {
  const status = getPaymentProviderStatus();
  if (status.moolre.configured) return null;
  return status.moolre.reason;
}
