import { env } from "@/lib/env";
import { amountsMatch, getMoolrePaymentStatus, parseMoolreWebhook } from "@/lib/payments/moolre";
import type { PlanSlug } from "@/config/plans";
import {
  activatePaidPlan,
  getPaymentByRef,
  markPaymentOutcome,
  recordWebhookEvent,
  savePayment,
} from "@/services/workspace/billing-store";
import type { PaymentRecord } from "@/services/workspace/types";

function isPlanSlug(value: string): value is PlanSlug {
  return value === "starter" || value === "professional" || value === "agency";
}

export async function fulfillPaidInvoice(
  payment: PaymentRecord,
  reportedAmount: number | null,
  extra: { providerReference?: string | null; raw?: Record<string, unknown> } = {},
) {
  if (payment.status === "paid") return { ok: true as const, already: true };
  if (!amountsMatch(payment.amount, reportedAmount)) {
    payment.raw = {
      ...payment.raw,
      amount_mismatch: true,
      expected: payment.amount,
      reported: reportedAmount,
      ...(extra.raw ?? {}),
    };
    payment.updated_at = new Date().toISOString();
    await savePayment(payment);
    return { ok: false as const, reason: "Amount did not match the pending invoice." };
  }
  if (!isPlanSlug(payment.plan_slug)) {
    return { ok: false as const, reason: "Unknown plan on the invoice." };
  }
  const updated = await markPaymentOutcome(payment.external_ref, {
    status: "paid",
    providerReference: extra.providerReference,
    raw: extra.raw,
  });
  if (!updated || updated.status !== "paid") {
    return { ok: false as const, reason: "Could not mark the invoice paid." };
  }
  await activatePaidPlan({
    organizationId: payment.organization_id,
    planSlug: payment.plan_slug,
    interval: payment.billing_interval,
    externalRef: payment.external_ref,
  });
  return { ok: true as const, already: false };
}

export async function markFailedInvoice(
  payment: PaymentRecord,
  reason: string | null,
  raw?: Record<string, unknown>,
) {
  if (payment.status === "paid") return payment;
  return markPaymentOutcome(payment.external_ref, {
    status: "failed",
    failureReason: reason,
    raw,
  });
}

export async function reconcileMoolrePayment(externalRef: string) {
  const payment = await getPaymentByRef(externalRef);
  if (!payment) return { status: "missing" as const, payment: null };
  if (payment.status === "paid") return { status: "paid" as const, payment };

  const result = await getMoolrePaymentStatus(externalRef);
  if (result.txstatus === 1) {
    const fulfilled = await fulfillPaidInvoice(payment, result.amount, {
      providerReference: result.transactionId,
      raw: { status_check: result.raw as unknown as Record<string, unknown> },
    });
    const latest = await getPaymentByRef(externalRef);
    return { status: fulfilled.ok ? ("paid" as const) : ("pending" as const), payment: latest, reason: fulfilled.ok ? undefined : fulfilled.reason };
  }
  if (result.txstatus === 2) {
    const latest = await markFailedInvoice(payment, "Moolre reported a failed payment.", {
      status_check: result.raw as unknown as Record<string, unknown>,
    });
    return { status: "failed" as const, payment: latest };
  }
  return { status: "pending" as const, payment };
}

export async function handleMoolreWebhook(rawBody: string, headers: Headers) {
  const payload = parseMoolreWebhook(rawBody, headers.get("x-moolre-event-id"));
  if (!payload) {
    return { httpStatus: 400, body: { error: "Webhook body is missing event_id." } };
  }

  const firstSeen = await recordWebhookEvent({
    event_id: payload.eventId,
    event: payload.event || payload.code || "payment",
    received_at: new Date().toISOString(),
  });
  if (!firstSeen) {
    return { httpStatus: 200, body: { received: true, duplicate: true } };
  }

  if (!payload.externalRef) {
    return { httpStatus: 200, body: { received: true, ignored: "missing_externalref" } };
  }

  if (payload.accountNumber && env.moolre?.accountNumber && payload.accountNumber !== env.moolre.accountNumber) {
    return { httpStatus: 200, body: { received: true, ignored: "account_mismatch" } };
  }

  const payment = await getPaymentByRef(payload.externalRef);
  if (!payment) {
    return { httpStatus: 200, body: { received: true, ignored: "unknown_reference" } };
  }

  const paid = payload.code === "P01" && payload.txstatus === 1;
  const failed = payload.code === "P02" && payload.txstatus === 2;

  if (paid) {
    const result = await fulfillPaidInvoice(payment, payload.amount, {
      providerReference: payload.transactionId,
      raw: payload.raw,
    });
    return { httpStatus: 200, body: { received: true, fulfilled: result.ok, reason: result.ok ? undefined : result.reason } };
  }
  if (failed) {
    await markFailedInvoice(payment, payload.reason, payload.raw);
    return { httpStatus: 200, body: { received: true, failed: true } };
  }

  return { httpStatus: 200, body: { received: true, ignored: "not_final" } };
}

