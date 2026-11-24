import type { Metadata } from "next";

export const metadata: Metadata = { title: "About" };

export default function AboutPage() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
      <h1 className="text-4xl font-bold tracking-tight">About ProspectAI</h1>
      <div className="mt-6 space-y-5 text-base leading-7 text-slate-300">
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
