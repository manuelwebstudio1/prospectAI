import Link from "next/link";
import { ArrowRight, Bot, Globe, Search, Sparkles, Target, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
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
      <section className="relative overflow-hidden">
        <div className="marketing-grid pointer-events-none absolute inset-0 opacity-60" />
        <div className="relative mx-auto max-w-6xl px-4 pb-24 pt-20 sm:px-6 sm:pt-28">
          <p className="mb-5 inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-violet-200">
            Built for developers & agencies
          </p>
          <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-6xl">
            Find businesses.
            <br />
            Build websites.
            <br />
            <span className="bg-gradient-to-r from-violet-300 to-sky-300 bg-clip-text text-transparent">
              Win clients.
            </span>
          </h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-slate-300 sm:text-lg">
            ProspectAI is an AI-powered client acquisition platform. Discover businesses without professional websites, generate personalized demos, and run outreach — without spending your week on manual prospecting.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/register">
                Start 14-day trial <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white/15 bg-white/5 text-white hover:bg-white/10">
              <Link href="/how-it-works">See how it works</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-[#0c1022] py-20">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 sm:px-6 md:grid-cols-2 xl:grid-cols-4">
          {steps.map((step, index) => (
            <article key={step.title} className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-300">
                Step {index + 1}
              </p>
              <h2 className="mt-3 text-lg font-semibold">{step.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">{step.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-3xl font-bold tracking-tight">A client acquisition system, not a website toy.</h2>
          <p className="mt-3 max-w-2xl text-slate-400">
            Every surface in ProspectAI exists to help you find, qualify and convert website clients.
          </p>
          <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {features.map((feature) => (
              <article key={feature.title} className="rounded-2xl border border-white/10 bg-[#101428] p-6">
                <feature.icon className="mb-4 h-5 w-5 text-violet-300" />
                <h3 className="font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">{feature.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 bg-[#0c1022] py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-3xl font-bold">Simple, credit-based pricing</h2>
          <p className="mt-3 text-slate-400">Ghana Cedi pricing, billed through Moolre. Plans are configurable from the admin dashboard.</p>
          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {plans.map((plan) => (
              <article
                key={plan.slug}
                className={`rounded-2xl border p-6 ${
                  plan.highlighted ? "border-violet-400 bg-violet-500/10" : "border-white/10 bg-white/5"
                }`}
              >
                <p className="text-sm text-violet-200">{plan.name}</p>
                <p className="mt-2 text-3xl font-bold">{formatCurrency(plan.monthlyGhs)}</p>
                <p className="text-sm text-slate-400">per month</p>
                <ul className="mt-6 space-y-2 text-sm text-slate-300">
                  {plan.features.slice(0, 5).map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
                <Button asChild className="mt-8 w-full" variant={plan.highlighted ? "default" : "outline"}>
                  <Link href="/register">Choose {plan.name}</Link>
                </Button>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
