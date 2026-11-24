import Link from "next/link";
import { Bot, Globe, Search, Sparkles, Target, Zap } from "lucide-react";
import { CtaLink } from "@/components/marketing/cta-link";
import { getRuntimePlans } from "@/services/admin/store";
import { formatCurrency } from "@/lib/utils";

const steps = [
  { title: "Configure a campaign", body: "Choose a city, industry and website status. ProspectAI queues a discovery job instantly." },
  { title: "Discover and inspect", body: "Authorized data sources find businesses. The inspector verifies whether a real website exists." },
  { title: "Research and generate", body: "The research agent builds a structured profile. The generator creates a personalized demo." },
  { title: "Outreach with approval", body: "Sales messages are drafted for you. Nothing is sent until you approve it." },
];

const features = [
  { icon: Search, title: "Business discovery", body: "Campaign-based search across Ghana first, with an architecture ready for more countries." },
  { icon: Globe, title: "Website detection", body: "Availability, redirects, content matching and quality signals — never a guess presented as fact." },
  { icon: Bot, title: "Multi-agent AI", body: "Specialized agents for hunting, inspecting, researching, architecting, generating and selling." },
  { icon: Sparkles, title: "Demo websites", body: "Industry templates personalized with verified information, clearly labelled as unofficial previews." },
  { icon: Target, title: "Lightweight CRM", body: "Pipeline stages from new lead to converted client, with notes, tags and activity history." },
  { icon: Zap, title: "Usage-based credits", body: "Separate counters for discovery, research, generation and outreach. Enforced server-side." },
];

export default async function LandingPage() {
  const plans = await getRuntimePlans();
  return (
    <>
      <section className="relative px-4 sm:px-6">
        <div className="mx-auto flex max-w-4xl flex-col items-center pb-28 pt-16 text-center sm:pt-24 lg:pt-28">
          <p className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#eadfd6] bg-white/80 px-3.5 py-1 text-sm text-[#3f3a36] shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-[#e85a2a]" />
            ProspectAI
          </p>
          <h1 className="font-display text-[2.75rem] leading-[1.08] tracking-[-0.035em] text-[#1c1917] sm:text-6xl lg:text-[5.15rem]">
            Find businesses.
            <br />
            Build <em className="italic">websites</em>.
            <br />
            Win clients.
          </h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-[#6f6a64] sm:text-lg">
            Discover businesses without professional websites, generate personalized demos, and run outreach — without spending your week on manual prospecting.
          </p>
          <div className="mt-9">
            <CtaLink href="/register" size="lg">
              Get Started
            </CtaLink>
          </div>
        </div>
      </section>

      <section className="px-4 pb-8 sm:px-6">
        <div className="mx-auto grid max-w-6xl gap-5 md:grid-cols-2 xl:grid-cols-4">
          {steps.map((step, index) => (
            <article key={step.title} className="marketing-card p-6">
              <p className="font-display text-3xl text-[#e85a2a]">{String(index + 1).padStart(2, "0")}</p>
              <h2 className="mt-4 text-lg font-semibold tracking-tight text-[#1c1917]">{step.title}</h2>
              <p className="mt-2 text-sm leading-6 text-[#6f6a64]">{step.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl tracking-[-0.03em] text-[#1c1917] sm:text-4xl">
              A client acquisition system, not a website toy.
            </h2>
            <p className="mt-4 text-[#6f6a64]">
              Every surface in ProspectAI exists to help you find, qualify and convert website clients.
            </p>
          </div>
          <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {features.map((feature) => (
              <article key={feature.title} className="marketing-card p-6">
                <feature.icon className="mb-4 h-5 w-5 text-[#e85a2a]" />
                <h3 className="font-semibold text-[#1c1917]">{feature.title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#6f6a64]">{feature.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 pb-20 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl tracking-[-0.03em] text-[#1c1917] sm:text-4xl">
              Simple, credit-based <em className="italic">pricing</em>
            </h2>
            <p className="mt-4 text-[#6f6a64]">
              Ghana Cedi pricing, billed through Moolre. Plans are configurable from the admin dashboard.
            </p>
          </div>
          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            {plans.map((plan) => (
              <article
                key={plan.slug}
                className={`marketing-card p-6 ${plan.highlighted ? "ring-1 ring-[#e85a2a]/35" : ""}`}
              >
                <p className="text-sm font-medium text-[#e85a2a]">{plan.name}</p>
                <p className="mt-2 font-display text-4xl text-[#1c1917]">{formatCurrency(plan.monthlyGhs)}</p>
                <p className="text-sm text-[#6f6a64]">per month</p>
                <ul className="mt-6 space-y-2 text-sm text-[#3f3a36]">
                  {plan.features.slice(0, 5).map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
                <div className="mt-8">
                  <CtaLink href="/register" variant={plan.highlighted ? "orange" : "dark"}>
                    Choose {plan.name}
                  </CtaLink>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 pb-8 sm:px-6">
        <div className="marketing-card mx-auto flex max-w-4xl flex-col items-center px-8 py-16 text-center">
          <h2 className="font-display text-3xl tracking-[-0.03em] text-[#1c1917] sm:text-4xl">
            Ready to find your next <em className="italic">client</em>?
          </h2>
          <p className="mt-4 max-w-lg text-[#6f6a64]">
            Create a workspace, run your first campaign, and see how ProspectAI turns discovery into signed work.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <CtaLink href="/register" size="lg">
              Get Started
            </CtaLink>
            <Link href="/how-it-works" className="text-sm font-medium text-[#3f3a36] underline-offset-4 hover:underline">
              See how it works
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
