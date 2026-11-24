import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { formatCurrency } from "@/lib/utils";
import { getCurrentUser } from "@/lib/auth/session";
import { getCredits } from "@/services/workspace/repository";
import { getSubscription, listPayments } from "@/services/workspace/billing-store";
import { getPaymentProviderStatus } from "@/lib/payments/provider";
import { planUsageFromSubscription } from "@/services/billing/plan-usage";
import { getRuntimePlans } from "@/services/admin/store";
import { CheckoutPlans } from "@/components/billing/checkout-plans";

export const metadata: Metadata = { title: "Billing" };

export default async function BillingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const [subscription, payments, credits, provider, plans] = await Promise.all([
    user.organizationId ? getSubscription(user.organizationId) : Promise.resolve(null),
    user.organizationId ? listPayments(user.organizationId) : Promise.resolve([]),
    user.organizationId
      ? getCredits(user.organizationId)
      : Promise.resolve({ remaining: 0, allocated: 0 }),
    Promise.resolve(getPaymentProviderStatus()),
    getRuntimePlans(),
  ]);
  const plan = await planUsageFromSubscription(subscription, credits);

  return (
    <div className="space-y-6 animate-enter">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Billing & plans</h1>
        <p className="text-sm text-muted-foreground">
          Ghana checkout uses Moolre hosted payment links. Paid plans are applied only after a signed webhook or a Payment Status check — never from the return URL.
        </p>
      </div>
      <div className="surface-card p-6">
        <p className="text-sm text-muted-foreground">Current plan</p>
        <p className="mt-1 text-2xl font-bold">{plan.planName}</p>
        <p className="text-sm text-muted-foreground">
          {formatCurrency(plan.monthlyGhs)} / month
          {plan.renewsOn ? ` · renews ${plan.renewsOn}` : " · trial or unpaid"}
          {subscription?.status ? ` · ${subscription.status}` : ""}
        </p>
        <p className="mt-3 text-sm">
          Discovery credits {plan.creditsUsed.toLocaleString()} / {plan.creditsTotal.toLocaleString()}
        </p>
      </div>
      <CheckoutPlans
        plans={plans}
        currentSlug={plan.planSlug}
        currentStatus={subscription?.status ?? null}
        configured={provider.moolre.configured}
        reason={provider.moolre.reason}
      />
      <section className="surface-card p-6">
        <h2 className="font-semibold">Invoices</h2>
        {payments.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">No Moolre invoices yet.</p>
        ) : (
          <ul className="mt-3 divide-y">
            {payments.slice(0, 12).map((item) => (
              <li key={item.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                <span>
                  {item.plan_slug} · {item.billing_interval} · {formatCurrency(item.amount)}
                </span>
                <span className="text-muted-foreground">
                  {item.status}
                  {item.external_ref ? ` · ${item.external_ref.slice(0, 18)}` : ""}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
      <p className="text-xs text-muted-foreground">
        Need an invoice or a custom agency contract?{" "}
        <Link href="/contact" className="font-semibold text-primary">
          Contact us
        </Link>
        .
      </p>
    </div>
  );
}
