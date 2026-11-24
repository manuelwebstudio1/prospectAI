"use server";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { checkoutUnavailableReason, createCheckout, parseInterval, parsePlanSlug } from "@/services/billing/checkout";

export type BillingActionState = { error?: string } | null;

export async function startMoolreCheckoutAction(
  _prev: BillingActionState,
  formData: FormData,
): Promise<BillingActionState> {
  const user = await getCurrentUser();
  if (!user?.organizationId) return { error: "Sign in to subscribe." };

  const unavailable = checkoutUnavailableReason();
  if (unavailable) return { error: unavailable };

  const planSlug = parsePlanSlug(String(formData.get("planSlug") ?? ""));
  const interval = parseInterval(String(formData.get("interval") ?? "monthly"));
  if (!planSlug || !interval) return { error: "Choose a valid plan." };
  if (!user.email) return { error: "Your account needs an email address for Moolre checkout." };

  try {
    const checkout = await createCheckout({
      organizationId: user.organizationId,
      email: user.email,
      planSlug,
      interval,
    });
    redirect(checkout.url);
  } catch (error) {
    if (typeof error === "object" && error && "digest" in error) throw error;
    return { error: error instanceof Error ? error.message : "Could not start Moolre checkout." };
  }
}
