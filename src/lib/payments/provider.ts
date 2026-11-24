import { isMoolreConfigured, moolreStatus } from "@/lib/payments/moolre";
import { env } from "@/lib/env";

export type PaymentProviderName = "moolre" | "stripe";

export function getPaymentProviderStatus() {
  return {
    default: "moolre" as PaymentProviderName,
    moolre: moolreStatus(),
    stripe: {
      configured: Boolean(env.stripeSecret),
      reason: env.stripeSecret ? null : "Stripe is optional and not used for Ghana checkout.",
    },
  };
}

export function assertMoolreReady() {
  if (!isMoolreConfigured()) {
    throw new Error(moolreStatus().reason ?? "Moolre is not configured.");
  }
}
