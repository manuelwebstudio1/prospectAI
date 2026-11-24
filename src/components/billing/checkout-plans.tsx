"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import type { SubscriptionPlan } from "@/config/plans";
import { formatCurrency } from "@/lib/utils";
import { startMoolreCheckoutAction, type BillingActionState } from "@/app/(app)/dashboard/billing/actions";

export function CheckoutPlans({
  plans,
  currentSlug,
  currentStatus,
  configured,
  reason,
}: {
  plans: SubscriptionPlan[];
  currentSlug: string;
  currentStatus: string | null;
  configured: boolean;
  reason: string | null;
}) {
  const [interval, setInterval] = useState<"monthly" | "annual">("monthly");
  const [state, action, pending] = useActionState<BillingActionState, FormData>(
    startMoolreCheckoutAction,
    null,
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" variant={interval === "monthly" ? "default" : "outline"} onClick={() => setInterval("monthly")}>
          Monthly
        </Button>
        <Button type="button" size="sm" variant={interval === "annual" ? "default" : "outline"} onClick={() => setInterval("annual")}>
          Annual
        </Button>
      </div>
      {state?.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
      {!configured ? <p className="text-sm text-amber-800">{reason}</p> : null}
      <div className="grid gap-4 lg:grid-cols-3">
        {plans.map((plan) => {
          const isCurrent = plan.slug === currentSlug && currentStatus === "active";
          const price = interval === "annual" ? plan.annualGhs : plan.monthlyGhs;
          return (
            <article key={plan.slug} className="surface-card flex flex-col p-5">
              <h2 className="font-semibold">{plan.name}</h2>
              <p className="mt-1 text-2xl font-bold">{formatCurrency(price)}</p>
              <p className="text-xs text-muted-foreground">{interval === "annual" ? "billed yearly" : "per month"}</p>
              <ul className="mt-4 flex-1 space-y-1 text-sm text-muted-foreground">
                {plan.features.slice(0, 4).map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
              <form action={action} className="mt-5">
                <input type="hidden" name="planSlug" value={plan.slug} />
                <input type="hidden" name="interval" value={interval} />
                <Button
                  className="w-full"
                  type="submit"
                  variant={isCurrent ? "secondary" : plan.highlighted ? "default" : "outline"}
                  disabled={!configured || pending || isCurrent}
                >
                  {isCurrent ? "Current plan" : pending ? "Opening Moolre…" : `Pay with Moolre`}
                </Button>
              </form>
            </article>
          );
        })}
      </div>
    </div>
  );
}
