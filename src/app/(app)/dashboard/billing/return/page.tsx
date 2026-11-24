import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth/session";
import { isMoolreConfigured } from "@/lib/payments/moolre";
import { getPaymentByRef } from "@/services/workspace/billing-store";
import { reconcileMoolrePayment } from "@/services/billing/fulfill";
import { ReturnPoller } from "@/components/billing/return-poller";
import { formatCurrency } from "@/lib/utils";

export const metadata: Metadata = { title: "Payment return" };

export default async function BillingReturnPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string; status?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user?.organizationId) redirect("/login");
  const params = await searchParams;
  const ref = params.ref?.trim();
  if (!ref) {
    return (
      <div className="mx-auto max-w-lg space-y-4 animate-enter">
        <h1 className="text-2xl font-bold tracking-tight">Missing payment reference</h1>
        <p className="text-sm text-muted-foreground">
          The return URL is not proof of payment. Open billing and start checkout again if you still need a plan.
        </p>
        <Button asChild>
          <Link href="/dashboard/billing">Back to billing</Link>
        </Button>
      </div>
    );
  }

  const payment = await getPaymentByRef(ref);
  if (!payment || payment.organization_id !== user.organizationId) notFound();

  let latest = payment;
  if (payment.status === "pending" && isMoolreConfigured()) {
    const result = await reconcileMoolrePayment(ref);
    if (result.payment) latest = result.payment;
  }

  return (
    <div className="mx-auto max-w-lg space-y-4 animate-enter">
      <h1 className="text-2xl font-bold tracking-tight">Moolre checkout return</h1>
      <p className="text-sm text-muted-foreground">
        {latest.plan_slug} · {latest.billing_interval} · {formatCurrency(latest.amount)}
      </p>
      <ReturnPoller externalRef={ref} initialStatus={latest.status} />
      <Button asChild variant="outline">
        <Link href="/dashboard/billing">Back to billing</Link>
      </Button>
    </div>
  );
}
