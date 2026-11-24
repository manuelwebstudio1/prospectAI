import type { Metadata } from "next";
import { getRuntimePlans } from "@/services/admin/store";
import { PlanForm } from "@/components/admin/admin-forms";

export const metadata: Metadata = { title: "Admin plans" };

export default async function AdminPlansPage() {
  const plans = await getRuntimePlans();
  return (
    <div className="space-y-4 animate-enter">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Pricing plans</h1>
        <p className="text-sm text-muted-foreground">
          Changes apply to checkout amounts and billing copy. They are not shown as live revenue until a Moolre payment is fulfilled.
        </p>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        {plans.map((plan) => (
          <PlanForm key={plan.slug} plan={plan} />
        ))}
      </div>
    </div>
  );
}
