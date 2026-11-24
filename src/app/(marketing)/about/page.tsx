import type { Metadata } from "next";
import { PageIntro } from "@/components/marketing/page-intro";

export const metadata: Metadata = { title: "About" };

export default function AboutPage() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
      <PageIntro
        eyebrow="About"
        title={
          <>
            About <em className="italic">ProspectAI</em>
          </>
        }
        description="Built for people who make the web — and still spend too much of the week hunting for the next client."
      />
      <div className="marketing-card mt-12 space-y-5 p-8 text-base leading-7 text-[#3f3a36]">
        <p>
          ProspectAI exists because finding website clients is still mostly manual. Developers search Google Maps, guess whether a business has a site, mock something up, then write a cold email.
        </p>
        <p>
          We are building the system that does the operational work — discovery, inspection, research, demos and follow-up — so you can spend time on conversations that close.
        </p>
        <p>
          The first market is Ghana, with architecture designed for international expansion. We do not fabricate businesses, invent testimonials, or send unsolicited messages without your approval.
        </p>
        <p>
          ProspectAI is not simply an AI website builder. It is a client acquisition platform for people who build the web.
        </p>
      </div>
    </section>
  );
}
