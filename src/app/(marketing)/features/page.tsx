import type { Metadata } from "next";
import { PageIntro } from "@/components/marketing/page-intro";

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
      "Grok Bot connects through a ProspectAI MCP connector — not an xAI API key",
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
      <PageIntro
        eyebrow="Features"
        title={
          <>
            Everything you need to win website <em className="italic">clients</em>
          </>
        }
        description="ProspectAI combines discovery, research, demo generation and outreach in one workspace. Each capability is designed to be real, not decorative."
      />
      <div className="mt-14 grid gap-6 lg:grid-cols-3">
        {groups.map((group) => (
          <article key={group.title} className="marketing-card relative z-0 p-6 transition duration-300 ease-out hover:z-10 hover:-translate-y-4 hover:scale-[1.04] hover:shadow-xl">
            <h2 className="font-display text-2xl text-[#1c1917]">{group.title}</h2>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-[#3f3a36]">
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
