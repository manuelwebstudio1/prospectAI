import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getRuntimePlans } from "@/services/admin/store";
import { formatCurrency } from "@/lib/utils";

export const metadata: Metadata = { title: "Pricing" };

export default async function PricingPage() {
  const plans = await getRuntimePlans();
  return (
    <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <h1 className="text-4xl font-bold tracking-tight">Pricing that matches how agencies actually work</h1>
      <p className="mt-4 max-w-2xl text-slate-400">
        Credits are consumed only when work is done. Ghana checkout is processed by Moolre. Plans can be changed later from the admin dashboard.
      </p>
      <div className="mt-12 grid gap-5 lg:grid-cols-3">
        {plans.map((plan) => (
          <article
            key={plan.slug}
            className={`flex flex-col rounded-2xl border p-6 ${
              plan.highlighted ? "border-violet-400 bg-violet-500/10" : "border-white/10 bg-[#101428]"
            }`}
          >
            {plan.highlighted ? (
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-200">Most popular</p>
            ) : null}
            <h2 className="mt-2 text-2xl font-bold">{plan.name}</h2>
            <p className="mt-1 text-sm text-slate-400">{plan.tagline}</p>
            <p className="mt-6 text-4xl font-bold">{formatCurrency(plan.monthlyGhs)}</p>
            <p className="text-sm text-slate-400">per month · {formatCurrency(plan.annualGhs)} billed annually</p>
            <ul className="mt-6 flex-1 space-y-2 text-sm text-slate-300">
              {plan.features.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
            <Button asChild className="mt-8">
              <Link href="/register">Start with {plan.name}</Link>
            </Button>
          </article>
        ))}
      </div>
    </section>
  );
}
