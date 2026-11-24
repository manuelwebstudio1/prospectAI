import type { Metadata } from "next";

export const metadata: Metadata = { title: "Features" };

const groups = [
  {
    title: "Discovery",
    items: [
      "Campaign-based business search by country, region, city and industry",
      "Website status filters: no website, poor website, or any",
      "Live campaign progress without freezing the UI",
      "Duplicate detection and normalized business records",
    ],
  },
  {
    title: "Intelligence",
    items: [
      "Website inspector with confidence scores and evidence",
      "Business researcher that refuses to invent facts",
      "Website architect that proposes industry-specific structures",
      "Provider-independent AI layer (Grok default, OpenAI optional)",
    ],
  },
  {
    title: "Conversion",
    items: [
      "Personalized unofficial demo websites",
      "Sales assistant drafts that require human approval",
      "Lead pipeline from new lead to converted client",
      "Usage credits enforced on the server",
    ],
  },
];

export default function FeaturesPage() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <h1 className="text-4xl font-bold tracking-tight">Everything you need to win website clients</h1>
      <p className="mt-4 max-w-2xl text-slate-400">
        ProspectAI combines discovery, research, demo generation and outreach in one workspace. Each capability is designed to be real, not decorative.
      </p>
      <div className="mt-12 grid gap-6 lg:grid-cols-3">
        {groups.map((group) => (
          <article key={group.title} className="rounded-2xl border border-white/10 bg-[#101428] p-6">
            <h2 className="text-lg font-semibold">{group.title}</h2>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-300">
              {group.items.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}
