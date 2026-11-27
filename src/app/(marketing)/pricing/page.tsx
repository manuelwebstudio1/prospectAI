import type { Metadata } from "next";
import { CtaLink } from "@/components/marketing/cta-link";
import { PageIntro } from "@/components/marketing/page-intro";
import { getRuntimePlans } from "@/services/admin/store";
import { formatCurrency } from "@/lib/utils";

export const metadata: Metadata = { title: "Pricing" };

export default async function PricingPage() {
  const plans = await getRuntimePlans();
  return (
    <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <PageIntro
        eyebrow="Pricing"
        title={
          <>
            Pricing that matches how agencies actually <em className="italic">work</em>
          </>
        }
        description="Credits are consumed only when work is done. Ghana checkout is processed by Moolre. Plans can be changed later from the admin dashboard."
      />
      <div className="mt-14 grid gap-5 lg:grid-cols-3">
        {plans.map((plan) => (
          <article
            key={plan.slug}
            className={`marketing-card relative z-0 flex flex-col p-6 transition duration-300 ease-out hover:z-10 hover:-translate-y-4 hover:scale-[1.04] hover:shadow-xl ${plan.highlighted ? "ring-1 ring-[#e85a2a]/35" : ""}`}
          >
            {plan.highlighted ? (
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#e85a2a]">Most popular</p>
            ) : null}
            <h2 className="mt-2 font-display text-3xl text-[#1c1917]">{plan.name}</h2>
            <p className="mt-1 text-sm text-[#6f6a64]">{plan.tagline}</p>
            <p className="mt-6 font-display text-4xl text-[#1c1917]">{formatCurrency(plan.monthlyGhs)}</p>
            <p className="text-sm text-[#6f6a64]">per month · {formatCurrency(plan.annualGhs)} billed annually</p>
            <ul className="mt-6 flex-1 space-y-2 text-sm text-[#3f3a36]">
              {plan.features.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
            <div className="mt-8">
              <CtaLink href="/register" variant={plan.highlighted ? "orange" : "dark"}>
                Start with {plan.name}
              </CtaLink>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
