import type { Metadata } from "next";
import { CtaLink } from "@/components/marketing/cta-link";
import { PageIntro } from "@/components/marketing/page-intro";

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
      <PageIntro
        eyebrow="How it works"
        title={
          <>
            How ProspectAI <em className="italic">works</em>
          </>
        }
        description="A complete acquisition workflow — from first search to signed client."
      />
      <ol className="mt-14 space-y-5">
        {flow.map((step, index) => (
          <li key={step.title} className="marketing-card p-6">
            <p className="font-display text-2xl text-[#e85a2a]">{String(index + 1).padStart(2, "0")}</p>
            <h2 className="mt-2 text-xl font-semibold text-[#1c1917]">{step.title}</h2>
            <p className="mt-2 text-sm leading-6 text-[#6f6a64]">{step.body}</p>
          </li>
        ))}
      </ol>
      <div className="mt-10 flex justify-center">
        <CtaLink href="/register" size="lg">
          Get Started
        </CtaLink>
      </div>
    </section>
  );
}
