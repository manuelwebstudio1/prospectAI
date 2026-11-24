import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "How it works" };

const flow = [
  { title: "Register a workspace", body: "Create an account, name your agency, and complete a short onboarding." },
  { title: "Configure a campaign", body: "Pick Ghana (or another supported country), a city, an industry and a discovery limit based on your plan." },
  { title: "Agents go to work", body: "The hunter finds businesses from authorized sources. The inspector checks websites. The researcher writes a structured report." },
  { title: "Generate a demo", body: "The architect chooses a structure. The generator produces a personalized, unofficial preview site." },
  { title: "Approve outreach", body: "The sales assistant drafts a message. You edit, approve, then send. Nothing goes out without you." },
  { title: "Track the lead", body: "Move the prospect through the pipeline until they become a paying client." },
];

export default function HowItWorksPage() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
      <h1 className="text-4xl font-bold tracking-tight">How ProspectAI works</h1>
      <p className="mt-4 text-slate-400">
        A complete acquisition workflow — from first search to signed client.
      </p>
      <ol className="mt-12 space-y-6">
        {flow.map((step, index) => (
          <li key={step.title} className="rounded-2xl border border-white/10 bg-[#101428] p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-300">
              {String(index + 1).padStart(2, "0")}
            </p>
            <h2 className="mt-2 text-xl font-semibold">{step.title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">{step.body}</p>
          </li>
        ))}
      </ol>
      <Button asChild className="mt-10" size="lg">
        <Link href="/register">Create your workspace</Link>
      </Button>
    </section>
  );
}
